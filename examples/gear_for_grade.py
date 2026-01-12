#!/usr/bin/env python3
"""Calculate gear ratio needed for 10% grade with correct wheel radius."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

pt = create_cat_793d_powertrain(payload_fraction=1.0)
m = pt.vehicle.mass
g = 9.81
r_w = pt.vehicle.r_wheel
rho = pt.planetary.rho

print(f"Wheel radius: {r_w} m")
print(f"Vehicle mass: {m:,.0f} kg")

# Force needed for 10% grade
grade = 0.10
theta = np.arctan(grade)
F_need = m * g * (np.sin(theta) + 0.015 * np.cos(theta))
print(f"\nForce needed for 10% grade: {F_need/1e3:.0f} kN")

# With locked sun, ring torque available
T_e = pt.engine.get_max_torque(1200)
T_ring = rho/(1+rho) * T_e + pt.mg2.params.T_max
print(f"Ring torque (locked sun): {T_ring:,.0f} N·m")

# Required gear ratio: F = T × K × η / r_w
# K = F × r_w / (T × η)
eta = 0.93
K_needed = F_need * r_w / (T_ring * eta)
print(f"\nGear ratio needed: {K_needed:.1f}:1")
print(f"Current: {pt.gearbox.params.K_low * pt.gearbox.params.K_final:.1f}:1")
print(f"With K_final=9: K_low needed = {K_needed/9:.1f}:1")
