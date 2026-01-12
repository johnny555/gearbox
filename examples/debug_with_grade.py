#!/usr/bin/env python3
"""Debug simulation with grade."""

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
    print("Debug: Simulation with grade profile")
    print("=" * 70)
    
    ctrl = Controller(pt)
    v_target = 15.0 / 3.6
    
    x0 = PowertrainState(
        omega_e=800 * np.pi / 30,
        omega_r=0.0,
        soc=0.6,
    )
    
    # Grade profile
    def grade_profile(t):
        if t < 10:
            return 0.0
        elif t < 25:
            return 0.10 * (t - 10) / 15  # Ramp to 10% over 15s
        return 0.10
    
    config = SimulationConfig(
        t_start=0.0,
        t_end=60.0,
        dt_output=2.0,
    )
    
    print(f"Simulating {config.t_end}s with grade ramp...")
    result = simulate(
        pt, x0,
        controller=ctrl,
        grade_profile=grade_profile,
        config=config,
        v_target=v_target,
    )
    
    print(f"\nTime series:")
    print(f"{'t':>6} {'grade%':>8} {'v km/h':>10} {'rpm_e':>10} {'rpm_MG1':>10} {'T_load':>10}")
    print("-" * 60)
    
    for i in range(len(result.t)):
        print(f"{result.t[i]:>6.1f} {result.grade[i]*100:>8.1f} {result.velocity[i]*3.6:>10.2f} "
              f"{result.rpm_e[i]:>10.0f} {result.rpm_MG1[i]:>10.0f} {result.T_load[i]:>10.0f}")
    
    print(f"\nFinal: v={result.velocity[-1]*3.6:.1f} km/h, rpm_e={result.rpm_e[-1]:.0f}")
    
    if result.velocity[-1] < 0:
        print("\n⚠️  Vehicle went backwards!")

if __name__ == "__main__":
    main()
