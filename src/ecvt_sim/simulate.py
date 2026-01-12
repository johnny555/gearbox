"""Simulation runner using scipy.integrate.solve_ivp.

Provides time integration of the powertrain state-space model with:
- Configurable initial conditions
- Time-varying control inputs or closed-loop control
- Result logging and post-processing
"""

import numpy as np
from scipy.integrate import solve_ivp
from dataclasses import dataclass, field
from typing import Callable, Optional

from .powertrain import Powertrain, PowertrainState, PowertrainInput, PowertrainOutput
from .controller import Controller


@dataclass
class SimulationConfig:
    """Simulation configuration."""

    t_start: float = 0.0            # Start time [s]
    t_end: float = 60.0             # End time [s]
    dt_output: float = 0.1          # Output time step [s]
    method: str = "RK45"            # Integration method
    rtol: float = 1e-6              # Relative tolerance
    atol: float = 1e-9              # Absolute tolerance


@dataclass
class SimulationResult:
    """Simulation results container."""

    t: np.ndarray = field(default_factory=lambda: np.array([]))
    omega_e: np.ndarray = field(default_factory=lambda: np.array([]))
    omega_r: np.ndarray = field(default_factory=lambda: np.array([]))
    soc: np.ndarray = field(default_factory=lambda: np.array([]))

    # Derived quantities (computed post-simulation)
    omega_MG1: np.ndarray = field(default_factory=lambda: np.array([]))
    velocity: np.ndarray = field(default_factory=lambda: np.array([]))
    rpm_e: np.ndarray = field(default_factory=lambda: np.array([]))
    rpm_MG1: np.ndarray = field(default_factory=lambda: np.array([]))
    rpm_r: np.ndarray = field(default_factory=lambda: np.array([]))

    # Control inputs
    T_e: np.ndarray = field(default_factory=lambda: np.array([]))
    T_MG1: np.ndarray = field(default_factory=lambda: np.array([]))
    T_MG2: np.ndarray = field(default_factory=lambda: np.array([]))
    gear: np.ndarray = field(default_factory=lambda: np.array([]))

    # Powers
    P_engine: np.ndarray = field(default_factory=lambda: np.array([]))
    P_MG1: np.ndarray = field(default_factory=lambda: np.array([]))
    P_MG2: np.ndarray = field(default_factory=lambda: np.array([]))
    P_battery: np.ndarray = field(default_factory=lambda: np.array([]))

    # Load
    T_load: np.ndarray = field(default_factory=lambda: np.array([]))
    grade: np.ndarray = field(default_factory=lambda: np.array([]))

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {k: v for k, v in self.__dict__.items()}


def simulate(
    powertrain: Powertrain,
    x0: PowertrainState | np.ndarray,
    controller: Controller | Callable = None,
    grade_profile: Callable[[float], float] = None,
    config: SimulationConfig = None,
    v_target: float = None,
) -> SimulationResult:
    """Run time-domain simulation of powertrain.

    Args:
        powertrain: Powertrain model instance
        x0: Initial state
        controller: Controller instance or callable(t, x) -> PowertrainInput
        grade_profile: Grade as function of time, callable(t) -> grade
        config: Simulation configuration
        v_target: Target velocity for closed-loop control [m/s]

    Returns:
        SimulationResult with time histories
    """
    config = config or SimulationConfig()

    # Convert initial state to array
    if isinstance(x0, PowertrainState):
        x0_arr = x0.to_array()
    else:
        x0_arr = np.asarray(x0)

    # Default grade profile (flat)
    if grade_profile is None:
        grade_profile = lambda t: 0.0

    # Storage for control inputs during integration
    control_log = []
    grade_log = []

    def dynamics_wrapper(t, x):
        """Wrapper for ODE solver."""
        grade = grade_profile(t)

        # Get control input
        if controller is not None:
            if isinstance(controller, Controller):
                if v_target is not None:
                    u = controller.compute_speed_control(x, v_target, grade)
                else:
                    # Compute based on steady-state demand
                    v_current = powertrain.get_vehicle_speed(x[1])
                    T_demand = powertrain.vehicle.calc_wheel_torque_demand(v_current, grade)
                    u = controller.compute_torque_split(x, T_demand, grade)
            else:
                u = controller(t, x)
        else:
            # Open loop: zero torques
            u = PowertrainInput()

        # Log control inputs
        control_log.append((t, u.T_e, u.T_MG1, u.T_MG2, u.gear))
        grade_log.append((t, grade))

        # Compute dynamics
        return powertrain.dynamics(t, x, u, grade)

    # Output time points
    t_eval = np.arange(config.t_start, config.t_end + config.dt_output, config.dt_output)

    # Run integration
    sol = solve_ivp(
        dynamics_wrapper,
        (config.t_start, config.t_end),
        x0_arr,
        method=config.method,
        t_eval=t_eval,
        rtol=config.rtol,
        atol=config.atol,
    )

    if not sol.success:
        raise RuntimeError(f"Integration failed: {sol.message}")

    # Build result
    result = SimulationResult(
        t=sol.t,
        omega_e=sol.y[0],
        omega_r=sol.y[1],
        soc=sol.y[2],
    )

    # Compute derived quantities
    result.omega_MG1 = np.array([
        powertrain.get_mg1_speed(oe, oR)
        for oe, oR in zip(result.omega_e, result.omega_r)
    ])
    result.velocity = np.array([
        powertrain.get_vehicle_speed(oR)
        for oR in result.omega_r
    ])

    # Convert to RPM
    result.rpm_e = result.omega_e * 30 / np.pi
    result.rpm_MG1 = result.omega_MG1 * 30 / np.pi
    result.rpm_r = result.omega_r * 30 / np.pi

    # Interpolate control inputs to output times
    if control_log:
        ctrl_t = np.array([c[0] for c in control_log])
        ctrl_Te = np.array([c[1] for c in control_log])
        ctrl_TMG1 = np.array([c[2] for c in control_log])
        ctrl_TMG2 = np.array([c[3] for c in control_log])
        ctrl_gear = np.array([c[4] for c in control_log])

        result.T_e = np.interp(result.t, ctrl_t, ctrl_Te)
        result.T_MG1 = np.interp(result.t, ctrl_t, ctrl_TMG1)
        result.T_MG2 = np.interp(result.t, ctrl_t, ctrl_TMG2)
        result.gear = np.interp(result.t, ctrl_t, ctrl_gear).astype(int)

    # Interpolate grade
    if grade_log:
        grade_t = np.array([g[0] for g in grade_log])
        grade_v = np.array([g[1] for g in grade_log])
        result.grade = np.interp(result.t, grade_t, grade_v)
    else:
        result.grade = np.zeros_like(result.t)

    # Compute powers
    result.P_engine = result.T_e * result.omega_e
    result.P_MG1 = np.array([
        powertrain.mg1.get_electrical_power(T, omega)
        for T, omega in zip(result.T_MG1, result.omega_MG1)
    ])
    result.P_MG2 = np.array([
        powertrain.mg2.get_electrical_power(T, omega)
        for T, omega in zip(result.T_MG2, result.omega_r)
    ])
    result.P_battery = result.P_MG1 + result.P_MG2

    # Compute load torque
    result.T_load = np.array([
        powertrain.get_load_torque(omega_r, grade)
        for omega_r, grade in zip(result.omega_r, result.grade)
    ])

    return result


def simulate_steady_state(
    powertrain: Powertrain,
    velocity: float,
    grade: float = 0.0,
    gear: int = 1,
) -> PowertrainOutput:
    """Calculate steady-state operating point.

    Args:
        powertrain: Powertrain model
        velocity: Target velocity [m/s]
        grade: Road grade [fraction]
        gear: Gear selection

    Returns:
        PowertrainOutput at steady-state
    """
    # Set gear
    powertrain.gearbox.gear = gear

    # Calculate ring speed from velocity
    omega_r = powertrain.gearbox.vehicle_to_ring_speed(
        velocity, powertrain.vehicle.r_wheel, gear
    )

    # Load torque at steady state
    T_load = powertrain.get_load_torque(omega_r, grade, gear)

    # For steady state, assume engine at target RPM
    # and MG1 speed follows from Willis equation
    rpm_e_target = 1400  # Target engine RPM
    omega_e = rpm_e_target * np.pi / 30

    # MG1 speed from Willis
    omega_MG1 = powertrain.get_mg1_speed(omega_e, omega_r)

    # Get available engine torque
    T_e_max = powertrain.engine.get_max_torque(rpm_e_target)

    # Planetary ratio
    rho = powertrain.planetary.rho

    # For steady state: τ_ring = -ρ·τ_MG1 + τ_MG2 = T_load
    # And: τ_MG1 = -T_e / (1 + ρ)

    # If engine provides T_e, ring gets: τ_ring_engine = -ρ·τ_MG1 = ρ·T_e/(1+ρ)
    # For ρ=3: τ_ring_engine = 3·T_e/4 = 0.75·T_e

    # MG2 must provide: T_MG2 = T_load - τ_ring_engine

    # Use 70% engine load as default
    T_e = 0.7 * T_e_max
    T_MG1 = -T_e / (1 + rho)
    T_ring_from_engine = -rho * T_MG1  # Positive when MG1 generates
    T_MG2 = T_load - T_ring_from_engine

    # Create state and input
    state = PowertrainState(omega_e=omega_e, omega_r=omega_r, soc=0.5)
    u = PowertrainInput(T_e=T_e, T_MG1=T_MG1, T_MG2=T_MG2, gear=gear)

    return powertrain.get_output(state, u, grade)
