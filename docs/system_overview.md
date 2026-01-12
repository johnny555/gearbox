# CAT 793D E-CVT Hybrid Drivetrain - System Overview

## System Architecture

```
┌─────────┐    ┌─────────────────┐    ┌───────────────────┐    ┌──────────────┐
│  ICE    │───▶│ Torque Converter│───▶│  Planetary Gear   │───▶│   2-Speed    │
│ Engine  │    │   (2.5:1 stall) │    │   Set (ρ = 3.0)   │    │   Gearbox    │
└─────────┘    └─────────────────┘    └───────────────────┘    └──────┬───────┘
                                             ▲           │            │
                                       ┌─────┴─────┐     │            ▼
                                       │   MG1     │     │     ┌──────────────┐
                                       │  (Sun)    │     │     │ Final Drive  │
                                       │  200 kW   │     │     │   (16:1)     │
                                       └───────────┘     │     └──────┬───────┘
                                                         │            │
                                       ┌─────────────┐   │            ▼
                                       │    MG2      │───┘     ┌──────────────┐
                                       │   (Ring)    │         │    Wheels    │
                                       │   350 kW    │         │  (r = 1.78m) │
                                       └─────────────┘         └──────────────┘

Sun Lockup Clutch: Allows locking MG1/sun for direct engine-to-ring torque path
```

---

## Component Specifications

### Diesel Engine (CAT 3516E)

| Parameter | Value |
|-----------|-------|
| Configuration | V16 Quad-Turbo, 78.7L displacement |
| Rated Power | 1,801 kW (2,415 hp) @ 1,650 rpm |
| Peak Torque | 11,220 N·m @ 1,200 rpm |
| Speed Range | 700 - 1,800 rpm |
| Inertia | 25.0 kg·m² |

### Torque Converter

| Parameter | Value |
|-----------|-------|
| Type | Single-stage, three-element with lock-up clutch |
| Stall Ratio | 2.5:1 |
| Max Input Torque | 11,220 N·m |
| Max Output Torque | 28,050 N·m (at stall) |
| Lock-up | Engages above ~10 km/h for efficiency |

### Planetary Gear Set (Power Split Device)

| Parameter | Value |
|-----------|-------|
| Sun Gear | 30 teeth (connected to MG1) |
| Ring Gear | 90 teeth (connected to MG2 and output) |
| Carrier | Connected to TC output (engine path) |
| Ratio (ρ) | 3.0 (Zr/Zs) |
| Torque Split | 75% to ring, 25% reacted by sun |
| Sun Lockup | Clutch/brake to lock sun for direct drive mode |

### MG1 - Motor/Generator 1 (Sun Gear)

| Parameter | Value |
|-----------|-------|
| Power | 200 kW continuous |
| Max Torque | 3,000 N·m |
| Base Speed | 637 rpm (transition to constant power) |
| Max Speed | 6,000 rpm |
| Efficiency | 92% |
| Function | Reacts engine torque, controls engine speed, generates power |

### MG2 - Motor/Generator 2 (Ring Gear / Output)

| Parameter | Value |
|-----------|-------|
| Power | 350 kW continuous / 500 kW boost |
| Max Torque | 2,000 N·m |
| Max Speed | 4,000 rpm |
| Efficiency | 92% |
| Function | Direct drive torque, regenerative braking, EV mode |

### 2-Speed Gearbox + Final Drive

| Parameter | Value |
|-----------|-------|
| Low Gear | 5.0:1 |
| High Gear | 0.67:1 (overdrive) |
| Final Drive | 16.0:1 |
| **Total Low** | **80:1** |
| **Total High** | **10.7:1** |
| Efficiency | 93% (gearbox × final drive) |

### Vehicle

| Parameter | Value |
|-----------|-------|
| Empty Mass | 159,350 kg |
| Payload | 217,724 kg |
| Gross Mass | 377,074 kg (loaded) |
| Wheel Radius | 1.78 m (59/80R63 tires) |
| Rolling Resistance | 0.015 (maintained haul road) |

---

## Operating Modes

### Mode 1: e-CVT (Normal Driving)

| Parameter | Value |
|-----------|-------|
| Sun | FREE (MG1 controls speed) |
| TC | LOCKED (1:1) |
| Characteristics | Continuously variable ratio, engine at optimal RPM |
| Engine Usable | 1,592 N·m (limited by MG1 power at high MG1 rpm) |
| Ring Torque | 3,194 N·m |
| Rimpull | 134 kN (standstill) to 436 kN (at ~15 km/h sweet spot) |
| Best For | Cruising, regen braking, fuel efficiency |
| Grade Limit | ~10% (at speed), limited at standstill |

### Mode 2: Locked Sun (Direct Drive)

| Parameter | Value |
|-----------|-------|
| Sun | LOCKED (brake engaged) |
| TC | LOCKED (1:1) |
| Characteristics | Fixed ratio, full engine torque available |
| Engine Usable | 11,220 N·m (100% - no MG1 limitation) |
| Ring Torque | 10,415 N·m |
| Rimpull | 436 kN (constant across speed range) |
| Best For | Sustained grade climbing, heavy pulling |
| Grade Limit | ~10% from standstill |
| Tradeoff | Fixed engine-to-output ratio (1.33:1 through planetary) |

### Mode 3: Locked Sun + TC Stall (Maximum Launch)

| Parameter | Value |
|-----------|-------|
| Sun | LOCKED (brake engaged) |
| TC | STALL (2.5:1 multiplication) |
| Characteristics | Maximum torque multiplication for launch/steep grades |
| Engine Torque | 11,220 N·m × 2.5 = 28,050 N·m after TC |
| Ring Torque | 23,038 N·m |
| Rimpull | 964 kN at stall (decreases as TC couples) |
| Best For | Starting from standstill on steep grades |
| Grade Limit | ~25% from standstill |
| Tradeoff | TC slip losses, only effective at low speed |

### Mode 4: EV Mode (Engine Off)

| Parameter | Value |
|-----------|-------|
| Engine | OFF |
| MG2 | Drives output directly |
| Rimpull | ~84 kN (MG2 only) |
| Best For | Low speed maneuvering, quiet operation, short distances |
| Limitation | Limited by battery capacity and MG2 power |

---

## Performance Summary

### Rimpull - Low Gear (80:1 total)

| Speed | e-CVT Mode | Locked Sun | Locked + TC |
|-------|------------|------------|-------------|
| 0 km/h | 134 kN | 436 kN | 964 kN |
| 10 km/h | ~270 kN | 436 kN | ~440 kN |
| 15 km/h | 436 kN | 436 kN | 436 kN (TC coupled) |
| 20 km/h | ~190 kN | 436 kN | 436 kN |
| **Max Speed** | **34 km/h** (MG2 @ 4000 rpm) | | |

### Rimpull - High Gear (10.7:1 total)

| Speed | e-CVT Mode | Locked Sun | Locked + TC |
|-------|------------|------------|-------------|
| 0 km/h | 18 kN | 58 kN | 129 kN |
| 20 km/h | 18 kN | 58 kN | 58 kN (TC coupled) |
| 40 km/h | 18 kN | 58 kN | 58 kN |
| **Max Speed** | **250 km/h** (MG2 @ 4000 rpm) | | |

### Grade Climbing Capability (Loaded: 377,074 kg)

| Grade | Resistance | Low Gear | High Gear | Lock+TC |
|-------|------------|----------|-----------|---------|
| 5% | 240 kN | ✓ | ✗ | ✓ |
| 10% | 423 kN | ✓ | ✗ | ✓ |
| 15% | 604 kN | ✗ | ✗ | ✓ |
| 20% | 780 kN | ✗ | ✗ | ✓ |
| 25% | 951 kN | ✗ | ✗ | ✓ |

*Note: Low/High gear columns show Locked Sun mode capability*

### Gear Shift Strategy

| Parameter | Value |
|-----------|-------|
| MG2 Speed Limit | 4,000 rpm |
| Low Gear Max Speed | 34 km/h |
| High Gear Max Speed | 250 km/h |
| Recommended Shift | ~25 km/h (upshift) / ~20 km/h (downshift) |
| Crossover Point | High gear rimpull (58 kN) sufficient for flat/mild grades |

---

## Key Equations & Relationships

### Willis Equation (Planetary Kinematics)

```
ω_sun = (1 + ρ)·ω_carrier - ρ·ω_ring
ω_MG1 = 4·ω_engine - 3·ω_ring        (for ρ = 3)

At standstill (ω_ring = 0):  ω_MG1 = 4 × ω_engine
Engine @ 1200 rpm → MG1 @ 4800 rpm
```

### Torque Relationships

```
τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ = 1 : -4 : 3

Engine to Ring:    T_ring = ρ/(1+ρ) × T_engine = 0.75 × T_engine
MG1 Reaction:      T_MG1 = -T_engine / (1+ρ) = -0.25 × T_engine

Total Ring Torque: T_ring_total = 0.75×T_engine + T_MG2
```

### MG1 Power Limitation

```
T_MG1 = P_MG1 / ω_MG1        (in constant power region)

At standstill:  T_MG1 = 200 kW / (4800 rpm) = 398 N·m
Max engine usable = (1+ρ) × T_MG1 = 4 × 398 = 1,592 N·m

This is why locked sun mode is needed for full engine torque!
```

### Rimpull Calculation

```
F_rimpull = T_ring × K_gearbox × K_final × η / r_wheel

Low Gear:  F = T_ring × 80 × 0.93 / 1.78 = T_ring × 41.9
High Gear: F = T_ring × 10.7 × 0.93 / 1.78 = T_ring × 5.6
```

---

## Operating Strategy

| Condition | Mode | Notes |
|-----------|------|-------|
| **Launch (0-10 km/h on grade)** | Mode 3: Locked Sun + TC Stall | Maximum rimpull (964 kN), TC provides torque multiplication |
| **Acceleration (10-20 km/h)** | Mode 2: Locked Sun (TC locks up) | Full engine torque (436 kN), TC at 1:1 |
| **Cruising (>20 km/h, flat/mild grade)** | Mode 1: e-CVT | Unlock sun, engine at optimal RPM, maximum efficiency. MG1 generates, MG2 may motor or generate depending on load |
| **Grade Climbing (sustained)** | Mode 2: Locked Sun | Constant 436 kN available, engine directly coupled |
| **Deceleration/Braking** | Mode 1: e-CVT | MG2 regenerates, recovers energy to battery |
| **Low Speed Maneuvering** | Mode 4: EV Mode | Engine off, quiet operation, MG2 only |

---

## Summary

The CAT 793D e-CVT hybrid drivetrain combines:

- **Torque converter** (2.5:1 stall) for launch torque multiplication
- **Planetary power-split** (ρ=3.0) for e-CVT operation
- **Sun lockup clutch** to bypass MG1 limitation for full engine torque
- **2-speed gearbox** (80:1 low / 10.7:1 high) for speed range

This enables:
- **964 kN** rimpull at launch (25% grade capability)
- **436 kN** sustained rimpull (10% grade capability)
- **e-CVT efficiency** at cruising speeds
- **Regenerative braking** via MG2
