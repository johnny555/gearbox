# Makefile for drivetrain simulation project
#
# Common tasks for maintaining Python/TypeScript parity

.PHONY: cross-validate generate-vectors test-ts test-py help

# Default target
help:
	@echo "Drivetrain Simulation - Available commands:"
	@echo ""
	@echo "  make cross-validate   Run full cross-validation (Python + TypeScript)"
	@echo "  make generate-vectors Generate test vectors from Python"
	@echo "  make test-ts          Run TypeScript tests"
	@echo "  make test-py          Run Python validation scripts"
	@echo ""

# Full cross-validation: generate vectors from Python, validate in TypeScript
cross-validate:
	@./scripts/cross-validate.sh

# Generate test vectors from Python (source of truth)
generate-vectors:
	@./scripts/cross-validate.sh --update

# Run TypeScript tests only (uses existing vectors)
test-ts:
	@cd web/packages/drivetrain-sim && npm test -- run

# Run Python validation examples
test-py:
	@source .venv/bin/activate && python examples/validate_components.py
