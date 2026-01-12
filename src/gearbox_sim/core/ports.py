"""Port and connection definitions for drivetrain components."""

from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional


class PortType(Enum):
    """Type of connection port."""

    MECHANICAL = auto()  # Rotating shaft: (omega [rad/s], torque [N·m])
    ELECTRICAL = auto()  # Power bus: (voltage [V], current [A])


class PortDirection(Enum):
    """Direction of power flow at a port."""

    INPUT = auto()  # Power flows into component
    OUTPUT = auto()  # Power flows out of component
    BIDIRECTIONAL = auto()  # Power can flow either direction


@dataclass(frozen=True)
class Port:
    """A connection point on a drivetrain component.

    Ports represent physical connection points where components interact.
    Mechanical ports are rotating shafts with speed (omega) and torque.
    Electrical ports are power connections with voltage and current.

    Attributes:
        name: Unique identifier for this port within a component
        port_type: Whether this is a mechanical or electrical port
        direction: Whether power flows in, out, or both directions
        description: Optional human-readable description
    """

    name: str
    port_type: PortType
    direction: PortDirection = PortDirection.BIDIRECTIONAL
    description: str = ""

    def __str__(self) -> str:
        return f"{self.name} ({self.port_type.name.lower()})"


@dataclass(frozen=True)
class Connection:
    """A connection between two component ports.

    Represents a physical connection (shaft coupling, electrical wire)
    between two component ports. Both ports must be of the same type.

    Attributes:
        from_component: Name of the source component
        from_port: Name of the port on the source component
        to_component: Name of the destination component
        to_port: Name of the port on the destination component
    """

    from_component: str
    from_port: str
    to_component: str
    to_port: str

    def __str__(self) -> str:
        return f"{self.from_component}.{self.from_port} -> {self.to_component}.{self.to_port}"

    def involves(self, component_name: str) -> bool:
        """Check if this connection involves a specific component."""
        return self.from_component == component_name or self.to_component == component_name

    def get_other_end(self, component_name: str, port_name: str) -> Optional[tuple[str, str]]:
        """Get the component and port at the other end of this connection.

        Args:
            component_name: Name of the known component
            port_name: Name of the known port

        Returns:
            Tuple of (component_name, port_name) for the other end,
            or None if the given component/port is not part of this connection.
        """
        if self.from_component == component_name and self.from_port == port_name:
            return (self.to_component, self.to_port)
        elif self.to_component == component_name and self.to_port == port_name:
            return (self.from_component, self.from_port)
        return None
