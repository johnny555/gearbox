#!/usr/bin/env python3
"""Debug longer simulation."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain, PowertrainState
from ecvt_sim.controller import Controller
from ecvt_sim.simulate import simulate, SimulationConfig

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    print("=" * 70)
    print("Debug: Full integration test")
    print("=" * 70)
    
    ctrl = Controller(pt)
    v_target = 15.0 / 3.6
    
    x0 = PowertrainState(
        omega_e=800 * np.pi / 30,
        omega_r=0.0,
        soc=0.6,
    )
    
    config = SimulationConfig(
        t_start=0.0,
        t_end=30.0,
        dt_output=1.0,
    )
    
    print(f"Simulating {config.t_end}s on flat ground...")
    result = simulate(
        pt, x0,
        controller=ctrl,
        grade_profile=lambda t: 0.0,
        config=config,
        v_target=v_target,
    )
    
    print(f"\nTime series:")
    print(f"{'t':>6} {'v km/h':>10} {'rpm_e':>10} {'rpm_MG1':>10} {'T_e':>10} {'T_MG1':>10} {'T_MG2':>10}")
    print("-" * 76)
    
    for i in range(len(result.t)):
        print(f"{result.t[i]:>6.1f} {result.velocity[i]*3.6:>10.2f} {result.rpm_e[i]:>10.0f} "
              f"{result.rpm_MG1[i]:>10.0f} {result.T_e[i]:>10.0f} {result.T_MG1[i]:>10.0f} {result.T_MG2[i]:>10.0f}")

if __name__ == "__main__":
    main()
