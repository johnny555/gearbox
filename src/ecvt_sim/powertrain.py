"""Powertrain assembly implementing state-space dynamics.

State vector: x = [ω_e, ω_r, SOC]ᵀ
- ω_e: Engine/carrier angular velocity [rad/s]
- ω_r: Ring gear/MG2 angular velocity [rad/s]
- SOC: Battery state of charge [0-1]

Control input: u = [T_e, T_MG1, T_MG2, gear]ᵀ
- T_e: Engine torque [N·m]
- T_MG1: MG1 torque [N·m]
- T_MG2: MG2 torque [N·m]
- gear: Gear selection {1=LOW, 2=HIGH}

Disturbance: d = [grade]
- grade: Road grade [fraction]

Extended topology support:
- MG1 can have a reduction gear to the sun: MG1 → Reduction → Sun
- Output drivetrain can be a chain: Ring → Gearbox → Intermediate → Diff → Hub → Wheels
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional, Union

from .components.planetary_gear import PlanetaryGear, PlanetaryGearParams
from .components.engine import Engine, EngineParams
from .components.motor import Motor, MotorParams, MG1_PARAMS, MG2_PARAMS
from .components.battery import Battery, BatteryParams
from .components.gearbox import Gearbox, GearboxParams, Gear
from .components.vehicle import Vehicle, VehicleParams
from .components.drivetrain import (
    DrivetrainComponent,
    Reduction,
    SelectableGearbox,
    ReductionChain,
)


@dataclass
class PowertrainState:
    """Powertrain state vector."""

    omega_e: float = 0.0    # Engine/carrier speed [rad/s]
    omega_r: float = 0.0    # Ring gear speed [rad/s]
    soc: float = 0.6        # Battery SOC [0-1]

    def to_array(self) -> np.ndarray:
        """Convert to numpy array."""
        return np.array([self.omega_e, self.omega_r, self.soc])

    @classmethod
    def from_array(cls, x: np.ndarray) -> "PowertrainState":
        """Create from numpy array."""
        return cls(omega_e=x[0], omega_r=x[1], soc=x[2])


@dataclass
class PowertrainInput:
    """Powertrain control input."""

    T_e: float = 0.0        # Engine torque [N·m]
    T_MG1: float = 0.0      # MG1 torque [N·m]
    T_MG2: float = 0.0      # MG2 torque [N·m]
    gear: int = 1           # Gear selection {1=LOW, 2=HIGH}

    def to_array(self) -> np.ndarray:
        """Convert to numpy array (excluding gear)."""
        return np.array([self.T_e, self.T_MG1, self.T_MG2])


@dataclass
class PowertrainOutput:
    """Powertrain output variables."""

    # Speeds
    omega_e: float = 0.0        # Engine speed [rad/s]
    omega_r: float = 0.0        # Ring gear speed [rad/s]
    omega_MG1: float = 0.0      # MG1 speed [rad/s]
    velocity: float = 0.0       # Vehicle velocity [m/s]

    # Torques
    T_wheel: float = 0.0        # Wheel torque [N·m]
    T_load: float = 0.0         # Load torque at ring [N·m]

    # Powers
    P_engine: float = 0.0       # Engine power [W]
    P_MG1: float = 0.0          # MG1 electrical power [W]
    P_MG2: float = 0.0          # MG2 electrical power [W]
    P_battery: float = 0.0      # Battery power [W]

    # State
    soc: float = 0.0            # Battery SOC
    gear: int = 1               # Current gear


class Powertrain:
    """Complete powertrain model with state-space dynamics.

    Couples planetary gear, engine, motors, battery, gearbox, and vehicle
    into a unified state-space model.

    Extended topology support:
    - MG1 can have a reduction gear to the sun: MG1 → Reduction → Sun
    - Output drivetrain can be a modular chain: Ring → [Gearbox] → [Reductions...] → Wheels

    Inertia matrix (2-DOF mechanical system):

        J = [J_eq1,  J_12 ]
            [J_12,   J_eq2 + J_v_refl]

    Where:
        J_eq1 = J_e + (1+ρ)² · J_MG1_eff
        J_12  = -(1+ρ) · ρ · J_MG1_eff
        J_eq2 = J_MG2 + ρ² · J_MG1_eff
        J_v_refl = m_v · r_w² / K_total²

        J_MG1_eff = J_MG1 / K_mg1² (MG1 inertia reflected through reduction)

    Torque equations:
        J · [dω_e/dt, dω_r/dt]ᵀ = [τ_e + (1+ρ)·τ_sun, ρ·τ_sun + τ_MG2 - τ_load]ᵀ

        Where τ_sun = T_MG1 * K_mg1 * η_mg1 (MG1 torque at sun gear)
    """

    def __init__(
        self,
        planetary_params: PlanetaryGearParams = None,
        engine_params: EngineParams = None,
        mg1_params: MotorParams = None,
        mg2_params: MotorParams = None,
        battery_params: BatteryParams = None,
        gearbox_params: GearboxParams = None,
        vehicle_params: VehicleParams = None,
        payload_fraction: float = 1.0,
        # New modular drivetrain options
        mg1_reduction: Union[Reduction, float, None] = None,
        output_drivetrain: Union[ReductionChain, DrivetrainComponent, None] = None,
    ):
        """Initialize powertrain with component parameters.

        Args:
            planetary_params: Planetary gear parameters
            engine_params: Engine parameters
            mg1_params: MG1 motor parameters
            mg2_params: MG2 motor parameters
            battery_params: Battery parameters
            gearbox_params: Legacy gearbox parameters (used if output_drivetrain is None)
            vehicle_params: Vehicle parameters
            payload_fraction: Fraction of full payload [0-1]
            mg1_reduction: Optional reduction between MG1 and sun gear.
                          Can be a Reduction object or just a ratio (float).
                          If None, MG1 connects directly to sun (1:1).
            output_drivetrain: Optional modular output drivetrain (ReductionChain or component).
                              If None, uses legacy Gearbox from gearbox_params.
        """
        # Create core components
        self.planetary = PlanetaryGear(planetary_params or PlanetaryGearParams())
        self.engine = Engine(engine_params or EngineParams())
        self.mg1 = Motor(mg1_params or MG1_PARAMS, name="MG1")
        self.mg2 = Motor(mg2_params or MG2_PARAMS, name="MG2")
        self.battery = Battery(battery_params or BatteryParams())
        self.vehicle = Vehicle(vehicle_params or VehicleParams(), payload_fraction)

        # MG1 reduction gear (MG1 → Reduction → Sun)
        if mg1_reduction is None:
            self.mg1_reduction = Reduction(1.0, 1.0, name="MG1:Sun")
        elif isinstance(mg1_reduction, (int, float)):
            self.mg1_reduction = Reduction(float(mg1_reduction), 0.97, name="MG1:Sun")
        else:
            self.mg1_reduction = mg1_reduction

        # Output drivetrain (Ring → ... → Wheels)
        if output_drivetrain is not None:
            self._output_drivetrain = output_drivetrain
            self._use_legacy_gearbox = False
            # Create a dummy gearbox for backward compatibility
            self.gearbox = Gearbox(gearbox_params or GearboxParams())
        else:
            self._output_drivetrain = None
            self._use_legacy_gearbox = True
            self.gearbox = Gearbox(gearbox_params or GearboxParams())

        # Cache planetary ratio
        self._rho = self.planetary.rho

        # Compute equivalent inertias
        self._compute_inertias()

    def _compute_inertias(self):
        """Compute equivalent inertias for state-space model."""
        rho = self._rho
        J_e = self.engine.J
        J_MG2 = self.mg2.J

        # MG1 inertia reflected through reduction to sun gear
        K_mg1 = self.mg1_reduction.ratio
        J_MG1_at_sun = self.mg1.J / (K_mg1 ** 2)

        # Equivalent inertias from kinematic constraint
        self._J_eq1 = J_e + (1 + rho) ** 2 * J_MG1_at_sun
        self._J_12 = -(1 + rho) * rho * J_MG1_at_sun
        self._J_eq2 = J_MG2 + rho ** 2 * J_MG1_at_sun

    @property
    def output_drivetrain(self) -> Union[DrivetrainComponent, None]:
        """Get the output drivetrain component/chain."""
        return self._output_drivetrain

    def get_output_ratio(self, gear: int = None) -> float:
        """Get total output drivetrain ratio (ring to wheel).

        Args:
            gear: Gear index for selectable gearbox (0-based). If None, uses current gear.

        Returns:
            Total ratio from ring gear to wheels
        """
        if self._use_legacy_gearbox:
            return self.gearbox.get_total_ratio(gear)
        else:
            # For modular drivetrain, gear selection is handled by SelectableGearbox component
            return self._output_drivetrain.ratio

    def get_output_efficiency(self) -> float:
        """Get total output drivetrain efficiency."""
        if self._use_legacy_gearbox:
            return self.gearbox.params.eta_total
        else:
            return self._output_drivetrain.efficiency

    def set_gear(self, gear: int):
        """Set the current gear.

        Args:
            gear: Gear index (0-based for modular, 1-based for legacy)
        """
        if self._use_legacy_gearbox:
            self.gearbox.gear = gear
        else:
            # Find SelectableGearbox in the drivetrain chain and set its gear
            if isinstance(self._output_drivetrain, SelectableGearbox):
                self._output_drivetrain.current_gear = gear
            elif isinstance(self._output_drivetrain, ReductionChain):
                for component in self._output_drivetrain.components:
                    if isinstance(component, SelectableGearbox):
                        component.current_gear = gear
                        break

    def get_current_gear(self) -> int:
        """Get the current gear index."""
        if self._use_legacy_gearbox:
            return self.gearbox.gear
        else:
            if isinstance(self._output_drivetrain, SelectableGearbox):
                return self._output_drivetrain.current_gear
            elif isinstance(self._output_drivetrain, ReductionChain):
                for component in self._output_drivetrain.components:
                    if isinstance(component, SelectableGearbox):
                        return component.current_gear
            return 0  # No selectable gearbox found

    def get_inertia_matrix(self, gear: int = None) -> np.ndarray:
        """Get 2x2 inertia matrix including reflected vehicle inertia.

        Args:
            gear: Gear selection. If None, uses current gearbox gear.

        Returns:
            2x2 inertia matrix [kg·m²]
        """
        K_total = self.get_output_ratio(gear)
        J_v_refl = self.vehicle.mass * self.vehicle.r_wheel ** 2 / K_total ** 2

        J = np.array([
            [self._J_eq1, self._J_12],
            [self._J_12, self._J_eq2 + J_v_refl]
        ])
        return J

    def get_sun_speed(self, omega_e: float, omega_r: float) -> float:
        """Calculate sun gear speed from Willis equation.

        ω_sun = (1+ρ)·ω_e - ρ·ω_r

        Args:
            omega_e: Engine/carrier speed [rad/s]
            omega_r: Ring gear speed [rad/s]

        Returns:
            Sun gear speed [rad/s]
        """
        return self.planetary.calc_sun_speed(omega_e, omega_r)

    def get_mg1_speed(self, omega_e: float, omega_r: float) -> float:
        """Calculate MG1 motor speed accounting for reduction gear.

        ω_MG1 = ω_sun / K_mg1 (MG1 runs slower than sun by factor of K_mg1)

        The reduction gear between MG1 and sun means:
        - MG1 runs at lower speed than sun (K_mg1 = sun_speed / mg1_speed)
        - MG1 torque is multiplied at sun (T_sun = T_MG1 * K_mg1)

        Args:
            omega_e: Engine/carrier speed [rad/s]
            omega_r: Ring gear speed [rad/s]

        Returns:
            MG1 motor speed [rad/s]
        """
        omega_sun = self.planetary.calc_sun_speed(omega_e, omega_r)
        # MG1 runs slower than sun: omega_MG1 = omega_sun / K_mg1
        return self.mg1_reduction.input_to_output_speed(omega_sun)

    def get_sun_torque_from_mg1(self, T_mg1: float) -> float:
        """Calculate sun gear torque from MG1 motor torque.

        T_sun = T_MG1 * K_mg1 * η_mg1

        Args:
            T_mg1: MG1 motor torque [N·m]

        Returns:
            Torque at sun gear [N·m]
        """
        return self.mg1_reduction.input_to_output_torque(T_mg1)

    def get_vehicle_speed(self, omega_r: float, gear: int = None) -> float:
        """Calculate vehicle speed from ring gear speed.

        Args:
            omega_r: Ring gear speed [rad/s]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Vehicle speed [m/s]
        """
        if self._use_legacy_gearbox:
            return self.gearbox.ring_to_vehicle_speed(omega_r, self.vehicle.r_wheel, gear)
        else:
            if gear is not None:
                self.set_gear(gear)
            omega_wheel = self._output_drivetrain.input_to_output_speed(omega_r)
            return omega_wheel * self.vehicle.r_wheel

    def get_ring_speed(self, velocity: float, gear: int = None) -> float:
        """Calculate ring gear speed from vehicle velocity.

        Args:
            velocity: Vehicle velocity [m/s]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Ring gear speed [rad/s]
        """
        if self._use_legacy_gearbox:
            return self.gearbox.vehicle_to_ring_speed(velocity, self.vehicle.r_wheel, gear)
        else:
            if gear is not None:
                self.set_gear(gear)
            omega_wheel = velocity / self.vehicle.r_wheel
            return self._output_drivetrain.output_to_input_speed(omega_wheel)

    def get_load_torque(self, omega_r: float, grade: float, gear: int = None) -> float:
        """Calculate load torque at ring gear.

        Args:
            omega_r: Ring gear speed [rad/s]
            grade: Road grade [fraction]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Load torque at ring gear [N·m]
        """
        velocity = self.get_vehicle_speed(omega_r, gear)
        T_wheel = self.vehicle.calc_wheel_torque_demand(velocity, grade)

        if self._use_legacy_gearbox:
            return self.gearbox.wheel_to_ring_torque(T_wheel, gear)
        else:
            return self._output_drivetrain.output_to_input_torque(T_wheel)

    def get_wheel_torque(self, T_ring: float, gear: int = None) -> float:
        """Calculate wheel torque from ring gear torque.

        Args:
            T_ring: Ring gear torque [N·m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Wheel torque [N·m]
        """
        if self._use_legacy_gearbox:
            return self.gearbox.ring_to_wheel_torque(T_ring, gear)
        else:
            if gear is not None:
                self.set_gear(gear)
            return self._output_drivetrain.input_to_output_torque(T_ring)

    def get_rimpull(self, T_ring: float, gear: int = None) -> float:
        """Calculate rimpull (tractive force) from ring gear torque.

        F_rimpull = T_wheel / r_wheel

        Args:
            T_ring: Ring gear torque [N·m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Rimpull force [N]
        """
        T_wheel = self.get_wheel_torque(T_ring, gear)
        return T_wheel / self.vehicle.r_wheel

    def dynamics(
        self,
        t: float,
        x: np.ndarray,
        u: PowertrainInput | np.ndarray,
        grade: float = 0.0,
    ) -> np.ndarray:
        """Compute state derivatives for ODE integration.

        Args:
            t: Time [s] (unused, for ODE solver compatibility)
            x: State vector [omega_e, omega_r, SOC]
            u: Control input (PowertrainInput or array [T_e, T_MG1, T_MG2])
            grade: Road grade [fraction]

        Returns:
            State derivatives [dω_e/dt, dω_r/dt, dSOC/dt]
        """
        # Unpack state
        omega_e, omega_r, soc = x[0], x[1], x[2]

        # Unpack input
        if isinstance(u, PowertrainInput):
            T_e, T_MG1, T_MG2 = u.T_e, u.T_MG1, u.T_MG2
            gear = u.gear
        else:
            T_e, T_MG1, T_MG2 = u[0], u[1], u[2]
            gear = int(u[3]) if len(u) > 3 else self.gearbox.gear

        # Set gear
        self.set_gear(gear)

        # Calculate MG1 speed
        omega_MG1 = self.get_mg1_speed(omega_e, omega_r)

        # Calculate load torque at ring gear
        T_load = self.get_load_torque(omega_r, grade, gear)

        # Build inertia matrix
        J = self.get_inertia_matrix(gear)

        # Calculate sun torque from MG1 through reduction gear
        # T_sun = T_MG1 * K_mg1 * η_mg1
        T_sun = self.get_sun_torque_from_mg1(T_MG1)

        # Torque vector (using ρ: τ1 = Te + (1+ρ)·T_sun, τ2 = -ρ·T_sun + TMG2 - Tload)
        # Note: The -ρ·T_sun term means MG1 generating (T_MG1 < 0) adds torque to ring
        rho = self._rho
        tau = np.array([
            T_e + (1 + rho) * T_sun,
            -rho * T_sun + T_MG2 - T_load
        ])

        # Solve for accelerations: J · [dω_e, dω_r]ᵀ = τ
        d_omega = np.linalg.solve(J, tau)

        # Battery dynamics
        P_MG1 = self.mg1.get_electrical_power(T_MG1, omega_MG1)
        P_MG2 = self.mg2.get_electrical_power(T_MG2, omega_r)
        P_battery = P_MG1 + P_MG2

        d_soc = self.battery.get_soc_derivative(P_battery, soc)

        return np.array([d_omega[0], d_omega[1], d_soc])

    def get_output(
        self,
        x: np.ndarray | PowertrainState,
        u: PowertrainInput | np.ndarray,
        grade: float = 0.0,
    ) -> PowertrainOutput:
        """Calculate output variables from state and input.

        Args:
            x: State vector or PowertrainState
            u: Control input
            grade: Road grade [fraction]

        Returns:
            PowertrainOutput with all computed variables
        """
        # Unpack state
        if isinstance(x, PowertrainState):
            omega_e, omega_r, soc = x.omega_e, x.omega_r, x.soc
        else:
            omega_e, omega_r, soc = x[0], x[1], x[2]

        # Unpack input
        if isinstance(u, PowertrainInput):
            T_e, T_MG1, T_MG2, gear = u.T_e, u.T_MG1, u.T_MG2, u.gear
        else:
            T_e, T_MG1, T_MG2 = u[0], u[1], u[2]
            gear = int(u[3]) if len(u) > 3 else self.gearbox.gear

        # Set gear
        self.set_gear(gear)

        # Calculate derived quantities
        omega_MG1 = self.get_mg1_speed(omega_e, omega_r)
        velocity = self.get_vehicle_speed(omega_r, gear)
        T_load = self.get_load_torque(omega_r, grade, gear)
        T_wheel = self.vehicle.calc_wheel_torque_demand(velocity, grade)

        # Powers
        P_engine = T_e * omega_e
        P_MG1 = self.mg1.get_electrical_power(T_MG1, omega_MG1)
        P_MG2 = self.mg2.get_electrical_power(T_MG2, omega_r)
        P_battery = P_MG1 + P_MG2

        return PowertrainOutput(
            omega_e=omega_e,
            omega_r=omega_r,
            omega_MG1=omega_MG1,
            velocity=velocity,
            T_wheel=T_wheel,
            T_load=T_load,
            P_engine=P_engine,
            P_MG1=P_MG1,
            P_MG2=P_MG2,
            P_battery=P_battery,
            soc=soc,
            gear=gear,
        )

    def validate_operating_point(
        self,
        x: np.ndarray | PowertrainState,
        u: PowertrainInput | np.ndarray,
    ) -> dict:
        """Check if operating point is valid and return constraint status.

        Args:
            x: State vector
            u: Control input

        Returns:
            Dictionary with constraint status for each component
        """
        # Unpack
        if isinstance(x, PowertrainState):
            omega_e, omega_r, soc = x.omega_e, x.omega_r, x.soc
        else:
            omega_e, omega_r, soc = x[0], x[1], x[2]

        if isinstance(u, PowertrainInput):
            T_e, T_MG1, T_MG2 = u.T_e, u.T_MG1, u.T_MG2
        else:
            T_e, T_MG1, T_MG2 = u[0], u[1], u[2]

        omega_MG1 = self.get_mg1_speed(omega_e, omega_r)

        rpm_e = self.engine.rads_to_rpm(omega_e)
        rpm_MG1 = self.mg1.rads_to_rpm(abs(omega_MG1))
        rpm_MG2 = self.mg2.rads_to_rpm(abs(omega_r))

        P_MG1 = self.mg1.get_electrical_power(T_MG1, omega_MG1)
        P_MG2 = self.mg2.get_electrical_power(T_MG2, omega_r)
        P_battery = P_MG1 + P_MG2

        return {
            "engine_valid": self.engine.is_valid_operating_point(rpm_e, T_e),
            "mg1_valid": self.mg1.is_valid_operating_point(rpm_MG1, abs(T_MG1)),
            "mg2_valid": self.mg2.is_valid_operating_point(rpm_MG2, abs(T_MG2)),
            "battery_valid": self.battery.can_provide_power(P_battery, soc),
            "soc_valid": self.battery.params.SOC_min <= soc <= self.battery.params.SOC_max,
        }


def create_cat_793d_powertrain(
    payload_fraction: float = 1.0,
    mg1_reduction: Union[Reduction, float, None] = None,
    output_drivetrain: Union[ReductionChain, DrivetrainComponent, None] = None,
) -> Powertrain:
    """Create powertrain with CAT 793D default parameters.

    Args:
        payload_fraction: Fraction of full payload [0-1]
        mg1_reduction: Optional MG1 to sun reduction (Reduction or ratio float)
        output_drivetrain: Optional modular output drivetrain

    Returns:
        Configured Powertrain instance
    """
    return Powertrain(
        payload_fraction=payload_fraction,
        mg1_reduction=mg1_reduction,
        output_drivetrain=output_drivetrain,
    )


def create_cat_793d_ecvt_powertrain(
    payload_fraction: float = 1.0,
    mg1_sun_ratio: float = 3.5,
    post_ring_ratio: float = 1.0,
    gearbox_ratios: list[float] = None,
    intermediate_ratio: float = 2.85,
    diff_ratio: float = 1.0,
    hub_ratio: float = 10.83,
) -> Powertrain:
    """Create CAT 793D e-CVT powertrain with modular drivetrain.

    Default configuration:
        MG1 → 3.5:1 → Sun
        Ring/MG2 → PostRing → Gearbox → Intermediate → Diff → Hub → Wheels

    Args:
        payload_fraction: Fraction of full payload [0-1]
        mg1_sun_ratio: MG1 to sun gear reduction ratio (default 3.5:1)
        post_ring_ratio: Reduction after ring/MG2 before gearbox (default 1.0:1)
        gearbox_ratios: List of [low_ratio, high_ratio] (default [3.0, 1.0])
        intermediate_ratio: Intermediate reduction ratio (default 2.85:1)
        diff_ratio: Differential ratio (default 1.0:1)
        hub_ratio: Wheel hub reduction ratio (default 10.83:1)

    Returns:
        Configured Powertrain instance with modular drivetrain
    """
    if gearbox_ratios is None:
        gearbox_ratios = [3.0, 1.0]

    # MG1 reduction to sun gear
    mg1_reduction = Reduction(
        ratio=mg1_sun_ratio,
        efficiency=0.97,
        name="MG1:Sun"
    )

    # Build output drivetrain chain
    components = []

    # Post-ring reduction (after MG2)
    if post_ring_ratio != 1.0:
        components.append(Reduction(ratio=post_ring_ratio, efficiency=0.97, name="PostRing"))

    # Gearbox
    components.append(
        SelectableGearbox(
            ratios=gearbox_ratios,
            efficiencies=[0.97] * len(gearbox_ratios),
            gear_names=["Low", "High"] if len(gearbox_ratios) == 2 else None,
            name="Gearbox"
        )
    )

    # Remaining reductions
    components.append(Reduction(ratio=intermediate_ratio, efficiency=0.97, name="Intermediate"))
    components.append(Reduction(ratio=diff_ratio, efficiency=0.98, name="Diff"))
    components.append(Reduction(ratio=hub_ratio, efficiency=0.96, name="WheelHub"))

    output_drivetrain = ReductionChain(components, name="OutputDrive")

    return Powertrain(
        payload_fraction=payload_fraction,
        mg1_reduction=mg1_reduction,
        output_drivetrain=output_drivetrain,
    )
