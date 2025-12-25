#!/bin/bash
# CR-Markup Migration Validation Suite Runner
# Reference: /schema/plan2.md Step 11

set -e

echo "=================================="
echo "CR-Markup Migration Validation"
echo "=================================="
echo ""

# Run the test suite
npx tsx tests/migration/migration_validation.test.ts

# Exit with the test result
exit $?
