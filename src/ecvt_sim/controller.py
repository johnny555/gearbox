"""Basic controller for powertrain torque split.

Implements rule-based control strategy:
1. Determine required wheel torque from driver demand
2. Select gear based on vehicle speed
3. Split torque between engine and MG2
4. Calculate MG1 reaction torque from planetary constraint
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional

from .powertrain import Powertrain, PowertrainState, PowertrainInput
from .components.gearbox import Gear


@dataclass
class ControllerParams:
    """Controller parameters."""

    # Gear shift thresholds
    upshift_speed: float = 25.0 / 3.6   # Upshift speed [m/s] (25 km/h)
    downshift_speed: float = 20.0 / 3.6  # Downshift speed [m/s] (20 km/h)
    max_grade_for_overdrive: float = 0.03  # Max grade for overdrive

    # Engine operating range preferences
    rpm_target: float = 1400.0          # Target engine RPM
    rpm_min_operate: float = 800.0      # Min operating RPM
    rpm_max_operate: float = 1700.0     # Max operating RPM

    # Power split preferences
    engine_power_fraction: float = 0.8  # Fraction of power from engine (vs battery)
    min_engine_load: float = 0.3        # Min engine load fraction when on

    # SOC management
    soc_target: float = 0.5             # Target SOC
    soc_charge_threshold: float = 0.4   # Start charging below this SOC
    soc_discharge_threshold: float = 0.7  # Allow discharge above this SOC


class Controller:
    """Rule-based powertrain controller.

    Strategy:
    1. If SOC low, bias toward engine power and MG1 generating
    2. If SOC high, allow more MG2 assist
    3. Use overdrive only at higher speeds on flat/mild grades
    4. Maintain engine in efficient operating range
    """

    def __init__(self, powertrain: Powertrain, params: ControllerParams = None):
        self.powertrain = powertrain
        self.params = params or ControllerParams()
        self._current_gear = Gear.LOW

    @property
    def gear(self) -> Gear:
        """Current gear selection."""
        return self._current_gear

    def select_gear(self, velocity: float, grade: float) -> Gear:
        """Select gear based on vehicle speed and grade.

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Selected gear
        """
        # Hysteresis-based gear selection
        if self._current_gear == Gear.LOW:
            # Check for upshift
            if velocity > self.params.upshift_speed and grade < self.params.max_grade_for_overdrive:
                self._current_gear = Gear.HIGH
        else:
            # Check for downshift
            if velocity < self.params.downshift_speed or grade > self.params.max_grade_for_overdrive:
                self._current_gear = Gear.LOW

        return self._current_gear

    def compute_torque_split(
        self,
        state: PowertrainState | np.ndarray,
        T_demand: float,
        grade: float = 0.0,
    ) -> PowertrainInput:
        """Compute torque commands for given demand.

        Args:
            state: Current powertrain state
            T_demand: Demanded wheel torque [N·m]
            grade: Road grade [fraction]

        Returns:
            PowertrainInput with torque commands
        """
        # Unpack state
        if isinstance(state, PowertrainState):
            omega_e, omega_r, soc = state.omega_e, state.omega_r, state.soc
        else:
            omega_e, omega_r, soc = state[0], state[1], state[2]

        # Get current velocity
        velocity = self.powertrain.get_vehicle_speed(omega_r)

        # Select gear
        gear = self.select_gear(velocity, grade)

        # Convert wheel torque demand to ring torque demand
        T_ring_demand = self.powertrain.gearbox.wheel_to_ring_torque(T_demand, gear)

        # Get engine and motor limits
        rpm_e = self.powertrain.engine.rads_to_rpm(omega_e)
        T_e_max = self.powertrain.engine.get_max_torque(rpm_e)

        omega_MG1 = self.powertrain.get_mg1_speed(omega_e, omega_r)
        rpm_MG1 = abs(omega_MG1) * 30 / np.pi
        rpm_MG2 = abs(omega_r) * 30 / np.pi

        T_MG1_min, T_MG1_max = self.powertrain.mg1.get_torque_limits(rpm_MG1)
        T_MG2_min, T_MG2_max = self.powertrain.mg2.get_torque_limits(rpm_MG2, use_boost=True)

        # Planetary gear ratio
        rho = self.powertrain.planetary.rho  # = 3.0

        # Strategy: Use engine as primary power source, MG2 for torque fill
        #
        # From planetary torque balance:
        #   τ_ring = -ρ · τ_MG1 + τ_MG2 (corrected sign)
        #   τ_sun = -τ_carrier / (1 + ρ) → T_MG1 = -T_e / (1 + ρ)
        #
        # For ρ = 3: T_MG1 = -T_e / 4
        # And: τ_ring_engine = -ρ·T_MG1 = 0.75·T_e

        # First, determine max engine torque limited by MG1 capability
        # MG1 must absorb T_MG1 = -T_e/(1+ρ), so |T_MG1| ≤ MG1 limit
        # Therefore: T_e ≤ (1+ρ) × |T_MG1_max|
        T_e_limited_by_MG1 = (1 + rho) * abs(T_MG1_min)  # T_MG1_min is negative

        # Engine torque limit (lower of engine capability and MG1 limit)
        T_e_available = min(T_e_max, T_e_limited_by_MG1)

        # Determine engine operating point
        if omega_e > 0 and T_e_available > 0:
            # Engine on - determine load factor
            if soc < self.params.soc_charge_threshold:
                # Low SOC: maximize engine load
                engine_load_factor = 0.9
            elif soc > self.params.soc_discharge_threshold:
                # High SOC: reduce engine load, use battery
                engine_load_factor = 0.5
            else:
                # Normal: moderate engine load
                engine_load_factor = self.params.engine_power_fraction

            T_e = T_e_available * engine_load_factor
        else:
            T_e = 0.0

        # MG1 must react to engine torque through planetary
        # T_MG1 = -T_e / (1 + ρ) for torque balance
        if T_e > 0:
            T_MG1 = -T_e / (1 + rho)
        else:
            T_MG1 = 0.0

        # Clip MG1 to limits (should be within limits due to T_e limiting above)
        T_MG1 = np.clip(T_MG1, T_MG1_min, T_MG1_max)

        # Calculate ring torque from engine path: τ_ring_engine = -ρ · τ_MG1
        # When MG1 generates (T_MG1 < 0), this produces positive ring torque
        T_ring_from_engine = -rho * T_MG1

        # MG2 provides the rest
        T_MG2 = T_ring_demand - T_ring_from_engine

        # Clip MG2 to limits
        T_MG2 = np.clip(T_MG2, T_MG2_min, T_MG2_max)

        return PowertrainInput(
            T_e=float(T_e),
            T_MG1=float(T_MG1),
            T_MG2=float(T_MG2),
            gear=int(gear),
        )

    def compute_speed_control(
        self,
        state: PowertrainState | np.ndarray,
        v_target: float,
        grade: float = 0.0,
        Kp: float = 50000.0,
    ) -> PowertrainInput:
        """Simple speed controller using proportional control.

        Args:
            state: Current powertrain state
            v_target: Target velocity [m/s]
            grade: Road grade [fraction]
            Kp: Proportional gain [N·m / (m/s)]

        Returns:
            PowertrainInput with torque commands
        """
        # Get current velocity
        if isinstance(state, PowertrainState):
            omega_r = state.omega_r
        else:
            omega_r = state[1]

        v_current = self.powertrain.get_vehicle_speed(omega_r)

        # Calculate base load torque for steady-state
        T_load = self.powertrain.vehicle.calc_wheel_torque_demand(v_target, grade)

        # Add proportional correction
        v_error = v_target - v_current
        T_correction = Kp * v_error

        # Total demanded wheel torque
        T_demand = T_load + T_correction

        # Limit to reasonable range
        T_demand = np.clip(T_demand, -500000, 1000000)

        return self.compute_torque_split(state, T_demand, grade)


def create_default_controller(powertrain: Powertrain) -> Controller:
    """Create controller with default parameters.

    Args:
        powertrain: Powertrain instance to control

    Returns:
        Controller instance
    """
    return Controller(powertrain)
