#!/bin/bash
#
# Cross-validation script for Python/TypeScript drivetrain simulation
#
# This script:
# 1. Generates reference test vectors from Python
# 2. Runs TypeScript tests that validate against those vectors
# 3. Reports any discrepancies
#
# Usage:
#   ./scripts/cross-validate.sh           # Run full validation
#   ./scripts/cross-validate.sh --update  # Regenerate vectors only
#   ./scripts/cross-validate.sh --check   # Validate without regenerating
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
VECTORS_FILE="$REPO_ROOT/shared/test-vectors.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Drivetrain Simulation Cross-Validation"
echo "========================================"
echo ""

# Parse arguments
UPDATE_ONLY=false
CHECK_ONLY=false

for arg in "$@"; do
    case $arg in
        --update)
            UPDATE_ONLY=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--update|--check]"
            exit 1
            ;;
    esac
done

# Check if Python virtual environment exists
if [ ! -d "$REPO_ROOT/.venv" ]; then
    echo -e "${RED}Error: Python virtual environment not found at $REPO_ROOT/.venv${NC}"
    echo "Create it with: python -m venv .venv && source .venv/bin/activate && pip install -e ."
    exit 1
fi

# Step 1: Generate test vectors from Python (unless --check)
if [ "$CHECK_ONLY" = false ]; then
    echo "Step 1: Generating test vectors from Python..."
    echo "----------------------------------------"

    cd "$REPO_ROOT"
    source .venv/bin/activate
    python scripts/generate_test_vectors.py

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Python test vector generation failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Python test vectors generated${NC}"
    echo ""
fi

# Step 2: Run TypeScript validation (unless --update)
if [ "$UPDATE_ONLY" = false ]; then
    echo "Step 2: Validating TypeScript implementation..."
    echo "----------------------------------------"

    cd "$REPO_ROOT/web/packages/drivetrain-sim"

    # Check if test vectors exist
    if [ ! -f "$VECTORS_FILE" ]; then
        echo -e "${RED}Error: Test vectors file not found: $VECTORS_FILE${NC}"
        echo "Run with --update first to generate test vectors"
        exit 1
    fi

    # Check if vectors have been generated (not null timestamp)
    if grep -q '"generated_at": null' "$VECTORS_FILE"; then
        echo -e "${RED}Error: Test vectors have not been generated${NC}"
        echo "Run: python scripts/generate_test_vectors.py"
        exit 1
    fi

    npm test -- run

    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}✗ TypeScript validation FAILED${NC}"
        echo ""
        echo "The TypeScript implementation does not match Python."
        echo "Check the test output above for details."
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✓ TypeScript validation passed${NC}"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}Cross-validation PASSED${NC}"
echo "========================================"
echo ""
echo "Both Python and TypeScript implementations produce identical results."
echo ""
echo "Test vectors location: $VECTORS_FILE"
echo "Generated at: $(grep '"generated_at"' "$VECTORS_FILE" | cut -d'"' -f4)"
