"""Drivetrain simulator with ODE integration."""

from typing import Callable, Dict, List, Optional, Union

import numpy as np
from numpy.typing import NDArray
from scipy.integrate import solve_ivp

from ..core.drivetrain import Drivetrain
from .config import SimulationConfig
from .result import SimulationResult


# Type aliases
ControlFunction = Callable[[float, Dict[str, float], float], Dict[str, float]]
GradeFunction = Callable[[float], float]


class DrivetrainSimulator:
    """Simulator for any drivetrain topology.

    Wraps the Drivetrain dynamics with ODE integration and result processing.
    """

    def __init__(self, drivetrain: Drivetrain):
        """Initialize the simulator.

        Args:
            drivetrain: Compiled drivetrain to simulate
        """
        self.drivetrain = drivetrain
        self._control_log: List[tuple] = []
        self._grade_log: List[tuple] = []

    def simulate(
        self,
        x0: Dict[str, float],
        controller: Union[ControlFunction, "DrivetrainController"],
        grade_profile: Union[float, GradeFunction] = 0.0,
        config: SimulationConfig = None,
    ) -> SimulationResult:
        """Run a time-domain simulation.

        Args:
            x0: Initial state {state_name: value}
            controller: Control function or controller object
                Function signature: (t, state_dict, grade) -> control_dict
            grade_profile: Road grade as constant or function of time
                Function signature: (t) -> grade
            config: Simulation configuration

        Returns:
            SimulationResult with all time series data
        """
        config = config or SimulationConfig()
        self._control_log = []
        self._grade_log = []

        # Convert initial state to array
        x0_arr = self.drivetrain.state_to_array(x0)

        # Wrap grade profile as function
        if callable(grade_profile):
            grade_fn = grade_profile
        else:
            grade_fn = lambda t: float(grade_profile)

        # Wrap controller
        if hasattr(controller, "compute"):
            control_fn = lambda t, state, grade: controller.compute(state, grade)
        else:
            control_fn = controller

        # Define dynamics wrapper for ODE solver
        def dynamics_wrapper(t: float, x: NDArray) -> NDArray:
            # Get current state as dict
            state = self.drivetrain.array_to_state(x)

            # Get grade
            grade = grade_fn(t)

            # Get control inputs
            control = control_fn(t, state, grade)

            # Log for post-processing
            self._control_log.append((t, control.copy()))
            self._grade_log.append((t, grade))

            # Compute dynamics
            return self.drivetrain.dynamics(t, x, control, {"grade": grade})

        # Set up output time points
        t_eval = config.get_output_times()

        # Run ODE integration
        sol = solve_ivp(
            dynamics_wrapper,
            (config.t_start, config.t_end),
            x0_arr,
            method=config.method,
            t_eval=t_eval,
            rtol=config.rtol,
            atol=config.atol,
            max_step=config.max_step if config.max_step else np.inf,
        )

        if not sol.success:
            raise RuntimeError(f"ODE integration failed: {sol.message}")

        # Build result
        return self._build_result(sol, config)

    def _build_result(self, sol, config: SimulationConfig) -> SimulationResult:
        """Build SimulationResult from ODE solution."""
        time = sol.t
        n_points = len(time)

        # Extract states
        states = {}
        for i, name in enumerate(self.drivetrain.state_names):
            states[name] = sol.y[i, :]

        # Interpolate control log to output times
        controls = self._interpolate_controls(time)

        # Compute derived outputs
        outputs = self._compute_outputs(time, sol.y, controls)

        # Metadata
        metadata = {
            "solver_method": config.method,
            "n_function_evals": sol.nfev,
            "drivetrain_type": type(self.drivetrain).__name__,
            "components": list(self.drivetrain.topology.components.keys()),
        }

        return SimulationResult(
            time=time,
            states=states,
            controls=controls,
            outputs=outputs,
            metadata=metadata,
        )

    def _interpolate_controls(self, time: NDArray) -> Dict[str, NDArray]:
        """Interpolate logged control inputs to output times."""
        if not self._control_log:
            return {}

        # Get all control keys
        all_keys = set()
        for _, ctrl in self._control_log:
            all_keys.update(ctrl.keys())

        # Build time series for each control
        log_times = np.array([t for t, _ in self._control_log])
        controls = {}

        for key in all_keys:
            values = np.array([ctrl.get(key, 0.0) for _, ctrl in self._control_log])
            controls[key] = np.interp(time, log_times, values)

        return controls

    def _compute_outputs(
        self, time: NDArray, y: NDArray, controls: Dict[str, NDArray]
    ) -> Dict[str, NDArray]:
        """Compute derived output quantities."""
        outputs = {}
        n_points = len(time)

        # Velocity
        velocities = np.zeros(n_points)
        for i in range(n_points):
            velocities[i] = self.drivetrain.get_velocity(y[:, i])
        outputs["velocity"] = velocities

        # Grade (from log)
        if self._grade_log:
            log_times = np.array([t for t, _ in self._grade_log])
            grades = np.array([g for _, g in self._grade_log])
            outputs["grade"] = np.interp(time, log_times, grades)

        # Power calculations
        outputs.update(self._compute_power_outputs(time, y, controls))

        return outputs

    def _compute_power_outputs(
        self, time: NDArray, y: NDArray, controls: Dict[str, NDArray]
    ) -> Dict[str, NDArray]:
        """Compute power-related outputs."""
        outputs = {}
        n_points = len(time)
        components = self.drivetrain.topology.components

        # Engine power
        for comp_name, component in components.items():
            if "Engine" in type(component).__name__:
                T_key = f"T_{comp_name}"
                if T_key in controls:
                    # Find engine speed in states
                    speed_key = f"{comp_name}.shaft"
                    omega = np.zeros(n_points)
                    speeds = self.drivetrain.get_all_speeds(y[:, 0])

                    for i in range(n_points):
                        all_speeds = self.drivetrain.get_all_speeds(y[:, i])
                        omega[i] = all_speeds.get(speed_key, 0.0)

                    torque = controls[T_key]
                    power = torque * omega
                    outputs[f"P_{comp_name}"] = power

                    # Fuel rate
                    if hasattr(component, "get_fuel_rate"):
                        fuel_rate = np.zeros(n_points)
                        for i in range(n_points):
                            fuel_rate[i] = component.get_fuel_rate(torque[i], omega[i])
                        outputs["fuel_rate"] = fuel_rate

        # Motor power
        for comp_name, component in components.items():
            if "Motor" in type(component).__name__:
                T_key = f"T_{comp_name}"
                if T_key in controls:
                    speed_key = f"{comp_name}.shaft"

                    omega = np.zeros(n_points)
                    for i in range(n_points):
                        all_speeds = self.drivetrain.get_all_speeds(y[:, i])
                        omega[i] = all_speeds.get(speed_key, 0.0)

                    torque = controls[T_key]
                    P_mech = torque * omega
                    outputs[f"P_{comp_name}_mech"] = P_mech

                    # Electrical power
                    if hasattr(component, "get_electrical_power"):
                        P_elec = np.zeros(n_points)
                        for i in range(n_points):
                            P_elec[i] = component.get_electrical_power(torque[i], omega[i])
                        outputs[f"P_{comp_name}_elec"] = P_elec

        return outputs


def simulate(
    drivetrain: Drivetrain,
    x0: Dict[str, float],
    controller: Union[ControlFunction, "DrivetrainController"],
    grade_profile: Union[float, GradeFunction] = 0.0,
    config: SimulationConfig = None,
) -> SimulationResult:
    """Convenience function to run a simulation.

    Args:
        drivetrain: Compiled drivetrain
        x0: Initial state
        controller: Control function or controller object
        grade_profile: Road grade (constant or function)
        config: Simulation configuration

    Returns:
        SimulationResult
    """
    simulator = DrivetrainSimulator(drivetrain)
    return simulator.simulate(x0, controller, grade_profile, config)
