"""Base controller class for drivetrains."""

from abc import ABC, abstractmethod
from typing import Dict, Optional

from ..core.drivetrain import Drivetrain


class DrivetrainController(ABC):
    """Abstract base class for drivetrain controllers.

    Controllers compute control inputs (torques, gear selections) based
    on the current state and desired behavior (speed target, power demand, etc.).

    Subclasses must implement the compute() method.
    """

    def __init__(self, drivetrain: Drivetrain):
        """Initialize the controller.

        Args:
            drivetrain: The drivetrain to control
        """
        self.drivetrain = drivetrain
        self._target_velocity: Optional[float] = None

    @property
    def target_velocity(self) -> Optional[float]:
        """Target velocity [m/s]."""
        return self._target_velocity

    @target_velocity.setter
    def target_velocity(self, value: float) -> None:
        """Set target velocity [m/s]."""
        self._target_velocity = value

    @abstractmethod
    def compute(self, state: Dict[str, float], grade: float) -> Dict[str, float]:
        """Compute control inputs.

        Args:
            state: Current state {state_name: value}
            grade: Current road grade [fraction]

        Returns:
            Control inputs {control_name: value}
            Typical keys: T_engine, T_MG1, T_MG2, gear_gearbox
        """
        pass

    def reset(self) -> None:
        """Reset controller state (for stateful controllers)."""
        pass

    def get_velocity(self, state: Dict[str, float]) -> float:
        """Get current vehicle velocity from state.

        Args:
            state: Current state dict

        Returns:
            Velocity [m/s]
        """
        # Convert state dict to array for drivetrain method
        import numpy as np
        x = self.drivetrain.state_to_array(state)
        return self.drivetrain.get_velocity(x)
