#!/usr/bin/env python3
"""Complete system overview of CAT 793D E-CVT hybrid drivetrain."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    m_empty = pt.vehicle.params.m_empty
    grav = 9.81
    K_low = pt.gearbox.params.K_low * pt.gearbox.params.K_final
    K_high = pt.gearbox.params.K_high * pt.gearbox.params.K_final
    eta = pt.gearbox.params.eta_total
    
    TC_stall = 2.5
    T_e_max = pt.engine.get_max_torque(1200)
    
    print("=" * 85)
    print("   CAT 793D E-CVT HYBRID DRIVETRAIN - COMPLETE SYSTEM OVERVIEW")
    print("=" * 85)
    
    print("""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────┐    ┌─────────────────┐    ┌───────────────────┐    ┌──────────────┐  │
│   │  ICE    │───▶│ Torque Converter│───▶│  Planetary Gear   │───▶│   2-Speed    │  │
│   │ Engine  │    │   (2.5:1 stall) │    │   Set (ρ = 3.0)   │    │   Gearbox    │  │
│   └─────────┘    └─────────────────┘    └───────────────────┘    └──────┬───────┘  │
│                                                ▲           │            │           │
│                                          ┌─────┴─────┐     │            ▼           │
│                                          │   MG1     │     │     ┌──────────────┐  │
│                                          │  (Sun)    │     │     │ Final Drive  │  │
│                                          │  200 kW   │     │     │   (16:1)     │  │
│                                          └───────────┘     │     └──────┬───────┘  │
│                                                            │            │           │
│                                          ┌─────────────┐   │            ▼           │
│                                          │    MG2      │───┘     ┌──────────────┐  │
│                                          │   (Ring)    │         │    Wheels    │  │
│                                          │   350 kW    │         │  (r = 1.78m) │  │
│                                          └─────────────┘         └──────────────┘  │
│                                                                                      │
│   Sun Lockup Clutch: Allows locking MG1/sun for direct engine-to-ring torque path   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                           COMPONENT SPECIFICATIONS")
    print("=" * 85)
    
    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ DIESEL ENGINE (CAT 3516E)                                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Configuration:     V16 Quad-Turbo, 78.7L displacement                             │
│   Rated Power:       1,801 kW (2,415 hp) @ 1,650 rpm                                │
│   Peak Torque:       {T_e_max:,} N·m @ 1,200 rpm                                       │
│   Speed Range:       700 - 1,800 rpm                                                │
│   Inertia:           25.0 kg·m²                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ TORQUE CONVERTER                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Type:              Single-stage, three-element with lock-up clutch                │
│   Stall Ratio:       {TC_stall}:1                                                          │
│   Max Input Torque:  {T_e_max:,} N·m                                                   │
│   Max Output Torque: {int(T_e_max * TC_stall):,} N·m (at stall)                                         │
│   Lock-up:           Engages above ~10 km/h for efficiency                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PLANETARY GEAR SET (Power Split Device)                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Sun Gear:          30 teeth (connected to MG1)                                    │
│   Ring Gear:         90 teeth (connected to MG2 and output)                         │
│   Carrier:           Connected to TC output (engine path)                           │
│   Ratio (ρ):         {rho:.1f} (Zr/Zs)                                                     │
│   Torque Split:      75% to ring, 25% reacted by sun                                │
│   Sun Lockup:        Clutch/brake to lock sun for direct drive mode                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MG1 - Motor/Generator 1 (Sun Gear)                                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Power:             {pt.mg1.params.P_max/1e3:.0f} kW continuous                                            │
│   Max Torque:        {pt.mg1.params.T_max:,.0f} N·m                                                       │
│   Base Speed:        {pt.mg1.params.P_max / pt.mg1.params.T_max * 30/np.pi:.0f} rpm (transition to constant power)                          │
│   Max Speed:         {pt.mg1.params.rpm_max:,.0f} rpm                                                       │
│   Efficiency:        {pt.mg1.params.eta*100:.0f}%                                                            │
│   Function:          Reacts engine torque, controls engine speed, generates power   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MG2 - Motor/Generator 2 (Ring Gear / Output)                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Power:             {pt.mg2.params.P_max/1e3:.0f} kW continuous / {pt.mg2.params.P_boost/1e3:.0f} kW boost                                  │
│   Max Torque:        {pt.mg2.params.T_max:,.0f} N·m                                                       │
│   Max Speed:         {pt.mg2.params.rpm_max:,.0f} rpm                                                       │
│   Efficiency:        {pt.mg2.params.eta*100:.0f}%                                                            │
│   Function:          Direct drive torque, regenerative braking, EV mode             │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 2-SPEED GEARBOX + FINAL DRIVE                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Low Gear:          {pt.gearbox.params.K_low:.1f}:1                                                          │
│   High Gear:         {pt.gearbox.params.K_high:.2f}:1 (overdrive)                                               │
│   Final Drive:       {pt.gearbox.params.K_final:.1f}:1                                                         │
│   Total Low:         {K_low:.0f}:1                                                          │
│   Total High:        {K_high:.1f}:1                                                         │
│   Efficiency:        {eta*100:.0f}% (gearbox × final drive)                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ VEHICLE                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Empty Mass:        {m_empty:,} kg                                                  │
│   Payload:           {pt.vehicle.params.m_payload:,} kg                                                │
│   Gross Mass:        {m:,} kg (loaded)                                           │
│   Wheel Radius:      {r_w:.2f} m (59/80R63 tires)                                         │
│   Rolling Resist:    {pt.vehicle.params.C_r} (maintained haul road)                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                            OPERATING MODES")
    print("=" * 85)
    
    # Calculate key values
    omega_e = 1200 * np.pi / 30
    omega_MG1_standstill = (1 + rho) * omega_e
    T_MG1_at_standstill = pt.mg1.params.P_max / omega_MG1_standstill
    T_e_usable_ecvt = (1 + rho) * T_MG1_at_standstill
    
    T_ring_ecvt = rho / (1 + rho) * T_e_usable_ecvt + pt.mg2.params.T_max
    T_ring_locked = rho / (1 + rho) * T_e_max + pt.mg2.params.T_max
    T_ring_tc = rho / (1 + rho) * (T_e_max * TC_stall) + pt.mg2.params.T_max
    
    F_ecvt = T_ring_ecvt * K_low * eta / r_w
    F_locked = T_ring_locked * K_low * eta / r_w
    F_tc = T_ring_tc * K_low * eta / r_w
    
    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 1: e-CVT (Normal Driving)                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Sun:               FREE (MG1 controls speed)                                      │
│   TC:                LOCKED (1:1)                                                   │
│   Characteristics:   Continuously variable ratio, engine at optimal RPM             │
│   Engine Usable:     {T_e_usable_ecvt:,.0f} N·m (limited by MG1 power at high MG1 rpm)            │
│   Ring Torque:       {T_ring_ecvt:,.0f} N·m                                                       │
│   Rimpull:           {F_ecvt/1e3:.0f} kN (standstill) to {F_locked/1e3:.0f} kN (at ~15 km/h sweet spot)         │
│   Best For:          Cruising, regen braking, fuel efficiency                       │
│   Grade Limit:       ~10% (at speed), limited at standstill                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 2: Locked Sun (Direct Drive)                                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Sun:               LOCKED (brake engaged)                                         │
│   TC:                LOCKED (1:1)                                                   │
│   Characteristics:   Fixed ratio, full engine torque available                      │
│   Engine Usable:     {T_e_max:,.0f} N·m (100% - no MG1 limitation)                          │
│   Ring Torque:       {T_ring_locked:,.0f} N·m                                                      │
│   Rimpull:           {F_locked/1e3:.0f} kN (constant across speed range)                          │
│   Best For:          Sustained grade climbing, heavy pulling                        │
│   Grade Limit:       ~10% from standstill                                           │
│   Tradeoff:          Fixed engine-to-output ratio (1.33:1 through planetary)        │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 3: Locked Sun + TC Stall (Maximum Launch)                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Sun:               LOCKED (brake engaged)                                         │
│   TC:                STALL ({TC_stall}:1 multiplication)                                        │
│   Characteristics:   Maximum torque multiplication for launch/steep grades          │
│   Engine Torque:     {T_e_max:,.0f} N·m × {TC_stall} = {int(T_e_max*TC_stall):,} N·m after TC                  │
│   Ring Torque:       {T_ring_tc:,.0f} N·m                                                      │
│   Rimpull:           {F_tc/1e3:.0f} kN at stall (decreases as TC couples)                      │
│   Best For:          Starting from standstill on steep grades                       │
│   Grade Limit:       ~25% from standstill                                           │
│   Tradeoff:          TC slip losses, only effective at low speed                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 4: EV Mode (Engine Off)                                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   Engine:            OFF                                                            │
│   MG2:               Drives output directly                                         │
│   Rimpull:           ~{pt.mg2.params.T_max * K_low * eta / r_w / 1e3:.0f} kN (MG2 only)                                         │
│   Best For:          Low speed maneuvering, quiet operation, short distances        │
│   Limitation:        Limited by battery capacity and MG2 power                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                         PERFORMANCE SUMMARY")
    print("=" * 85)

    # Calculate high gear rimpull values
    F_ecvt_high = T_ring_ecvt * K_high * eta / r_w
    F_locked_high = T_ring_locked * K_high * eta / r_w
    F_tc_high = T_ring_tc * K_high * eta / r_w

    # Grade forces
    grades = [0.05, 0.10, 0.15, 0.20, 0.25]

    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ RIMPULL - LOW GEAR ({K_low:.0f}:1 total)                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Speed       e-CVT Mode      Locked Sun      Locked + TC                           │
│   ─────       ──────────      ──────────      ───────────                           │
│   0 km/h        {F_ecvt/1e3:>5.0f} kN         {F_locked/1e3:>5.0f} kN         {F_tc/1e3:>5.0f} kN                          │
│   10 km/h       ~270 kN         {F_locked/1e3:>5.0f} kN         ~440 kN                          │
│   15 km/h       {F_locked/1e3:>5.0f} kN         {F_locked/1e3:>5.0f} kN         {F_locked/1e3:>5.0f} kN   (TC coupled)            │
│   20 km/h       ~190 kN         {F_locked/1e3:>5.0f} kN         {F_locked/1e3:>5.0f} kN                          │
│   Max Speed:    {pt.mg2.params.rpm_max * np.pi/30 * r_w / K_low * 3.6:.0f} km/h (MG2 @ {pt.mg2.params.rpm_max:.0f} rpm)                                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ RIMPULL - HIGH GEAR ({K_high:.1f}:1 total)                                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Speed       e-CVT Mode      Locked Sun      Locked + TC                           │
│   ─────       ──────────      ──────────      ───────────                           │
│   0 km/h        {F_ecvt_high/1e3:>5.0f} kN          {F_locked_high/1e3:>5.0f} kN         {F_tc_high/1e3:>5.0f} kN                          │
│   20 km/h       {F_ecvt_high/1e3:>5.0f} kN          {F_locked_high/1e3:>5.0f} kN          {F_locked_high/1e3:>5.0f} kN   (TC coupled)            │
│   40 km/h       {F_ecvt_high/1e3:>5.0f} kN          {F_locked_high/1e3:>5.0f} kN          {F_locked_high/1e3:>5.0f} kN                          │
│   Max Speed:    {pt.mg2.params.rpm_max * np.pi/30 * r_w / K_high * 3.6:.0f} km/h (MG2 @ {pt.mg2.params.rpm_max:.0f} rpm)                                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ GRADE CLIMBING CAPABILITY (Loaded: {m:,} kg)                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │""")

    print(f"│   {'Grade':<8} {'Resistance':>12}    {'Low Gear':>12}    {'High Gear':>12}    {'Lock+TC':>12}   │")
    print(f"│   {'─'*8} {'─'*12}    {'─'*12}    {'─'*12}    {'─'*12}   │")

    for grade in grades:
        theta = np.arctan(grade)
        F_need = m * grav * (np.sin(theta) + 0.015 * np.cos(theta))
        low = "✓" if F_locked >= F_need else "✗"
        high = "✓" if F_locked_high >= F_need else "✗"
        tc = "✓" if F_tc >= F_need else "✗"
        print(f"│   {grade*100:>6.0f}%   {F_need/1e3:>10.0f} kN    {low:>12}    {high:>12}    {tc:>12}   │")

    print(f"""│                                                                                      │
│   Note: Low/High gear columns show Locked Sun mode capability                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ GEAR SHIFT STRATEGY                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   MG2 Speed Limit:     {pt.mg2.params.rpm_max:,} rpm                                                     │
│   Low Gear Max Speed:  {pt.mg2.params.rpm_max * np.pi/30 * r_w / K_low * 3.6:.0f} km/h                                                      │
│   High Gear Max Speed: {pt.mg2.params.rpm_max * np.pi/30 * r_w / K_high * 3.6:.0f} km/h                                                     │
│   Recommended Shift:   ~25 km/h (upshift) / ~20 km/h (downshift)                    │
│                                                                                      │
│   Crossover Point: High gear rimpull ({F_locked_high/1e3:.0f} kN) sufficient for flat/mild grades    │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                      KEY EQUATIONS & RELATIONSHIPS")
    print("=" * 85)
    
    print(f"""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ WILLIS EQUATION (Planetary Kinematics)                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ω_sun = (1 + ρ)·ω_carrier - ρ·ω_ring                                              │
│   ω_MG1 = 4·ω_engine - 3·ω_ring        (for ρ = 3)                                  │
│                                                                                      │
│   At standstill (ω_ring = 0):  ω_MG1 = 4 × ω_engine                                 │
│   Engine @ 1200 rpm → MG1 @ 4800 rpm                                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ TORQUE RELATIONSHIPS                                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ = 1 : -4 : 3                         │
│                                                                                      │
│   Engine to Ring:    T_ring = ρ/(1+ρ) × T_engine = 0.75 × T_engine                  │
│   MG1 Reaction:      T_MG1 = -T_engine / (1+ρ) = -0.25 × T_engine                   │
│                                                                                      │
│   Total Ring Torque: T_ring_total = 0.75×T_engine + T_MG2                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ MG1 POWER LIMITATION                                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   T_MG1 = P_MG1 / ω_MG1        (in constant power region)                           │
│                                                                                      │
│   At standstill:  T_MG1 = 200 kW / (4800 rpm) = 398 N·m                             │
│   Max engine usable = (1+ρ) × T_MG1 = 4 × 398 = 1,592 N·m                           │
│                                                                                      │
│   This is why locked sun mode is needed for full engine torque!                     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ RIMPULL CALCULATION                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   F_rimpull = T_ring × K_gearbox × K_final × η / r_wheel                            │
│                                                                                      │
│   F = T_ring × {K_low:.0f} × {eta:.2f} / {r_w:.2f}                                                    │
│   F = T_ring × {K_low * eta / r_w:.1f}                                                            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                         OPERATING STRATEGY")
    print("=" * 85)
    
    print("""
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│   LAUNCH (0-10 km/h on grade):                                                      │
│   └─▶ Mode 3: Locked Sun + TC Stall                                                 │
│       Maximum rimpull (959 kN), TC provides torque multiplication                   │
│                                                                                      │
│   ACCELERATION (10-20 km/h):                                                        │
│   └─▶ Mode 2: Locked Sun (TC locks up)                                              │
│       Full engine torque (436 kN), TC at 1:1                                        │
│                                                                                      │
│   CRUISING (>20 km/h, flat/mild grade):                                             │
│   └─▶ Mode 1: e-CVT                                                                 │
│       Unlock sun, engine at optimal RPM, maximum efficiency                         │
│       MG1 generates, MG2 may motor or generate depending on load                    │
│                                                                                      │
│   GRADE CLIMBING (sustained):                                                       │
│   └─▶ Mode 2: Locked Sun                                                            │
│       Constant 436 kN available, engine directly coupled                            │
│                                                                                      │
│   DECELERATION/BRAKING:                                                             │
│   └─▶ Mode 1: e-CVT                                                                 │
│       MG2 regenerates, recovers energy to battery                                   │
│                                                                                      │
│   LOW SPEED MANEUVERING:                                                            │
│   └─▶ Mode 4: EV Mode                                                               │
│       Engine off, quiet operation, MG2 only                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
""")
    
    print("=" * 85)
    print("                              END OF OVERVIEW")
    print("=" * 85)

if __name__ == "__main__":
    main()
