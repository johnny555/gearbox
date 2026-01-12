"""Drivetrain topology builder with fluent API."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, TYPE_CHECKING

from .ports import Connection, PortType
from .component import DrivetrainComponent

if TYPE_CHECKING:
    from .drivetrain import Drivetrain


@dataclass
class TopologyError(Exception):
    """Error in drivetrain topology configuration."""

    message: str
    component: Optional[str] = None
    port: Optional[str] = None

    def __str__(self) -> str:
        location = ""
        if self.component:
            location = f" at component '{self.component}'"
            if self.port:
                location += f".{self.port}"
        return f"TopologyError{location}: {self.message}"


@dataclass
class DrivetrainTopology:
    """Builder for constructing drivetrain topologies.

    Use the fluent API to add components and connections, then call
    build() to compile into a simulatable Drivetrain.

    Example:
        topology = (DrivetrainTopology()
            .add_component("engine", EngineComponent())
            .add_component("gearbox", GearboxComponent())
            .add_component("vehicle", VehicleComponent())
            .connect("engine", "shaft", "gearbox", "input")
            .connect("gearbox", "output", "vehicle", "wheels")
            .set_output("vehicle", "wheels")
        )
        drivetrain = topology.build()
    """

    components: Dict[str, DrivetrainComponent] = field(default_factory=dict)
    connections: List[Connection] = field(default_factory=list)
    output_component: Optional[str] = None
    output_port: Optional[str] = None
    _electrical_buses: Dict[str, List[Tuple[str, str]]] = field(default_factory=dict)

    def add_component(self, name: str, component: DrivetrainComponent) -> DrivetrainTopology:
        """Add a component to the topology.

        Args:
            name: Unique identifier for this component
            component: The component instance

        Returns:
            self for method chaining

        Raises:
            TopologyError: If name is already used
        """
        if name in self.components:
            raise TopologyError(f"Component name '{name}' already exists", component=name)

        component.name = name
        self.components[name] = component
        return self

    def connect(
        self,
        from_component: str,
        from_port: str,
        to_component: str,
        to_port: str,
    ) -> DrivetrainTopology:
        """Connect two component ports.

        Creates a physical connection between ports. Both ports must be
        of the same type (both mechanical or both electrical).

        Args:
            from_component: Name of the source component
            from_port: Name of the port on the source component
            to_component: Name of the destination component
            to_port: Name of the port on the destination component

        Returns:
            self for method chaining

        Raises:
            TopologyError: If components/ports don't exist or types mismatch
        """
        # Validate components exist
        if from_component not in self.components:
            raise TopologyError(f"Unknown component '{from_component}'", component=from_component)
        if to_component not in self.components:
            raise TopologyError(f"Unknown component '{to_component}'", component=to_component)

        from_comp = self.components[from_component]
        to_comp = self.components[to_component]

        # Validate ports exist
        if not from_comp.has_port(from_port):
            raise TopologyError(
                f"No port '{from_port}' on component",
                component=from_component,
                port=from_port,
            )
        if not to_comp.has_port(to_port):
            raise TopologyError(
                f"No port '{to_port}' on component",
                component=to_component,
                port=to_port,
            )

        # Validate port types match
        from_port_obj = from_comp.get_port(from_port)
        to_port_obj = to_comp.get_port(to_port)
        if from_port_obj.port_type != to_port_obj.port_type:
            raise TopologyError(
                f"Port type mismatch: {from_port_obj.port_type.name} != {to_port_obj.port_type.name}",
                component=from_component,
                port=from_port,
            )

        # Check for duplicate connections
        conn = Connection(from_component, from_port, to_component, to_port)
        for existing in self.connections:
            if (
                existing.from_component == conn.from_component
                and existing.from_port == conn.from_port
            ) or (
                existing.to_component == conn.to_component
                and existing.to_port == conn.to_port
            ):
                raise TopologyError(
                    f"Port already connected: {existing}",
                    component=from_component,
                    port=from_port,
                )

        self.connections.append(conn)
        return self

    def set_output(self, component: str, port: str) -> DrivetrainTopology:
        """Set the output port (connected to vehicle/ground).

        The output port is where the drivetrain connects to the vehicle
        road load. This is typically the wheels port on the vehicle component.

        Args:
            component: Name of the output component
            port: Name of the output port

        Returns:
            self for method chaining

        Raises:
            TopologyError: If component/port doesn't exist
        """
        if component not in self.components:
            raise TopologyError(f"Unknown component '{component}'", component=component)

        comp = self.components[component]
        if not comp.has_port(port):
            raise TopologyError(
                f"No port '{port}' on component",
                component=component,
                port=port,
            )

        self.output_component = component
        self.output_port = port
        return self

    def create_electrical_bus(self, bus_name: str) -> DrivetrainTopology:
        """Create a named electrical bus for power sharing.

        Electrical buses allow multiple components (motors, battery) to
        share electrical power. Use connect_to_bus() to attach components.

        Args:
            bus_name: Unique identifier for the bus

        Returns:
            self for method chaining
        """
        if bus_name in self._electrical_buses:
            raise TopologyError(f"Electrical bus '{bus_name}' already exists")
        self._electrical_buses[bus_name] = []
        return self

    def connect_to_bus(self, bus_name: str, component: str, port: str) -> DrivetrainTopology:
        """Connect a component's electrical port to a bus.

        Args:
            bus_name: Name of the electrical bus
            component: Name of the component
            port: Name of the electrical port

        Returns:
            self for method chaining

        Raises:
            TopologyError: If bus doesn't exist or port is not electrical
        """
        if bus_name not in self._electrical_buses:
            raise TopologyError(f"Unknown electrical bus '{bus_name}'")

        if component not in self.components:
            raise TopologyError(f"Unknown component '{component}'", component=component)

        comp = self.components[component]
        if not comp.has_port(port):
            raise TopologyError(f"No port '{port}' on component", component=component, port=port)

        port_obj = comp.get_port(port)
        if port_obj.port_type != PortType.ELECTRICAL:
            raise TopologyError(
                f"Port '{port}' is not electrical",
                component=component,
                port=port,
            )

        self._electrical_buses[bus_name].append((component, port))
        return self

    def get_connections_for(self, component: str) -> List[Connection]:
        """Get all connections involving a component."""
        return [c for c in self.connections if c.involves(component)]

    def get_connected_port(
        self, component: str, port: str
    ) -> Optional[Tuple[str, str]]:
        """Find what a port is connected to.

        Args:
            component: Name of the component
            port: Name of the port

        Returns:
            Tuple of (component_name, port_name) or None if not connected
        """
        for conn in self.connections:
            result = conn.get_other_end(component, port)
            if result is not None:
                return result
        return None

    def validate(self) -> List[str]:
        """Validate the topology configuration.

        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []

        # Check that we have at least one component
        if not self.components:
            errors.append("Topology has no components")

        # Validate each component
        for name, component in self.components.items():
            comp_errors = component.validate()
            for err in comp_errors:
                errors.append(f"Component '{name}': {err}")

        # Check that output is set
        if self.output_component is None:
            errors.append("No output port set (use set_output())")

        # Check for disconnected components
        # Components with only electrical ports (like batteries) can be unconnected
        # since electrical power flow is handled at the control level
        connected_components = set()
        for conn in self.connections:
            connected_components.add(conn.from_component)
            connected_components.add(conn.to_component)

        for name, component in self.components.items():
            if name not in connected_components and len(self.components) > 1:
                # Allow if component only has electrical ports
                mech_ports = component.get_mechanical_ports()
                if len(mech_ports) > 0:
                    errors.append(f"Component '{name}' is not connected to anything")

        # Check electrical bus connections
        for bus_name, members in self._electrical_buses.items():
            if len(members) < 2:
                errors.append(
                    f"Electrical bus '{bus_name}' has fewer than 2 connections"
                )

        return errors

    def build(self) -> Drivetrain:
        """Compile the topology into a simulatable Drivetrain.

        This analyzes the topology, reduces degrees of freedom using
        kinematic constraints, builds the inertia matrix, and creates
        a Drivetrain object ready for simulation.

        Returns:
            Compiled Drivetrain object

        Raises:
            TopologyError: If topology is invalid
        """
        errors = self.validate()
        if errors:
            raise TopologyError("Invalid topology: " + "; ".join(errors))

        from .drivetrain import Drivetrain

        return Drivetrain(self)

    def __repr__(self) -> str:
        comp_names = list(self.components.keys())
        return f"DrivetrainTopology(components={comp_names}, connections={len(self.connections)})"
