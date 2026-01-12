"""eCVT hybrid 793D drivetrain configuration.

Topology (Power-Split Mode):
    Engine -> Planetary Gear <- MG1
                   |
                   v
                 Ring -> Gearbox -> Final Drive -> Vehicle
                   ^
                   |
                 MG2 <- Battery (electrical bus)

Topology (Locked Sun Mode):
    Engine -> Planetary Gear (sun locked, 4:3 ratio)
                   |
                   v
                 Ring -> MG2 -> Gearbox -> Final Drive -> Vehicle

This represents a power-split hybrid with:
- CAT 3516E diesel engine (1,801 kW)
- Planetary gear set (ρ = 3.0)
- MG1 on sun gear (200 kW) - can be locked for high torque mode
- MG2 on ring gear (350 kW / 500 kW boost)
- 200 kWh battery
- 2-speed gearbox (5.0:1 low, 0.67:1 overdrive)

Operating Modes:
- Power-split: MG1 provides reaction, allows CVT operation
- Locked sun: Sun brake engaged, planetary becomes 4:3 fixed ratio
  - Provides ~3x more torque at low speeds
  - No electrical power recirculation through MG1
"""

from ..core.topology import DrivetrainTopology
from ..core.drivetrain import Drivetrain
from ..components.engine import EngineComponent, CAT_3516E_PARAMS
from ..components.motor import MotorComponent, MG1_PARAMS, MG2_PARAMS
from ..components.planetary import PlanetaryGearComponent, CAT_793D_PLANETARY_PARAMS
from ..components.gearbox import NSpeedGearboxComponent, GearboxParams, FinalDriveComponent
from ..components.battery import BatteryComponent, CAT_793D_BATTERY_PARAMS
from ..components.vehicle import VehicleComponent, CAT_793D_PARAMS


# 2-speed gearbox for eCVT
ECVT_GEARBOX_PARAMS = GearboxParams(
    ratios=[5.0, 0.67],  # Low and overdrive
    efficiencies=[0.97, 0.97],
    J_input=5.0,
    J_output=5.0,
)


def create_ecvt_793d(
    payload_fraction: float = 1.0,
    rolling_resistance: float = 0.025,
    initial_soc: float = 0.6,
) -> Drivetrain:
    """Create an eCVT hybrid CAT 793D drivetrain.

    Topology:
        Engine -> Planetary (carrier)
        MG1 -> Planetary (sun)
        Planetary (ring) -> MG2 shaft -> Gearbox -> Final Drive -> Vehicle
        MG1, MG2 <-> Battery (electrical)

    Note: The electrical connections are handled at the control level,
    not as physical connections in the topology.

    Args:
        payload_fraction: Fraction of full payload [0-1]
        rolling_resistance: Rolling resistance coefficient
        initial_soc: Initial battery state of charge [0-1]

    Returns:
        Compiled Drivetrain ready for simulation
    """
    # Create components
    engine = EngineComponent(CAT_3516E_PARAMS, name="engine")

    mg1 = MotorComponent(MG1_PARAMS, name="MG1")
    mg2 = MotorComponent(MG2_PARAMS, name="MG2")

    planetary = PlanetaryGearComponent(CAT_793D_PLANETARY_PARAMS, name="planetary")

    gearbox = NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS, name="gearbox")

    final_drive = FinalDriveComponent(ratio=16.0, efficiency=0.96, name="final_drive")

    battery_params = CAT_793D_BATTERY_PARAMS
    battery_params.SOC_init = initial_soc
    battery = BatteryComponent(battery_params, name="battery")

    vehicle_params = CAT_793D_PARAMS
    vehicle_params.C_r = rolling_resistance
    vehicle = VehicleComponent(vehicle_params, payload_fraction, name="vehicle")

    # Build topology
    # Note: MG2 is mechanically coupled to the ring gear path
    # The connection MG2.shaft -> gearbox.input represents this
    topology = (
        DrivetrainTopology()
        .add_component("engine", engine)
        .add_component("MG1", mg1)
        .add_component("MG2", mg2)
        .add_component("planetary", planetary)
        .add_component("gearbox", gearbox)
        .add_component("final_drive", final_drive)
        .add_component("battery", battery)
        .add_component("vehicle", vehicle)
        # Mechanical connections
        .connect("engine", "shaft", "planetary", "carrier")
        .connect("MG1", "shaft", "planetary", "sun")
        .connect("planetary", "ring", "MG2", "shaft")
        .connect("MG2", "shaft", "gearbox", "input")
        .connect("gearbox", "output", "final_drive", "input")
        .connect("final_drive", "output", "vehicle", "wheels")
        # Electrical connections (handled at control level)
        # .connect("MG1", "electrical", "battery", "electrical")
        # .connect("MG2", "electrical", "battery", "electrical")
        .set_output("vehicle", "wheels")
    )

    return topology.build()


def get_initial_state(
    engine_rpm: float = 800.0,
    vehicle_velocity: float = 0.0,
    soc: float = 0.6,
) -> dict:
    """Get initial state for eCVT simulation.

    Note: The actual state names depend on how the topology is compiled.
    The independent DOFs are: engine.shaft, MG1.shaft, planetary.ring

    Args:
        engine_rpm: Initial engine RPM
        vehicle_velocity: Initial velocity [m/s]
        soc: Initial battery SOC

    Returns:
        Initial state dict
    """
    import numpy as np

    omega_e = engine_rpm * np.pi / 30.0

    # Calculate ring speed from vehicle velocity
    # v = omega_wheel * r_wheel
    # omega_wheel = omega_ring / (K_gearbox * K_final)
    r_wheel = 1.78
    K_gearbox = 5.0  # Low gear
    K_final = 16.0
    omega_wheel = vehicle_velocity / r_wheel
    omega_r = omega_wheel * K_gearbox * K_final

    # Calculate MG1 speed from Willis equation
    # omega_MG1 = (1+rho)*omega_engine - rho*omega_ring
    rho = 3.0
    omega_mg1 = (1 + rho) * omega_e - rho * omega_r

    return {
        "engine.shaft": omega_e,
        "MG1.shaft": omega_mg1,
        "planetary.ring": omega_r,
        "battery.SOC": soc,
    }


class ECVTController:
    """Controller for eCVT hybrid drivetrain.

    Implements power-split control strategy:
    - Engine operates at efficient RPM
    - MG1 controls engine speed (reaction torque)
    - MG2 provides fill torque for vehicle demand
    - Battery buffers power flow
    """

    def __init__(
        self,
        drivetrain: Drivetrain,
        target_engine_rpm: float = 1200.0,
        Kp: float = 50000.0,
    ):
        """Initialize eCVT controller.

        Args:
            drivetrain: eCVT drivetrain
            target_engine_rpm: Target engine operating RPM
            Kp: Speed control gain
        """
        self.drivetrain = drivetrain
        self.target_engine_rpm = target_engine_rpm
        self.Kp = Kp
        self._target_velocity = 10.0
        self._rho = 3.0  # Planetary ratio

    @property
    def target_velocity(self) -> float:
        return self._target_velocity

    @target_velocity.setter
    def target_velocity(self, value: float) -> None:
        self._target_velocity = value

    def compute(self, state: dict, grade: float) -> dict:
        """Compute control inputs.

        Args:
            state: Current state
            grade: Road grade

        Returns:
            Control dict
        """
        import numpy as np

        # Get current state (using actual independent DOF names)
        omega_e = state.get("engine.shaft", 0.0)
        omega_r = state.get("planetary.ring", 0.0)
        soc = state.get("battery.SOC", 0.6)

        # Get velocity
        x = self.drivetrain.state_to_array(state)
        velocity = self.drivetrain.get_velocity(x)

        # Speed error
        v_error = self._target_velocity - velocity

        # Total torque demand
        T_demand = self.Kp * v_error

        # Engine torque (based on demand and SOC)
        # Higher SOC -> less engine, lower SOC -> more engine
        soc_factor = 1.0 - (soc - 0.5) * 2.0  # 0 at SOC=1, 2 at SOC=0
        soc_factor = max(0.2, min(1.5, soc_factor))

        T_engine = max(0.0, T_demand * 0.5 * soc_factor)

        # Clip engine torque
        engine = self.drivetrain.get_component("engine")
        rpm = omega_e * 30.0 / np.pi
        T_engine = engine.clip_torque(rpm, T_engine)

        # MG1 reaction torque (from planetary constraint)
        # T_MG1 = -T_engine / (1 + rho) for torque balance
        rho = self._rho
        T_MG1_required = -T_engine / (1.0 + rho) if T_engine > 0 else 0.0

        # Clip MG1 to motor limits and adjust engine torque if needed
        mg1 = self.drivetrain.get_component("MG1")
        all_speeds = self.drivetrain.get_all_speeds(x)
        omega_mg1 = all_speeds.get("MG1.shaft", 0.0)
        rpm_mg1 = abs(omega_mg1) * 30.0 / np.pi
        T_MG1 = mg1.clip_torque(rpm_mg1, T_MG1_required)

        # If MG1 was clipped, reduce engine torque to maintain balance
        if abs(T_MG1) < abs(T_MG1_required) - 1:
            # T_MG1 = -T_engine / (1+rho), so T_engine = -T_MG1 * (1+rho)
            T_engine = -T_MG1 * (1.0 + rho) if T_MG1 < 0 else 0.0
            T_engine = engine.clip_torque(rpm, T_engine)

        # MG2 fill torque
        # Ring gets 0.75 * T_engine from planetary (for rho=3)
        T_ring_from_engine = rho * (-T_MG1)  # = 0.75 * T_engine
        T_MG2 = T_demand - T_ring_from_engine

        # Clip MG2
        mg2 = self.drivetrain.get_component("MG2")
        rpm_mg2 = abs(omega_r) * 30.0 / np.pi
        T_MG2 = mg2.clip_torque(rpm_mg2, T_MG2)

        # Gear selection (simple speed-based)
        gear = 0 if velocity < 8.0 else 1

        return {
            "T_engine": T_engine,
            "T_MG1": T_MG1,
            "T_MG2": T_MG2,
            "gear_gearbox": gear,
        }


def create_ecvt_793d_locked_sun(
    payload_fraction: float = 1.0,
    rolling_resistance: float = 0.025,
    initial_soc: float = 0.6,
) -> Drivetrain:
    """Create an eCVT hybrid CAT 793D drivetrain with sun gear locked.

    In this mode, the sun gear brake is engaged, making the planetary
    gear act as a fixed ratio gear (4:3 from carrier to ring).

    Topology:
        Engine -> Planetary (carrier) -> Ring (4:3 ratio) -> MG2 -> Gearbox -> Vehicle
        MG1 is not connected (sun is locked by brake)

    Advantages over power-split:
    - Higher torque at low speeds (no MG1 power limit)
    - All engine power flows mechanically
    - MG2 can add boost torque

    Args:
        payload_fraction: Fraction of full payload [0-1]
        rolling_resistance: Rolling resistance coefficient
        initial_soc: Initial battery state of charge [0-1]

    Returns:
        Compiled Drivetrain ready for simulation
    """
    from ..components.gearbox import FixedRatioGearComponent

    # Create components
    engine = EngineComponent(CAT_3516E_PARAMS, name="engine")

    # In locked sun mode, planetary becomes a fixed ratio gear
    # With sun locked (ω_sun=0): ω_ring = (1+ρ)/ρ * ω_carrier = 4/3 * ω_engine
    # This is a 1.333:1 speed increase (0.75:1 torque multiplication)
    planetary_locked = FixedRatioGearComponent(
        ratio=3.0 / 4.0,  # carrier:ring ratio (ring spins faster)
        efficiency=0.98,
        J_input=1.0,  # Carrier inertia
        J_output=0.5,  # Ring inertia
        name="planetary_locked",
    )

    # MG2 still on ring
    mg2 = MotorComponent(MG2_PARAMS, name="MG2")

    gearbox = NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS, name="gearbox")
    final_drive = FinalDriveComponent(ratio=16.0, efficiency=0.96, name="final_drive")

    battery_params = CAT_793D_BATTERY_PARAMS
    battery_params.SOC_init = initial_soc
    battery = BatteryComponent(battery_params, name="battery")

    vehicle_params = CAT_793D_PARAMS
    vehicle_params.C_r = rolling_resistance
    vehicle = VehicleComponent(vehicle_params, payload_fraction, name="vehicle")

    # Build topology (simpler than power-split)
    topology = (
        DrivetrainTopology()
        .add_component("engine", engine)
        .add_component("planetary_locked", planetary_locked)
        .add_component("MG2", mg2)
        .add_component("gearbox", gearbox)
        .add_component("final_drive", final_drive)
        .add_component("battery", battery)
        .add_component("vehicle", vehicle)
        # Mechanical connections
        .connect("engine", "shaft", "planetary_locked", "input")
        .connect("planetary_locked", "output", "MG2", "shaft")
        .connect("MG2", "shaft", "gearbox", "input")
        .connect("gearbox", "output", "final_drive", "input")
        .connect("final_drive", "output", "vehicle", "wheels")
        .set_output("vehicle", "wheels")
    )

    return topology.build()


def get_initial_state_locked(
    engine_rpm: float = 800.0,
    vehicle_velocity: float = 0.0,
    soc: float = 0.6,
) -> dict:
    """Get initial state for locked-sun eCVT simulation.

    Args:
        engine_rpm: Initial engine RPM
        vehicle_velocity: Initial velocity [m/s]
        soc: Initial battery SOC

    Returns:
        Initial state dict
    """
    import numpy as np

    omega_e = engine_rpm * np.pi / 30.0

    return {
        "engine.shaft": omega_e,
        "battery.SOC": soc,
    }


class ECVTLockedSunController:
    """Controller for eCVT with sun gear locked.

    In locked sun mode:
    - Sun brake is engaged (ω_sun = 0)
    - Planetary acts as fixed 4:3 ratio gear
    - Engine provides main propulsion
    - MG2 provides boost/fill torque
    - No MG1 control (it's locked)
    """

    def __init__(
        self,
        drivetrain: Drivetrain,
        Kp: float = 50000.0,
    ):
        """Initialize locked sun controller.

        Args:
            drivetrain: eCVT drivetrain (locked sun version)
            Kp: Speed control gain
        """
        self.drivetrain = drivetrain
        self.Kp = Kp
        self._target_velocity = 10.0

    @property
    def target_velocity(self) -> float:
        return self._target_velocity

    @target_velocity.setter
    def target_velocity(self, value: float) -> None:
        self._target_velocity = value

    def compute(self, state: dict, grade: float) -> dict:
        """Compute control inputs for locked sun mode.

        Args:
            state: Current state
            grade: Road grade

        Returns:
            Control dict
        """
        import numpy as np

        # Get current state
        omega_e = state.get("engine.shaft", 0.0)
        soc = state.get("battery.SOC", 0.6)

        # Get velocity
        x = self.drivetrain.state_to_array(state)
        velocity = self.drivetrain.get_velocity(x)

        # Speed error
        v_error = self._target_velocity - velocity

        # Total torque demand at ring (after planetary)
        T_demand = self.Kp * v_error

        # Engine torque (main propulsion)
        # Ring gets 0.75 * T_engine from the 4:3 planetary ratio
        T_engine_for_demand = T_demand / 0.75  # Scale up for planetary ratio

        # SOC-based modulation
        soc_factor = 1.0 - (soc - 0.5) * 2.0
        soc_factor = max(0.2, min(1.5, soc_factor))
        T_engine = max(0.0, T_engine_for_demand * soc_factor)

        # Clip engine torque
        engine = self.drivetrain.get_component("engine")
        rpm = omega_e * 30.0 / np.pi
        T_engine = engine.clip_torque(rpm, T_engine)

        # MG2 fill torque (direct to ring)
        T_ring_from_engine = 0.75 * T_engine
        T_MG2 = T_demand - T_ring_from_engine

        # Clip MG2
        mg2 = self.drivetrain.get_component("MG2")
        all_speeds = self.drivetrain.get_all_speeds(x)
        omega_mg2 = all_speeds.get("MG2.shaft", 0.0)
        rpm_mg2 = abs(omega_mg2) * 30.0 / np.pi
        T_MG2 = mg2.clip_torque(rpm_mg2, T_MG2, use_boost=True)

        # Gear selection
        gear = 0 if velocity < 8.0 else 1

        return {
            "T_engine": T_engine,
            "T_MG2": T_MG2,
            "gear_gearbox": gear,
        }


class ECVTDualModeController:
    """Controller that can switch between power-split and locked-sun modes.

    Automatically selects mode based on operating conditions:
    - Locked sun: Low speed, high load (needs max torque)
    - Power-split: Higher speeds, normal load (better efficiency)
    """

    def __init__(
        self,
        drivetrain_split: Drivetrain,
        drivetrain_locked: Drivetrain,
        Kp: float = 50000.0,
        lock_velocity_threshold: float = 3.0,  # m/s
        lock_grade_threshold: float = 0.08,  # 8% grade
    ):
        """Initialize dual-mode controller.

        Args:
            drivetrain_split: Power-split drivetrain
            drivetrain_locked: Locked-sun drivetrain
            Kp: Speed control gain
            lock_velocity_threshold: Use locked mode below this velocity
            lock_grade_threshold: Use locked mode above this grade
        """
        self.ctrl_split = ECVTController(drivetrain_split, Kp=Kp)
        self.ctrl_locked = ECVTLockedSunController(drivetrain_locked, Kp=Kp)
        self.lock_v_thresh = lock_velocity_threshold
        self.lock_grade_thresh = lock_grade_threshold
        self._target_velocity = 10.0
        self._current_mode = "split"

    @property
    def target_velocity(self) -> float:
        return self._target_velocity

    @target_velocity.setter
    def target_velocity(self, value: float) -> None:
        self._target_velocity = value
        self.ctrl_split.target_velocity = value
        self.ctrl_locked.target_velocity = value

    @property
    def current_mode(self) -> str:
        return self._current_mode

    def should_use_locked_mode(self, velocity: float, grade: float) -> bool:
        """Determine if locked sun mode should be used.

        Use locked mode when:
        - Low speed AND high grade (starting on steep hill)
        - Very low speed regardless of grade (launch)
        """
        if velocity < 1.0:  # Nearly stopped
            return True
        if velocity < self.lock_v_thresh and abs(grade) > self.lock_grade_thresh:
            return True
        return False

    def compute(
        self, state_split: dict, state_locked: dict, grade: float
    ) -> tuple[dict, str]:
        """Compute control for the appropriate mode.

        Args:
            state_split: State dict for power-split drivetrain
            state_locked: State dict for locked-sun drivetrain
            grade: Road grade

        Returns:
            Tuple of (control_dict, mode_name)
        """
        # Determine velocity from split drivetrain
        x = self.ctrl_split.drivetrain.state_to_array(state_split)
        velocity = self.ctrl_split.drivetrain.get_velocity(x)

        if self.should_use_locked_mode(velocity, grade):
            self._current_mode = "locked"
            return self.ctrl_locked.compute(state_locked, grade), "locked"
        else:
            self._current_mode = "split"
            return self.ctrl_split.compute(state_split, grade), "split"
