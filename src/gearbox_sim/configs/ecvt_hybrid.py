"""eCVT hybrid 789D drivetrain configuration.

Topology (Power-Split Mode):
    Engine -> Planetary Gear <- MG1
                   |
                   v
                 Ring -> Gearbox -> Final Drive -> Vehicle
                   ^
                   |
                 MG2 <- Battery (electrical bus)

This represents a power-split hybrid with:
- CAT 3516C diesel engine (1,566 kW)
- Planetary gear set (ρ = 3.0)
- MG1 on sun gear (220 kW continuous / 400 kW boost)
- MG2 on ring gear (430 kW)
- 200 kWh battery
- 2-speed gearbox (5.0:1 low, 0.67:1 overdrive)

CAT 789D specifications:
- Empty mass: 130,000 kg
- Payload: 164,000 kg (181 tons)
- GVW: 294,000 kg
- Wheel radius: 1.67 m (37.00R57 tires)
- Max speed: 57.2 km/h
"""

from ..core.topology import DrivetrainTopology
from ..core.drivetrain import Drivetrain
from ..components.engine import EngineComponent, CAT_3516C_PARAMS
from ..components.motor import MotorComponent, MG1_789D_PARAMS, MG2_789D_PARAMS
from ..components.planetary import PlanetaryGearComponent, CAT_793D_PLANETARY_PARAMS
from ..components.gearbox import NSpeedGearboxComponent, GearboxParams, FinalDriveComponent
from ..components.battery import BatteryComponent, CAT_793D_BATTERY_PARAMS
from ..components.vehicle import VehicleComponent, CAT_789D_PARAMS


# 2-speed gearbox for eCVT
ECVT_GEARBOX_PARAMS = GearboxParams(
    ratios=[5.0, 0.67],  # Low and overdrive
    efficiencies=[0.97, 0.97],
    J_input=5.0,
    J_output=5.0,
)


def create_ecvt_789d(
    payload_fraction: float = 1.0,
    rolling_resistance: float = 0.025,
    initial_soc: float = 0.6,
) -> Drivetrain:
    """Create an eCVT hybrid CAT 789D drivetrain.

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
    engine = EngineComponent(CAT_3516C_PARAMS, name="engine")

    mg1 = MotorComponent(MG1_789D_PARAMS, name="MG1")
    mg2 = MotorComponent(MG2_789D_PARAMS, name="MG2")

    planetary = PlanetaryGearComponent(CAT_793D_PLANETARY_PARAMS, name="planetary")

    gearbox = NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS, name="gearbox")

    final_drive = FinalDriveComponent(ratio=16.0, efficiency=0.96, name="final_drive")

    battery_params = CAT_793D_BATTERY_PARAMS
    battery_params.SOC_init = initial_soc
    battery = BatteryComponent(battery_params, name="battery")

    vehicle_params = CAT_789D_PARAMS
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
    r_wheel = 1.67  # 789D wheel radius
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
        target_engine_rpm: float = 1300.0,  # Optimal for 3516C
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
