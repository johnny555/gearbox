"""Compiled drivetrain with automatically-derived dynamics."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import numpy as np
from numpy.typing import NDArray

from .topology import DrivetrainTopology
from .component import DrivetrainComponent
from .constraints import (
    KinematicConstraint,
    GearRatioConstraint,
    WillisConstraint,
    RigidConnectionConstraint,
)
from .ports import PortType


@dataclass
class DOFInfo:
    """Information about a degree of freedom in the system."""

    name: str  # e.g., "engine.shaft" or "gearbox.output"
    component: str
    port: str
    index: int  # Position in state vector


@dataclass
class ConstraintInfo:
    """Information about an applied constraint."""

    constraint: KinematicConstraint
    component: str
    eliminated_dof: str  # The DOF that was eliminated
    expression: Dict[str, float]  # How to compute eliminated DOF from independent DOFs


class Drivetrain:
    """A compiled drivetrain ready for simulation.

    The Drivetrain class takes a topology and automatically derives:
    - The independent degrees of freedom (after constraint reduction)
    - The inertia matrix relating accelerations to torques
    - Methods for computing dynamics for ODE integration

    The state vector consists of:
    1. Mechanical DOF speeds (omega values for independent shafts)
    2. Internal component states (e.g., battery SOC)

    Attributes:
        topology: The source topology
        dof_info: Information about each mechanical DOF
        state_names: Names of all state variables
        control_names: Names of all control inputs
    """

    def __init__(self, topology: DrivetrainTopology):
        """Initialize and compile the drivetrain.

        Args:
            topology: The validated topology to compile
        """
        self.topology = topology
        self._components = topology.components

        # These will be populated during compilation
        self._independent_dofs: List[DOFInfo] = []
        self._eliminated_dofs: Dict[str, ConstraintInfo] = {}
        self._internal_states: List[Tuple[str, str]] = []  # (component, state_name)
        self._control_inputs: List[str] = []
        self._inertia_matrix: Optional[NDArray] = None
        self._gear_state: Dict[str, int] = {}  # Component -> current gear

        # Compile the topology
        self._compile()

    def _compile(self) -> None:
        """Compile the topology into simulation-ready form."""
        self._identify_dofs()
        self._apply_constraints()
        self._collect_internal_states()
        self._identify_control_inputs()
        self._build_inertia_matrix()

    def _identify_dofs(self) -> None:
        """Identify all mechanical degrees of freedom before constraint reduction."""
        # Each mechanical port is potentially an independent DOF
        all_dofs: List[DOFInfo] = []
        idx = 0

        for comp_name, component in self._components.items():
            for port_name, port in component.get_mechanical_ports().items():
                dof_name = f"{comp_name}.{port_name}"
                all_dofs.append(DOFInfo(dof_name, comp_name, port_name, idx))
                idx += 1

        self._all_dofs = all_dofs

    def _apply_constraints(self) -> None:
        """Apply kinematic constraints to reduce DOFs."""
        # Start with all DOFs as independent
        independent: Dict[str, DOFInfo] = {dof.name: dof for dof in self._all_dofs}
        eliminated: Dict[str, ConstraintInfo] = {}

        # First, handle connections between components (speed equality constraints)
        for conn in self.topology.connections:
            from_dof = f"{conn.from_component}.{conn.from_port}"
            to_dof = f"{conn.to_component}.{conn.to_port}"

            # Check port types
            from_port = self._components[conn.from_component].get_port(conn.from_port)
            if from_port.port_type != PortType.MECHANICAL:
                continue  # Skip electrical connections

            # The "to" port takes on the "from" port's speed
            if to_dof in independent:
                del independent[to_dof]
                eliminated[to_dof] = ConstraintInfo(
                    constraint=RigidConnectionConstraint(from_dof, to_dof),
                    component="connection",
                    eliminated_dof=to_dof,
                    expression={from_dof: 1.0},
                )

        # Then, handle component internal constraints
        for comp_name, component in self._components.items():
            for constraint in component.get_constraints():
                dependent_port = constraint.get_dependent_port()
                dependent_dof = f"{comp_name}.{dependent_port}"

                # Build expression for the dependent DOF
                expression = {}
                relation = constraint.get_speed_relation()

                # Find the coefficient for the dependent DOF
                dep_coeff = relation.get(dependent_port, 0.0)
                if abs(dep_coeff) < 1e-12:
                    continue  # Can't eliminate this DOF

                # Express dependent DOF in terms of others
                for port_name, coeff in relation.items():
                    if port_name == dependent_port:
                        continue
                    full_name = f"{comp_name}.{port_name}"

                    # Resolve through any previous eliminations
                    resolved = self._resolve_dof(full_name, independent, eliminated)
                    for dof_name, factor in resolved.items():
                        current = expression.get(dof_name, 0.0)
                        expression[dof_name] = current - (coeff / dep_coeff) * factor

                # If dependent DOF is already eliminated (e.g., by a connection),
                # we need to follow the chain and eliminate the connected DOF instead.
                # Example: sun is connected to MG1.shaft, Willis says sun = 4*carrier - 3*ring
                # We should eliminate MG1.shaft = 4*engine.shaft - 3*ring
                if dependent_dof not in independent:
                    if dependent_dof in eliminated:
                        # Find what the dependent DOF is connected to
                        conn_info = eliminated[dependent_dof]
                        # Only handle 1:1 connections (rigid connections)
                        if len(conn_info.expression) == 1:
                            connected_dof = list(conn_info.expression.keys())[0]
                            coeff_connection = list(conn_info.expression.values())[0]
                            if abs(coeff_connection - 1.0) < 1e-12 and connected_dof in independent:
                                # Eliminate the connected DOF with the constraint expression
                                del independent[connected_dof]
                                eliminated[connected_dof] = ConstraintInfo(
                                    constraint=constraint,
                                    component=comp_name,
                                    eliminated_dof=connected_dof,
                                    expression=expression,
                                )
                    continue  # Skip the normal elimination path

                del independent[dependent_dof]
                eliminated[dependent_dof] = ConstraintInfo(
                    constraint=constraint,
                    component=comp_name,
                    eliminated_dof=dependent_dof,
                    expression=expression,
                )

        # Re-index remaining independent DOFs
        self._independent_dofs = []
        for idx, (name, dof_info) in enumerate(independent.items()):
            self._independent_dofs.append(
                DOFInfo(name, dof_info.component, dof_info.port, idx)
            )

        self._eliminated_dofs = eliminated

    def _resolve_dof(
        self,
        dof_name: str,
        independent: Dict[str, DOFInfo],
        eliminated: Dict[str, ConstraintInfo],
    ) -> Dict[str, float]:
        """Resolve a DOF to independent DOFs, following constraint chain.

        Returns dict mapping independent DOF names to coefficients.
        """
        if dof_name in independent:
            return {dof_name: 1.0}

        if dof_name in eliminated:
            info = eliminated[dof_name]
            result: Dict[str, float] = {}
            for sub_dof, coeff in info.expression.items():
                sub_resolved = self._resolve_dof(sub_dof, independent, eliminated)
                for final_dof, final_coeff in sub_resolved.items():
                    current = result.get(final_dof, 0.0)
                    result[final_dof] = current + coeff * final_coeff
            return result

        # DOF not found - this shouldn't happen if topology is valid
        raise ValueError(f"DOF '{dof_name}' not found in topology")

    def _collect_internal_states(self) -> None:
        """Collect internal state variables from all components."""
        self._internal_states = []
        for comp_name, component in self._components.items():
            for state_name in component.state_names:
                self._internal_states.append((comp_name, state_name))

    def _identify_control_inputs(self) -> None:
        """Identify control inputs for the system."""
        # Control inputs are torque commands to actuated components
        self._control_inputs = []

        for comp_name, component in self._components.items():
            # Check if component is an actuator (has torque output)
            comp_type = type(component).__name__
            if "Engine" in comp_type:
                self._control_inputs.append(f"T_{comp_name}")
            elif "Motor" in comp_type:
                self._control_inputs.append(f"T_{comp_name}")

        # Add gear selection for gearboxes
        for comp_name, component in self._components.items():
            comp_type = type(component).__name__
            if "Gearbox" in comp_type:
                self._control_inputs.append(f"gear_{comp_name}")
                self._gear_state[comp_name] = 0

    def _build_inertia_matrix(self) -> None:
        """Build the inertia matrix for the reduced system."""
        n_dof = len(self._independent_dofs)
        J = np.zeros((n_dof, n_dof))

        # For each independent DOF, sum up inertia contributions
        for i, dof_i in enumerate(self._independent_dofs):
            for j, dof_j in enumerate(self._independent_dofs):
                J[i, j] = self._compute_coupled_inertia(dof_i, dof_j)

        self._inertia_matrix = J

    def _compute_coupled_inertia(self, dof_i: DOFInfo, dof_j: DOFInfo) -> float:
        """Compute the inertia coupling between two DOFs.

        This accounts for inertias from all mechanical ports, reflected
        through gear ratios and kinematic constraints.
        """
        total = 0.0

        # Get all DOFs that contribute to each independent DOF
        contributions_i = self._get_inertia_contributions(dof_i.name)
        contributions_j = self._get_inertia_contributions(dof_j.name)

        # Sum up J * coeff_i * coeff_j for each source inertia
        for (comp, port), coeff_i in contributions_i.items():
            coeff_j = contributions_j.get((comp, port), 0.0)
            if abs(coeff_j) > 1e-12:
                J_port = self._components[comp].get_inertia(port)
                total += J_port * coeff_i * coeff_j

        return total

    def _get_inertia_contributions(self, dof_name: str) -> Dict[Tuple[str, str], float]:
        """Get all port inertias that contribute to this DOF with their coefficients.

        For an eliminated DOF like vehicle.wheels = {planetary.ring: 0.0125},
        the vehicle's inertia contributes to planetary.ring with coefficient 0.0125.

        We need to fully resolve each eliminated DOF's expression to independent DOFs
        to find the correct coefficients.
        """
        contributions: Dict[Tuple[str, str], float] = {}

        # The DOF's own port
        for dof in self._independent_dofs:
            if dof.name == dof_name:
                contributions[(dof.component, dof.port)] = 1.0

        # Build resolved expressions for all eliminated DOFs
        # (expressions in terms of independent DOFs only)
        resolved_expressions: Dict[str, Dict[str, float]] = {}
        for elim_name, info in self._eliminated_dofs.items():
            resolved = self._resolve_dof(
                elim_name,
                {dof.name: dof for dof in self._independent_dofs},
                self._eliminated_dofs,
            )
            resolved_expressions[elim_name] = resolved

        # Add contributions from eliminated DOFs that depend on dof_name
        for elim_name, resolved in resolved_expressions.items():
            coeff = resolved.get(dof_name, 0.0)
            if abs(coeff) > 1e-12:
                # Parse component.port from elim_name
                parts = elim_name.split(".")
                comp, port = parts[0], parts[1]
                contributions[(comp, port)] = coeff

        return contributions

    @property
    def state_names(self) -> List[str]:
        """Names of all state variables."""
        names = [dof.name for dof in self._independent_dofs]
        names.extend(f"{comp}.{state}" for comp, state in self._internal_states)
        return names

    @property
    def n_mechanical_dofs(self) -> int:
        """Number of mechanical degrees of freedom."""
        return len(self._independent_dofs)

    @property
    def n_internal_states(self) -> int:
        """Number of internal state variables."""
        return len(self._internal_states)

    @property
    def n_states(self) -> int:
        """Total number of state variables."""
        return self.n_mechanical_dofs + self.n_internal_states

    @property
    def control_names(self) -> List[str]:
        """Names of control inputs."""
        return self._control_inputs

    @property
    def inertia_matrix(self) -> NDArray:
        """The compiled inertia matrix."""
        if self._inertia_matrix is None:
            self._build_inertia_matrix()
        return self._inertia_matrix

    def get_component(self, name: str) -> DrivetrainComponent:
        """Get a component by name."""
        return self._components[name]

    def set_gear(self, component: str, gear: int) -> None:
        """Set the current gear for a gearbox component."""
        if component in self._gear_state:
            self._gear_state[component] = gear
            # Rebuild inertia matrix since ratios changed
            self._apply_constraints()
            self._build_inertia_matrix()

    def state_to_array(self, state: Dict[str, float]) -> NDArray:
        """Convert state dict to array."""
        x = np.zeros(self.n_states)
        for i, name in enumerate(self.state_names):
            x[i] = state.get(name, 0.0)
        return x

    def array_to_state(self, x: NDArray) -> Dict[str, float]:
        """Convert state array to dict."""
        return {name: x[i] for i, name in enumerate(self.state_names)}

    def get_all_speeds(self, x: NDArray) -> Dict[str, float]:
        """Compute all port speeds from state vector.

        Returns speeds for both independent and constrained DOFs.
        """
        state = self.array_to_state(x)
        speeds = {}

        # Independent DOFs have speeds directly in state
        for dof in self._independent_dofs:
            speeds[dof.name] = state.get(dof.name, 0.0)

        # Constrained DOFs computed from constraints (with recursive resolution)
        def resolve_speed(dof_name: str) -> float:
            if dof_name in speeds:
                return speeds[dof_name]

            if dof_name in self._eliminated_dofs:
                info = self._eliminated_dofs[dof_name]
                omega = 0.0
                for dep_name, coeff in info.expression.items():
                    omega += coeff * resolve_speed(dep_name)
                speeds[dof_name] = omega
                return omega

            return 0.0  # Unknown DOF

        for elim_name in self._eliminated_dofs:
            resolve_speed(elim_name)

        return speeds

    def dynamics(
        self,
        t: float,
        x: NDArray,
        control: Dict[str, float],
        disturbance: Dict[str, float],
    ) -> NDArray:
        """Compute state derivatives for ODE integration.

        Args:
            t: Current time [s]
            x: State vector [omega_1, ..., omega_n, state_1, ..., state_m]
            control: Control inputs (torques, gear selections)
            disturbance: Disturbance inputs (e.g., grade)

        Returns:
            State derivative vector dx/dt
        """
        dx = np.zeros_like(x)

        # Get all port speeds
        all_speeds = self.get_all_speeds(x)

        # Update gear states from control
        for comp_name in self._gear_state:
            gear_key = f"gear_{comp_name}"
            if gear_key in control:
                new_gear = int(control[gear_key])
                if new_gear != self._gear_state[comp_name]:
                    self.set_gear(comp_name, new_gear)

        # Compute torques from all components
        all_torques: Dict[str, float] = {}

        for comp_name, component in self._components.items():
            # Build port speeds dict for this component
            port_speeds = {}
            for port_name in component.get_mechanical_ports():
                dof_name = f"{comp_name}.{port_name}"
                port_speeds[port_name] = all_speeds.get(dof_name, 0.0)

            # Build control inputs for this component
            comp_control = {}
            torque_key = f"T_{comp_name}"
            if torque_key in control:
                comp_control["torque"] = control[torque_key]

            # Get internal states for this component
            internal = {}
            for state_name in component.state_names:
                full_name = f"{comp_name}.{state_name}"
                idx = self.state_names.index(full_name)
                internal[state_name] = x[idx]

            # Compute torques
            torques = component.compute_torques(port_speeds, comp_control, internal)
            for port_name, torque in torques.items():
                dof_name = f"{comp_name}.{port_name}"
                all_torques[dof_name] = torque

        # Build generalized force vector
        tau = np.zeros(self.n_mechanical_dofs)

        # First, resolve all eliminated DOFs to independent DOFs
        # This handles constraint chains like MG1.shaft → sun → {carrier, ring}
        independent_dict = {dof.name: dof for dof in self._independent_dofs}
        resolved_coeffs: Dict[str, Dict[str, float]] = {}
        for elim_name in self._eliminated_dofs:
            resolved_coeffs[elim_name] = self._resolve_dof(
                elim_name, independent_dict, self._eliminated_dofs
            )

        for i, dof in enumerate(self._independent_dofs):
            # Direct torque on this DOF
            tau[i] += all_torques.get(dof.name, 0.0)

            # Add torques from constrained DOFs, using resolved coefficients
            for elim_name, resolved in resolved_coeffs.items():
                coeff = resolved.get(dof.name, 0.0)
                if abs(coeff) > 1e-12:
                    # Torque gets multiplied by the constraint coefficient
                    tau[i] += coeff * all_torques.get(elim_name, 0.0)

        # Add load torque (from vehicle component) with grade
        grade = disturbance.get("grade", 0.0)
        tau = self._add_load_torque(tau, all_speeds, grade)

        # Solve for accelerations: J * omega_dot = tau
        J = self.inertia_matrix
        if self.n_mechanical_dofs > 0:
            omega_dot = np.linalg.solve(J, tau)
            dx[: self.n_mechanical_dofs] = omega_dot

        # Compute internal state derivatives
        for i, (comp_name, state_name) in enumerate(self._internal_states):
            component = self._components[comp_name]

            # Get port values
            port_values = {}
            for port_name in component.ports:
                dof_name = f"{comp_name}.{port_name}"
                port_values[f"{port_name}_speed"] = all_speeds.get(dof_name, 0.0)
                port_values[f"{port_name}_torque"] = all_torques.get(dof_name, 0.0)

            # Get current internal states
            internal = {}
            for sn in component.state_names:
                full_name = f"{comp_name}.{sn}"
                idx = self.state_names.index(full_name)
                internal[sn] = x[idx]

            # Compute derivatives
            derivs = component.compute_state_derivatives(internal, port_values)

            # Store in dx
            state_idx = self.n_mechanical_dofs + i
            dx[state_idx] = derivs.get(state_name, 0.0)

        return dx

    def _add_load_torque(
        self, tau: NDArray, speeds: Dict[str, float], grade: float
    ) -> NDArray:
        """Add vehicle load torque to the generalized forces."""
        # Find the vehicle component (connects to output)
        if self.topology.output_component is None:
            return tau

        output_comp = self.topology.output_component
        output_port = self.topology.output_port
        output_dof = f"{output_comp}.{output_port}"

        # Get vehicle velocity from wheel speed
        component = self._components[output_comp]
        omega = speeds.get(output_dof, 0.0)

        # If this is a vehicle component, get load torque
        if hasattr(component, "compute_load_torque"):
            T_load = component.compute_load_torque(omega, grade)

            # Find which independent DOF is affected
            for i, dof in enumerate(self._independent_dofs):
                if dof.name == output_dof:
                    tau[i] -= T_load
                    break
            else:
                # Output is a constrained DOF - resolve to independent DOFs
                # Need to fully resolve the expression chain
                resolved = self._resolve_dof(
                    output_dof,
                    {dof.name: dof for dof in self._independent_dofs},
                    self._eliminated_dofs,
                )
                for ind_dof, coeff in resolved.items():
                    for i, dof in enumerate(self._independent_dofs):
                        if dof.name == ind_dof:
                            tau[i] -= coeff * T_load
                            break

        return tau

    def get_velocity(self, x: NDArray) -> float:
        """Get vehicle velocity from state vector."""
        if self.topology.output_component is None:
            return 0.0

        output_comp = self.topology.output_component
        output_port = self.topology.output_port
        output_dof = f"{output_comp}.{output_port}"

        speeds = self.get_all_speeds(x)
        omega = speeds.get(output_dof, 0.0)

        # Convert wheel speed to velocity
        component = self._components[output_comp]
        if hasattr(component, "wheel_speed_to_velocity"):
            return component.wheel_speed_to_velocity(omega)

        return omega  # Fallback: return angular velocity

    def __repr__(self) -> str:
        return (
            f"Drivetrain(dofs={self.n_mechanical_dofs}, "
            f"states={self.n_internal_states}, "
            f"controls={len(self.control_names)})"
        )
