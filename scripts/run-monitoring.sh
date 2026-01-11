#!/usr/bin/env bash
#
# MONITORING RUNNER SCRIPT
# Single deterministic entrypoint for monitoring execution
#
# Governed by: /schema/monitoring-spec.md, plan-monitoring.md Step 11
#
# RESPONSIBILITIES:
# - Call monitoring runner (local + CI compatible)
# - Enforce read-only mode
# - Write report ONLY into /monitoring/reports/
# - Exit codes: 0 = PASS, 1 = FAIL (internal corruption only)
#
# CONSTRAINTS:
# - MUST NOT modify any path outside /monitoring/**
# - MUST NOT call generation/planning scripts
# - MUST be deterministic (no timestamps, no randomness)
#

set -euo pipefail

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITORING_DIR="$ROOT_DIR/monitoring"
REPORTS_DIR="$MONITORING_DIR/reports"

# -------------------------------------------------------------------
# Pre-flight Checks
# -------------------------------------------------------------------

echo "========================================"
echo "  Monitoring Runner"
echo "========================================"
echo ""
echo "Root directory: $ROOT_DIR"
echo "Monitoring directory: $MONITORING_DIR"
echo ""

# Verify monitoring directory exists
if [[ ! -d "$MONITORING_DIR" ]]; then
    echo "ERROR: Monitoring directory not found: $MONITORING_DIR"
    exit 1
fi

# Verify reports directory exists
if [[ ! -d "$REPORTS_DIR" ]]; then
    echo "Creating reports directory: $REPORTS_DIR"
    mkdir -p "$REPORTS_DIR"
fi

# Verify required modules exist
REQUIRED_MODULES=(
    "loader.ts"
    "consistency.ts"
    "topology.ts"
    "metadata.ts"
    "snapshot.ts"
    "report.ts"
    "lockdown.test.ts"
)

for module in "${REQUIRED_MODULES[@]}"; do
    if [[ ! -f "$MONITORING_DIR/$module" ]]; then
        echo "ERROR: Required module not found: $MONITORING_DIR/$module"
        exit 1
    fi
done

echo "Pre-flight checks: PASSED"
echo ""

# -------------------------------------------------------------------
# Step 0: Implementation Validation (optional, --validate flag)
# -------------------------------------------------------------------

if [[ "${1:-}" == "--validate" ]]; then
    echo "----------------------------------------"
    echo "Step 0: Implementation Validation"
    echo "----------------------------------------"

    if ! npx tsx "$MONITORING_DIR/validate-implementation.ts" "$ROOT_DIR"; then
        echo ""
        echo "ERROR: Implementation validation failed"
        exit 1
    fi

    echo ""
    echo "Implementation validation: PASSED"
    echo ""
fi

# -------------------------------------------------------------------
# Step 1: Run Lockdown Tests
# -------------------------------------------------------------------

echo "----------------------------------------"
echo "Step 1: Lockdown Tests"
echo "----------------------------------------"

if ! npx tsx "$MONITORING_DIR/lockdown.test.ts" "$ROOT_DIR"; then
    echo ""
    echo "ERROR: Lockdown tests failed"
    echo "Monitoring cannot proceed until lockdown violations are fixed."
    exit 1
fi

echo ""
echo "Lockdown tests: PASSED"
echo ""

# -------------------------------------------------------------------
# Step 2: Run Monitoring Report
# -------------------------------------------------------------------

echo "----------------------------------------"
echo "Step 2: Canonical Integrity Check"
echo "----------------------------------------"

# Capture report output
REPORT_OUTPUT=$(npx tsx "$MONITORING_DIR/report.ts" "$ROOT_DIR" 2>&1) || true

echo "$REPORT_OUTPUT"
echo ""

# Extract status from output
STATUS=$(echo "$REPORT_OUTPUT" | jq -r '.status // "unknown"')
REPORT_ID=$(echo "$REPORT_OUTPUT" | jq -r '.report_id // "unknown"')
TOTAL_VIOLATIONS=$(echo "$REPORT_OUTPUT" | jq -r '.total_violations // 0')
SAVED_TO=$(echo "$REPORT_OUTPUT" | jq -r '.saved_to // "unknown"')

# -------------------------------------------------------------------
# Step 3: Verify Report Written
# -------------------------------------------------------------------

echo "----------------------------------------"
echo "Step 3: Verify Report"
echo "----------------------------------------"

# Handle both absolute and relative paths
if [[ "$SAVED_TO" != "unknown" ]]; then
    if [[ -f "$SAVED_TO" ]]; then
        echo "Report file: $SAVED_TO"
        echo "Report ID: $REPORT_ID"
        echo "Violations: $TOTAL_VIOLATIONS"
    elif [[ -f "$ROOT_DIR/$SAVED_TO" ]]; then
        echo "Report file: $SAVED_TO"
        echo "Report ID: $REPORT_ID"
        echo "Violations: $TOTAL_VIOLATIONS"
    else
        echo "WARNING: Report file not found: $SAVED_TO"
    fi
else
    echo "WARNING: Report path unknown"
fi

echo ""

# -------------------------------------------------------------------
# Final Summary
# -------------------------------------------------------------------

echo "========================================"
if [[ "$STATUS" == "pass" ]]; then
    echo "  Monitoring: PASSED"
    echo "========================================"
    echo ""
    echo "All canonical integrity checks passed."
    echo "No internal corruption detected."
    echo ""
    echo "Report: $SAVED_TO"
    exit 0
else
    echo "  Monitoring: FAILED"
    echo "========================================"
    echo ""
    echo "Internal corruption detected!"
    echo "Violations: $TOTAL_VIOLATIONS"
    echo ""
    echo "See report for details: $SAVED_TO"
    exit 1
fi
