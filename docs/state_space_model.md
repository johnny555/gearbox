# E-CVT + 2-Speed Gearbox State-Space Model
## Target Vehicle: CAT 793D Mining Haul Truck

## System Architecture

```
        ┌─────────────────────────────────────────────────────────────────┐
        │                         POWER-SPLIT DEVICE                      │
   MG1 ─┤─ Sun Gear (30T) ─┐                                              │
  200kW │                  │                                              │
   ICE ─┤─ Carrier ────────┼──── Planetary Gear Set                       │
 1743kW │                  │                                              │
   MG2 ─┤─ Ring Gear (90T) ┴──────┬───────────────────────────────────────┤
  350kW └─────────────────────────┼───────────────────────────────────────┘
                                  ▼
                       ┌──────────────────┐      ┌─────────────┐
                       │  2-Speed Gearbox │──────│ Final Drive │───── Wheels
                       │ K₁=2.0, K₂=0.67  │      │   (Kf=9.0)  │
                       └──────────────────┘      └─────────────┘
```

---

## 1. System Parameters

### Planetary Gear Set
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Sun gear teeth | Zs | 30 | - |
| Ring gear teeth | Zr | 90 | - |
| Gear ratio | ρ = Zr/Zs | 3.0 | - |

### 2-Speed Gearbox
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Low gear ratio | K₁ | 2.0 | - |
| High gear ratio (overdrive) | K₂ | 0.67 | - |
| Final drive ratio | K_f | 9.0 | - |
| Gearbox efficiency | η_gb | 0.97 | - |
| Final drive efficiency | η_fd | 0.96 | - |

### CAT 793D Vehicle Parameters
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Empty mass | m_empty | 159,350 | kg |
| Payload capacity | m_payload | 217,724 | kg |
| Gross vehicle mass | m_v | 383,756 | kg |
| Wheel radius (40.00-R57) | r_w | 1.0 | m |
| Wheelbase | L_wb | 5.92 | m |
| Frontal area | A_f | 45.0 | m² |
| Drag coefficient | C_d | 0.9 | - |
| Rolling resistance (haul road) | C_r | 0.025 | - |
| Max vehicle speed | v_max | 54.2 | km/h |

### Engine Parameters (CAT 3516E - 793D Mining Application)
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Rated power (793D spec) | P_e_rated | 1,801 | kW (2,415 hp) |
| Industrial continuous power | P_e_cont | 1,566 | kW (2,100 hp) |
| Peak torque | T_e_max | 11,220 | N·m (8,275 lb-ft) |
| Speed at peak torque | ω_e_peak_tq | 1,200 | rpm |
| Speed at rated power | ω_e_rated | 1,650 | rpm |
| Engine speed range | ω_e | 700-1,800 | rpm |
| Low idle speed | ω_e_idle | 700 | rpm |
| Displacement | V_disp | 78.7 | L |
| Configuration | - | V16 quad-turbo | - |
| Bore × Stroke | - | 170 × 190 | mm |
| Engine inertia (estimated) | J_e | 25.0 | kg·m² |

**Torque Curve Approximation (Linear interpolation):**
| RPM | Torque (N·m) | Power (kW) |
|-----|--------------|------------|
| 700 | 9,500 | 697 |
| 1,000 | 10,800 | 1,131 |
| 1,200 | 11,220 | 1,410 |
| 1,400 | 10,900 | 1,598 |
| 1,650 | 10,420 | 1,801 |
| 1,800 | 9,800 | 1,847 |

**Note:** The 793D uses a higher power rating than standard industrial 3516E due to
quad-turbo configuration optimized for mining truck duty cycles.

### Electric Machine Parameters
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| MG1 max power | P_MG1_max | 200 | kW |
| MG1 max torque | T_MG1_max | 3,000 | N·m |
| MG1 base speed | ω_MG1_base | 637 | rpm |
| MG1 max speed | ω_MG1_max | 6,000 | rpm |
| MG1 inertia | J_MG1 | 2.0 | kg·m² |
| MG2 continuous power | P_MG2_cont | 350 | kW |
| MG2 boost power | P_MG2_boost | 500 | kW |
| MG2 max torque | T_MG2_max | 2,000 | N·m |
| MG2 max speed | ω_MG2_max | 4,000 | rpm |
| MG2 inertia | J_MG2 | 4.0 | kg·m² |
| Motor efficiency | η_MG | 0.92 | - |

### Battery Parameters (Estimated for Mining Application)
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Battery capacity | Q_batt | 200 | kWh |
| Nominal voltage | V_nom | 700 | V |
| Open circuit voltage | V_oc | 750 | V |
| Internal resistance | R_int | 0.05 | Ω |
| Max discharge power | P_batt_max | 1,000 | kW |
| SOC operating range | SOC | 0.3-0.8 | - |

### Environmental Constants
| Parameter | Symbol | Value | Unit |
|-----------|--------|-------|------|
| Air density | ρ_air | 1.225 | kg/m³ |
| Gravitational acceleration | g | 9.81 | m/s² |

---

## 2. State-Space Formulation

### State Vector
```
x = [ω_e, ω_r, SOC]ᵀ
```

| State | Description | Unit |
|-------|-------------|------|
| ω_e | Engine/carrier angular velocity | rad/s |
| ω_r | Ring gear/MG2 angular velocity | rad/s |
| SOC | Battery state of charge | 0-1 |

### Control Input Vector
```
u = [T_e, T_MG1, T_MG2, gear]ᵀ
```

| Input | Description | Unit |
|-------|-------------|------|
| T_e | Engine torque command | N·m |
| T_MG1 | MG1 torque command | N·m |
| T_MG2 | MG2 torque command | N·m |
| gear | Gear selection | {1, 2} |

### Disturbance Input
```
d = [θ]
```

| Disturbance | Description | Unit |
|-------------|-------------|------|
| θ | Road grade angle | rad |

---

## 3. Kinematic Equations

### Willis Equation (Planetary Gear Constraint)
```
ωs·Zs + ωr·Zr = ωc·(Zs + Zr)
```

With component assignments (MG1→sun, ICE→carrier, MG2→ring):
```
ω_MG1 = (1 + ρ)·ω_e - ρ·ω_r
```

**For ρ = 3.0:**
```
ω_MG1 = 4·ω_e - 3·ω_r
```

### Vehicle Speed
```
v = ω_r · r_w / (K_g · K_f)
```

Where K_g ∈ {2.0, 0.67} depending on gear selection.

**CAT 793D Speed-RPM Relationships:**

| Gear | K_g | K_total | v @ ω_r=1000rpm | ω_r @ v=15km/h |
|------|-----|---------|-----------------|----------------|
| Low  | 2.0 | 18.0    | 5.82 m/s = 21.0 km/h | 714 rpm |
| High (OD) | 0.67 | 6.0 | 17.5 m/s = 62.8 km/h | 238 rpm |

**Max speed check:**
- v_max = 54.2 km/h = 15.06 m/s
- In high gear (overdrive): ω_r = 15.06 × 6.0 / 1.0 = 90.4 rad/s = 863 rpm
- MG2 max speed: 4000 rpm ✓ (plenty of headroom)

**Note:** The overdrive ratio (0.67:1) means the output shaft spins 1.5× faster than
the gearbox input. This is suited for high-speed cruise on flat haul roads.

---

## 4. Torque Relationships

### Planetary Gear Torque Balance
```
τ_s + τ_r + τ_c = 0
τ_r/τ_s = ρ = 3.0
```

Torque ratios:
```
τ_s : τ_c : τ_r = 1 : -4 : 3
```

### Internal Gear Torques
```
τ_c = T_e - J_e·(dω_e/dt)
τ_s = -τ_c / 4
τ_r = 3·τ_s = -3·τ_c / 4
```

---

## 5. Dynamic Equations

### Equivalent Inertias
```
J_eq1 = J_e + (1+ρ)²·J_MG1 = J_e + 16·J_MG1
J_12  = -ρ·(1+ρ)·J_MG1 = -12·J_MG1
J_eq2 = J_MG2 + ρ²·J_MG1 = J_MG2 + 9·J_MG1
```

### Reflected Vehicle Inertia
```
J_v_refl = m_v·r_w² / (K_g·K_f)²
```

**Note:** This changes with gear selection!

### Coupled Inertia Matrix
```
     ┌                              ┐
J  = │ J_eq1        J_12            │
     │                              │
     │ J_12    J_eq2 + J_v_refl     │
     └                              ┘
```

### Determinant
```
det(J) = J_eq1·(J_eq2 + J_v_refl) - J_12²
```

### Input Torque Vector
```
     ┌                         ┐
τ  = │ T_e + 4·T_MG1           │
     │                         │
     │ 3·T_MG1 + T_MG2 - T_load│
     └                         ┘
```

---

## 6. Load Torque Calculation

### Resistance Forces
```
F_aero  = ½·ρ_air·C_d·A_f·v²           (aerodynamic drag)
F_roll  = m_v·g·C_r·cos(θ)             (rolling resistance)
F_grade = m_v·g·sin(θ)                 (grade resistance)
```

### Total Resistance Torque at Wheels
```
T_resist = r_w·(F_aero + F_roll + F_grade)
```

### Load Torque Reflected to Ring Gear
```
T_load = T_resist / (K_g · K_f · η_gb · η_fd)
```

---

## 7. State Equations

### Mechanical Dynamics (Matrix Form)
```
┌        ┐        ┌      ┐
│ dω_e/dt│   -1   │      │
│        │ = J   ·│  τ   │
│ dω_r/dt│        │      │
└        ┘        └      ┘
```

### Expanded Form

**dω_e/dt (Engine speed dynamics):**
```
dω_e/dt = [(J_eq2 + J_v_refl)·(T_e + 4·T_MG1) - J_12·(3·T_MG1 + T_MG2 - T_load)] / det(J)
```

**dω_r/dt (Ring/MG2 speed dynamics):**
```
dω_r/dt = [-J_12·(T_e + 4·T_MG1) + J_eq1·(3·T_MG1 + T_MG2 - T_load)] / det(J)
```

**dSOC/dt (Battery dynamics):**
```
dSOC/dt = -I_batt / Q_batt
```

Where battery current is:
```
I_batt = (V_oc - √(V_oc² - 4·R_int·P_batt)) / (2·R_int)
```

---

## 8. Electrical Power Calculations

### Motor/Generator Powers
```
P_MG1 = T_MG1 · ω_MG1 · η_MG1^(sign)
P_MG2 = T_MG2 · ω_r · η_MG2^(sign)
```

Where:
- If motoring (T·ω > 0): use 1/η (consuming electrical power)
- If generating (T·ω < 0): use η (producing electrical power)

### Total Battery Power
```
P_batt = P_MG1 + P_MG2 + P_aux
```

Sign convention: positive = discharging battery.

---

## 9. Operating Constraints

### Engine
```
ω_e,min ≤ ω_e ≤ ω_e,max
0 ≤ T_e ≤ T_e,max(ω_e)
```

### MG1
```
ω_MG1,min ≤ ω_MG1 ≤ ω_MG1,max
T_MG1,min(ω_MG1) ≤ T_MG1 ≤ T_MG1,max(ω_MG1)
```

### MG2
```
ω_r,min ≤ ω_r ≤ ω_r,max
T_MG2,min(ω_r) ≤ T_MG2 ≤ T_MG2,max(ω_r)
```

### Battery
```
SOC_min ≤ SOC ≤ SOC_max
P_batt,min ≤ P_batt ≤ P_batt,max
```

---

## 10. Operating Modes

### EV Mode (Engine Off)
```
T_e = 0, ω_e = 0
```
Vehicle powered entirely by MG2. MG1 must spin freely or be locked.

### Hybrid Mode (Normal)
```
ω_e > 0, T_e ≥ 0
```
Engine provides power, MG1 balances speed, MG2 provides torque assist.

### Regenerative Braking
```
T_MG2 < 0 (generating)
```
MG2 converts kinetic energy to electrical energy.

### Engine Charging (Stationary)
```
v = 0, ω_r = 0
ω_MG1 = 4·ω_e
```
Engine drives MG1 as generator to charge battery.

---

## 11. Gear Shift Logic

### Shift from Low (K₁=2.0) to High/Overdrive (K₂=0.67)

During clutch-to-clutch shift:
1. Oncoming clutch begins to engage
2. Off-going clutch releases
3. Synchronization torque managed by clutch slip

For seamless shift, the inertia coupling equations remain valid but reflected vehicle inertia changes:
```
J_v_refl(K₁) = m_v·r_w² / (2.0·K_f)² → J_v_refl(K₂) = m_v·r_w² / (0.67·K_f)²
```

Ratio: J_v_refl increases by factor of 9 when shifting to overdrive gear.

**Shift strategy:** Upshift to overdrive when:
- Vehicle speed > 25 km/h (flat road)
- Grade < 3%
- Engine load < 70%

---

## 12. Computed Inertia Values (CAT 793D)

With the specified parameters (J_e=25, J_MG1=2.0, J_MG2=4.0 kg·m²):

### Equivalent Inertias
```
J_eq1 = J_e + 16·J_MG1 = 25.0 + 16×2.0 = 57.0 kg·m²
J_12  = -12·J_MG1 = -12×2.0 = -24.0 kg·m²
J_eq2 = J_MG2 + 9·J_MG1 = 4.0 + 9×2.0 = 22.0 kg·m²
```

### Reflected Vehicle Inertia
```
J_v_refl(Low)  = 383,756 × 1.0² / (2.0 × 9.0)² = 383,756 / 324 = 1,184 kg·m²
J_v_refl(High) = 383,756 × 1.0² / (0.67 × 9.0)² = 383,756 / 36.4 = 10,543 kg·m²
```

### Inertia Matrix Determinants
```
det(J)_Low  = 57.0 × (22.0 + 1,184) - (-24.0)² = 68,742 - 576 = 68,166 kg²·m⁴
det(J)_High = 57.0 × (22.0 + 10,543) - (-24.0)² = 602,205 - 576 = 601,629 kg²·m⁴
```

**Note:** The large reflected vehicle inertia in overdrive (10,543 kg·m²) dominates the
system dynamics, making the powertrain very responsive to load changes in high gear.

---

## 13. Validation Test Cases

### Test Case 1: Steady-State Grade Climbing (10% Grade, Low Gear)

**Conditions:**
- v = 10 km/h = 2.78 m/s (constant)
- θ = arctan(0.10) = 5.71°
- Fully loaded: m_v = 383,756 kg
- Low gear: K_g = 2.0

**Expected Forces:**
```
F_grade = m_v·g·sin(θ) = 383,756 × 9.81 × 0.0995 = 374,500 N
F_roll  = m_v·g·C_r·cos(θ) = 383,756 × 9.81 × 0.025 × 0.995 = 93,700 N
F_aero  = ½·ρ·C_d·A_f·v² = 0.5 × 1.225 × 0.9 × 45 × 2.78² = 192 N
F_total = 468,392 N
```

**Expected Power:**
```
P_total = F_total × v = 468,392 × 2.78 = 1,302 kW
```

**Validation criterion:** Total power demand ~1,300 kW (within engine capability of 1,801 kW)

**Expected Torques at Ring Gear:**
```
T_wheel = F_total × r_w = 468,392 × 1.0 = 468,392 N·m
T_load  = T_wheel / (K_g × K_f × η) = 468,392 / (18 × 0.93) = 27,987 N·m
```

**Check MG2 capability:** T_load = 27,987 N·m >> T_MG2_max = 2,000 N·m
→ Engine must provide majority of torque through planetary gear

---

### Test Case 2: Flat Ground Acceleration (Empty Vehicle)

**Conditions:**
- v_0 = 0, target v = 30 km/h = 8.33 m/s
- θ = 0°
- Empty: m_v = 159,350 kg
- Low gear: K_g = 2.0
- Full power: P_total = 1,801 kW (engine) + 500 kW (MG2 boost) = 2,301 kW

**Expected Acceleration:**
```
F_accel = P / v_avg = 2,301,000 / 4.17 ≈ 552,000 N (approx at v_avg)
a_max = F_accel / m_v = 552,000 / 159,350 = 3.46 m/s²
```

**Expected time to 30 km/h:**
```
t = v / a = 8.33 / 3.46 ≈ 2.4 s (ideal, neglecting resistances)
```

**Validation criterion:** 0-30 km/h in approximately 3-5 seconds (accounting for resistances)

---

### Test Case 3: Kinematic Constraint Verification

**Test the Willis equation at various operating points:**

| Engine (rpm) | MG2/Ring (rpm) | Expected MG1 (rpm) | Formula Check |
|--------------|----------------|---------------------|---------------|
| 1500 | 0 | 6000 | 4×1500 - 3×0 = 6000 ✓ |
| 1500 | 1000 | 3000 | 4×1500 - 3×1000 = 3000 ✓ |
| 1500 | 2000 | 0 | 4×1500 - 3×2000 = 0 ✓ |
| 1500 | 2500 | -1500 | 4×1500 - 3×2500 = -1500 ✓ |
| 0 | 1000 | -3000 | 4×0 - 3×1000 = -3000 ✓ |

**Note:** Negative MG1 speed indicates reverse rotation (generating mode typical)

---

### Test Case 4: Power Split Ratio Verification

**At steady state (no acceleration), the planetary gear splits engine torque:**

```
τ_s : τ_c : τ_r = 1 : -4 : 3
```

**For T_e = 11,220 N·m (peak engine torque at 1200 rpm):**
```
τ_c = T_e = 11,220 N·m
τ_s = -τ_c / 4 = -2,805 N·m (reaction on MG1)
τ_r = 3 × τ_s = -8,415 N·m (to output)
```

**Power split (at ω_e = 1200 rpm = 125.7 rad/s):**
```
P_engine = T_e × ω_e = 11,220 × 125.7 = 1,410 kW

For mechanical path efficiency ~75%:
P_to_wheels ≈ 1,058 kW
P_through_MG1 ≈ 352 kW (electrical recirculation)
```

**Check MG1 capability:** τ_s = 2,805 N·m < T_MG1_max = 3,000 N·m ✓
→ MG1 adequately sized for full engine torque operation

---

### Test Case 5: Gear Shift Transition

**Shift from Low to Overdrive at v = 30 km/h:**

**Before shift (Low gear, K_g=2.0):**
```
ω_r = v × K_g × K_f / r_w = 8.33 × 18 / 1.0 = 150 rad/s = 1432 rpm
```

**After shift (Overdrive, K_g=0.67):**
```
ω_r = v × K_g × K_f / r_w = 8.33 × 6.0 / 1.0 = 50 rad/s = 477 rpm
```

**Validation:** MG2 speed drops by factor of 3 during shift, but vehicle speed unchanged.

**Inertia change during shift:**
```
J_v_refl: 1,184 kg·m² → 10,543 kg·m² (9× increase)
```

This significantly increases the effective vehicle inertia seen by the powertrain,
making the system more sensitive to torque disturbances in overdrive.

---

### Test Case 6: Regenerative Braking (Downhill)

**Conditions:**
- v = 20 km/h = 5.56 m/s (constant)
- θ = -10% grade (descending)
- Fully loaded: m_v = 383,756 kg

**Expected Regeneration:**
```
F_grade = -374,500 N (now assists motion)
F_roll  = 93,700 N (still resists)
F_aero  = 768 N (at 20 km/h)

F_net = -374,500 + 93,700 + 768 = -280,032 N (driving force available)

P_regen = F_net × v = 280,032 × 5.56 = 1,557 kW (potential)
```

**Limited by battery:** P_regen_actual = min(1,557, P_batt_max) = 1,000 kW

**Validation:** Mechanical brakes must absorb remaining 557 kW

---

## 14. Reference Validation (Liu & Peng 2008)

To validate model implementation, first simulate with Toyota Prius parameters:

### Prius Reference Parameters
| Parameter | Value |
|-----------|-------|
| Vehicle mass | 1,254 kg |
| Wheel radius | 0.287 m |
| Final drive | 3.9 |
| PG ratio (ρ) | 2.6 |
| Engine inertia | 0.18 kg·m² |
| MG1 inertia | 0.023 kg·m² |
| MG2 inertia | 0.023 kg·m² |

### Expected Results (UDDS Cycle)
| Metric | DP Optimal | Acceptable Range |
|--------|------------|------------------|
| Fuel Economy | 67 mpg | 60-70 mpg |
| SOC Final | ~SOC Initial | ±5% |

If Prius simulation matches, scale to CAT 793D parameters with confidence.

---

## References

1. Liu, J. & Peng, H. (2008). "Modeling and Control of a Power-Split Hybrid Vehicle." IEEE Trans. Control Systems Technology.
2. Zhang, X., Peng, H., Sun, J. (2012). "Design of Power-Split Hybrid Vehicles with a Single Planetary Gear." ASME DSCC.
3. Corbelli, P. PhD Thesis. "Analysis of e-CVT Power Split Drivelines." University of Bologna.
4. Ke, et al. (2025). "Powertrain configuration design for two mode power split hybrid electric vehicle." Nature Scientific Reports.
5. CAT 793D Specifications. Caterpillar Inc. https://www.ritchiespecs.com/model/caterpillar-793d-rock-truck
