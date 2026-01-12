"""Abstract base class for drivetrain components."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .ports import Port
from .constraints import KinematicConstraint


@dataclass
class ComponentState:
    """State of a component at a point in time.

    Attributes:
        port_speeds: Angular velocities at each mechanical port [rad/s]
        port_torques: Torques at each mechanical port [N·m]
        internal_states: Component-specific state variables (e.g., SOC, temperature)
    """

    port_speeds: Dict[str, float] = field(default_factory=dict)
    port_torques: Dict[str, float] = field(default_factory=dict)
    internal_states: Dict[str, float] = field(default_factory=dict)


class DrivetrainComponent(ABC):
    """Abstract base class for all drivetrain components.

    A drivetrain component represents a physical element in the powertrain
    such as an engine, motor, gearbox, planetary gear set, battery, or vehicle.

    Components expose ports for mechanical or electrical connections,
    define kinematic constraints between their ports, and compute
    torques and state derivatives for simulation.

    Subclasses must implement:
        - ports: Dict of available connection ports
        - state_names: List of internal state variable names
        - get_inertia: Rotational inertia at each mechanical port
        - get_constraints: Kinematic constraints within the component
        - compute_torques: Calculate port torques from speeds and control inputs
        - compute_state_derivatives: Calculate derivatives of internal states
    """

    def __init__(self, name: str = ""):
        """Initialize the component.

        Args:
            name: Optional name for this component instance
        """
        self._name = name or self.__class__.__name__

    @property
    def name(self) -> str:
        """Get the component name."""
        return self._name

    @name.setter
    def name(self, value: str) -> None:
        """Set the component name."""
        self._name = value

    @property
    @abstractmethod
    def ports(self) -> Dict[str, Port]:
        """Return the available connection ports.

        Returns:
            Dict mapping port names to Port objects
        """
        pass

    @property
    @abstractmethod
    def state_names(self) -> List[str]:
        """Return names of internal state variables.

        Internal states are variables that evolve over time according
        to ODEs, such as battery SOC or thermal state.

        Returns:
            List of state variable names (empty if no internal states)
        """
        pass

    @abstractmethod
    def get_inertia(self, port_name: str) -> float:
        """Get the rotational inertia at a mechanical port.

        Args:
            port_name: Name of the port

        Returns:
            Rotational inertia [kg·m²] seen at this port

        Raises:
            ValueError: If port_name is not a valid mechanical port
        """
        pass

    @abstractmethod
    def get_constraints(self) -> List[KinematicConstraint]:
        """Get kinematic constraints within this component.

        Returns:
            List of constraints relating port speeds/torques
        """
        pass

    @abstractmethod
    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Compute torques at each port.

        Given the current port speeds and control inputs, calculate
        the torque produced/absorbed at each mechanical port.

        Args:
            port_speeds: Angular velocity at each port [rad/s]
            control_inputs: Control commands (e.g., throttle, torque setpoint)
            internal_states: Current internal state values (if any)

        Returns:
            Dict mapping port names to torques [N·m]
        """
        pass

    @abstractmethod
    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute derivatives of internal states.

        Args:
            internal_states: Current values of internal states
            port_values: Current port speeds, torques, and powers

        Returns:
            Dict mapping state names to their time derivatives
        """
        pass

    def get_port(self, name: str) -> Port:
        """Get a port by name.

        Args:
            name: Name of the port

        Returns:
            The Port object

        Raises:
            KeyError: If no port with this name exists
        """
        if name not in self.ports:
            raise KeyError(f"Component '{self._name}' has no port named '{name}'")
        return self.ports[name]

    def has_port(self, name: str) -> bool:
        """Check if a port exists."""
        return name in self.ports

    def get_mechanical_ports(self) -> Dict[str, Port]:
        """Get all mechanical ports."""
        from .ports import PortType

        return {name: port for name, port in self.ports.items() if port.port_type == PortType.MECHANICAL}

    def get_electrical_ports(self) -> Dict[str, Port]:
        """Get all electrical ports."""
        from .ports import PortType

        return {name: port for name, port in self.ports.items() if port.port_type == PortType.ELECTRICAL}

    def get_total_inertia(self) -> float:
        """Get sum of inertias at all mechanical ports."""
        return sum(self.get_inertia(name) for name in self.get_mechanical_ports())

    def validate(self) -> List[str]:
        """Validate component configuration.

        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []

        # Check that all ports have unique names
        port_names = list(self.ports.keys())
        if len(port_names) != len(set(port_names)):
            errors.append("Duplicate port names")

        # Check that constraints reference valid ports
        for constraint in self.get_constraints():
            relation = constraint.get_speed_relation()
            for port_name in relation.keys():
                if port_name not in self.ports:
                    errors.append(f"Constraint references unknown port '{port_name}'")

        return errors

    def __repr__(self) -> str:
        ports_str = ", ".join(self.ports.keys())
        return f"{self.__class__.__name__}(name='{self._name}', ports=[{ports_str}])"
