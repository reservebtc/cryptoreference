/**
 * CR-Markup Protocol v1.0 - Deterministic Test Suite Runner
 *
 * Runs all tests to prevent regression:
 * - Hash determinism tests
 * - Backward compatibility tests (v1.x)
 * - Invalid CR rejection tests
 *
 * Exit codes:
 * - 0: All tests passed
 * - 1: Some tests failed
 *
 * Reference: /schema/plan.md Step 11
 */

import { runHashDeterminismTests } from './hash_determinism.test';
import { runBackwardCompatibilityTests } from './backward_compatibility.test';
import { runInvalidRejectionTests } from './invalid_rejection.test';

// ============================================
// TEST SUITE TYPES
// ============================================

interface TestSuiteResult {
  name: string;
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  duration: number;
}

interface AllTestsResult {
  passed: boolean;
  suites: TestSuiteResult[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
}

// ============================================
// TEST RUNNER
// ============================================

function runSuite(
  name: string,
  runFn: () => { passed: boolean; results: { name: string; passed: boolean; message: string }[] }
): TestSuiteResult {
  const startTime = Date.now();
  const result = runFn();
  const duration = Date.now() - startTime;

  const passedCount = result.results.filter(r => r.passed).length;
  const failedCount = result.results.filter(r => !r.passed).length;

  return {
    name,
    passed: result.passed,
    total: result.results.length,
    passedCount,
    failedCount,
    duration
  };
}

export function runAllTests(verbose = true): AllTestsResult {
  const suites: TestSuiteResult[] = [];

  if (verbose) {
    console.log('\n' + '═'.repeat(70));
    console.log('  CR-Markup Protocol v1.0 - Deterministic Test Suite');
    console.log('═'.repeat(70) + '\n');
  }

  // Run Hash Determinism Tests
  if (verbose) console.log('Running: Hash Determinism Tests...');
  const hashSuite = runSuite('Hash Determinism', runHashDeterminismTests);
  suites.push(hashSuite);
  if (verbose) {
    console.log(`  ${hashSuite.passed ? '✓' : '✗'} ${hashSuite.passedCount}/${hashSuite.total} passed (${hashSuite.duration}ms)\n`);
  }

  // Run Backward Compatibility Tests
  if (verbose) console.log('Running: Backward Compatibility Tests (v1.x)...');
  const compatSuite = runSuite('Backward Compatibility', runBackwardCompatibilityTests);
  suites.push(compatSuite);
  if (verbose) {
    console.log(`  ${compatSuite.passed ? '✓' : '✗'} ${compatSuite.passedCount}/${compatSuite.total} passed (${compatSuite.duration}ms)\n`);
  }

  // Run Invalid CR Rejection Tests
  if (verbose) console.log('Running: Invalid CR Rejection Tests...');
  const rejectSuite = runSuite('Invalid CR Rejection', runInvalidRejectionTests);
  suites.push(rejectSuite);
  if (verbose) {
    console.log(`  ${rejectSuite.passed ? '✓' : '✗'} ${rejectSuite.passedCount}/${rejectSuite.total} passed (${rejectSuite.duration}ms)\n`);
  }

  // Calculate totals
  const totalTests = suites.reduce((sum, s) => sum + s.total, 0);
  const totalPassed = suites.reduce((sum, s) => sum + s.passedCount, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failedCount, 0);
  const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);
  const allPassed = suites.every(s => s.passed);

  if (verbose) {
    console.log('─'.repeat(70));
    console.log('\n  Summary:');
    console.log('─'.repeat(70));

    for (const suite of suites) {
      const status = suite.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${status}  ${suite.name}: ${suite.passedCount}/${suite.total}`);
    }

    console.log('─'.repeat(70));
    console.log(`\n  Total: ${totalPassed}/${totalTests} tests passed`);
    console.log(`  Duration: ${totalDuration}ms`);
    console.log('\n' + '═'.repeat(70));
    console.log(allPassed
      ? '  ✓ ALL TESTS PASSED - No regression detected'
      : '  ✗ SOME TESTS FAILED - Regression detected!');
    console.log('═'.repeat(70) + '\n');
  }

  return {
    passed: allPassed,
    suites,
    totalTests,
    totalPassed,
    totalFailed,
    totalDuration
  };
}

// ============================================
// DETAILED TEST OUTPUT
// ============================================

function runDetailedTests(): void {
  console.log('\n' + '═'.repeat(70));
  console.log('  CR-Markup Protocol v1.0 - Detailed Test Results');
  console.log('═'.repeat(70) + '\n');

  // Hash Determinism Tests
  console.log('━'.repeat(70));
  console.log('  HASH DETERMINISM TESTS');
  console.log('━'.repeat(70));
  const hashResults = runHashDeterminismTests();
  for (const result of hashResults.results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status}: ${result.name}`);
    if (!result.passed) {
      console.log(`         ${result.message}`);
    }
  }
  console.log();

  // Backward Compatibility Tests
  console.log('━'.repeat(70));
  console.log('  BACKWARD COMPATIBILITY TESTS (v1.x)');
  console.log('━'.repeat(70));
  const compatResults = runBackwardCompatibilityTests();
  for (const result of compatResults.results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status}: ${result.name}`);
    if (!result.passed) {
      console.log(`         ${result.message}`);
    }
  }
  console.log();

  // Invalid CR Rejection Tests
  console.log('━'.repeat(70));
  console.log('  INVALID CR REJECTION TESTS');
  console.log('━'.repeat(70));
  const rejectResults = runInvalidRejectionTests();
  for (const result of rejectResults.results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status}: ${result.name}`);
    if (!result.passed) {
      console.log(`         ${result.message}`);
    }
  }
  console.log();
}

// ============================================
// CLI ENTRY POINT
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const detailed = args.includes('--detailed') || args.includes('-d');

  if (detailed) {
    runDetailedTests();
  }

  const result = runAllTests(true);

  // Exit with appropriate code
  process.exit(result.passed ? 0 : 1);
}
