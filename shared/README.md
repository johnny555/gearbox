# Cross-Validation Test Harness

This directory contains shared test vectors for ensuring Python and TypeScript implementations of the drivetrain simulation produce identical results.

## Quick Start

```bash
# Run full cross-validation
make cross-validate

# Or use the script directly
./scripts/cross-validate.sh
```

## How It Works

1. **Python generates reference values** - The Python implementation is the source of truth
2. **Test vectors stored in JSON** - `test-vectors.json` contains inputs and expected outputs
3. **TypeScript validates** - TypeScript tests read the JSON and verify they match

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Python      │────▶│  test-vectors.   │◀────│   TypeScript    │
│ (source of      │     │      json        │     │   (validates)   │
│    truth)       │     └──────────────────┘     └─────────────────┘
└─────────────────┘
```

## File Structure

```
shared/
├── README.md              # This file
└── test-vectors.json      # Generated test cases with expected values

scripts/
├── generate_test_vectors.py   # Python: generates expected values
└── cross-validate.sh          # Runner script for both languages

web/packages/drivetrain-sim/src/__tests__/
└── cross-validation.test.ts   # TypeScript: validates against vectors
```

## Test Suites

| Suite | Description | Tests |
|-------|-------------|-------|
| `willis_equation` | Planetary gear kinematics | 4 |
| `torque_ratios` | Torque balance ratios | 2 |
| `inertia_coefficients` | Coupled inertia matrix | 3 |
| `gear_ratio` | Gear ratio transformations | 3 |
| `road_load` | Vehicle road load forces | 5 |
| `torque_split` | Planetary torque distribution | 3 |

**Total: 20 test cases**

## Commands

### Generate test vectors (Python)
```bash
# Activate venv first
source .venv/bin/activate
python scripts/generate_test_vectors.py
```

### Run TypeScript validation
```bash
cd web/packages/drivetrain-sim
npm test -- run
```

### Full cross-validation
```bash
./scripts/cross-validate.sh
# or
make cross-validate
```

## Adding New Test Cases

1. **Add test case to `test-vectors.json`**:
   ```json
   {
     "id": "my_new_test",
     "description": "Description of what this tests",
     "input": { "param1": 1.0, "param2": 2.0 },
     "expected": { "result": null }  // null = will be generated
   }
   ```

2. **Add computation in `generate_test_vectors.py`**:
   ```python
   def compute_my_suite(test_case):
       inp = test_case["input"]
       # ... compute expected values ...
       return {"result": computed_value}
   ```

3. **Add validation in `cross-validation.test.ts`**:
   ```typescript
   describe('My Suite', () => {
     it('should match Python', () => {
       // ... validate against expected values ...
     });
   });
   ```

4. **Regenerate and validate**:
   ```bash
   make cross-validate
   ```

## Tolerance

- **Default**: `1e-10` (deterministic calculations)
- **Integration**: `1e-6` (ODE integration results)

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Cross-validate Python/TypeScript
  run: |
    source .venv/bin/activate
    ./scripts/cross-validate.sh
```

The script exits with code 0 on success, non-zero on failure.
