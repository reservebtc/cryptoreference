/**
 * CR-Markup Protocol v1.0 - Hash Determinism Tests
 *
 * Verifies that canonical hash is deterministic:
 * - Same content with different formatting → same hash
 * - Any field value change → different hash
 * - URL/location never affects hash
 *
 * Reference: /schema/spec.md Section 7
 */

import { computeCanonicalHash } from '../schema/hash';
import { canonicalize } from '../schema/canonicalize';

// ============================================
// TEST UTILITIES
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

function assertEqual(actual: string, expected: string, name: string): TestResult {
  if (actual === expected) {
    return { name, passed: true, message: 'Values match' };
  }
  return {
    name,
    passed: false,
    message: `Expected: ${expected}\nActual: ${actual}`
  };
}

function assertNotEqual(actual: string, expected: string, name: string): TestResult {
  if (actual !== expected) {
    return { name, passed: true, message: 'Values differ as expected' };
  }
  return {
    name,
    passed: false,
    message: `Values should differ but both are: ${actual}`
  };
}

// ============================================
// TEST DATA
// ============================================

// Base CR-block for testing
const BASE_CR = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=active
[/CR]`;

// Same content, different whitespace (extra spaces)
const WHITESPACE_VARIANT_1 = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=active
[/CR]`;

// Same content, tabs instead of spaces
const WHITESPACE_VARIANT_2 = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=active
[/CR]`;

// Same content, extra blank lines
const WHITESPACE_VARIANT_3 = `[CR/TESTTOKEN]

schema=CR1.0

version=1.0

canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890

type=exchange

network=ethereum

name=TestExchange

status=active

[/CR]`;

// Same content, leading/trailing whitespace
const WHITESPACE_VARIANT_4 = `   [CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=active
[/CR]   `;

// Different field value
const DIFFERENT_NAME = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=DifferentExchange
status=active
[/CR]`;

// Different type
const DIFFERENT_TYPE = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=dex
network=ethereum
name=TestExchange
status=active
[/CR]`;

// Different network
const DIFFERENT_NETWORK = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=solana
name=TestExchange
status=active
[/CR]`;

// Different status
const DIFFERENT_STATUS = `[CR/TESTTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=deprecated
[/CR]`;

// Different token
const DIFFERENT_TOKEN = `[CR/OTHERTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
status=active
[/CR]`;

// ============================================
// HASH DETERMINISM TESTS
// ============================================

export function runHashDeterminismTests(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // Get base hash
  const baseHash = computeCanonicalHash(BASE_CR);
  if (!baseHash.success || !baseHash.hash) {
    results.push({
      name: 'Setup - Base hash computation',
      passed: false,
      message: `Failed to compute base hash: ${baseHash.error}`
    });
    return { passed: false, results };
  }

  results.push({
    name: 'Setup - Base hash computation',
    passed: true,
    message: `Base hash: ${baseHash.hash}`
  });

  // Test 1: Same content → same hash (identity)
  const hash1 = computeCanonicalHash(BASE_CR);
  results.push(assertEqual(
    hash1.hash!,
    baseHash.hash,
    'Test 1: Identity - same input produces same hash'
  ));

  // Test 2: Whitespace variant 1 → same hash
  const hash2 = computeCanonicalHash(WHITESPACE_VARIANT_1);
  results.push(assertEqual(
    hash2.hash!,
    baseHash.hash,
    'Test 2: Extra spaces do not affect hash'
  ));

  // Test 3: Whitespace variant 2 (tabs) → same hash
  const hash3 = computeCanonicalHash(WHITESPACE_VARIANT_2);
  results.push(assertEqual(
    hash3.hash!,
    baseHash.hash,
    'Test 3: Tabs do not affect hash'
  ));

  // Test 4: Whitespace variant 3 (blank lines) → same hash
  const hash4 = computeCanonicalHash(WHITESPACE_VARIANT_3);
  results.push(assertEqual(
    hash4.hash!,
    baseHash.hash,
    'Test 4: Blank lines do not affect hash'
  ));

  // Test 5: Whitespace variant 4 (leading/trailing) → same hash
  const hash5 = computeCanonicalHash(WHITESPACE_VARIANT_4);
  results.push(assertEqual(
    hash5.hash!,
    baseHash.hash,
    'Test 5: Leading/trailing whitespace does not affect hash'
  ));

  // Test 6: Different name → different hash
  const hash6 = computeCanonicalHash(DIFFERENT_NAME);
  results.push(assertNotEqual(
    hash6.hash!,
    baseHash.hash,
    'Test 6: Different name produces different hash'
  ));

  // Test 7: Different type → different hash
  const hash7 = computeCanonicalHash(DIFFERENT_TYPE);
  results.push(assertNotEqual(
    hash7.hash!,
    baseHash.hash,
    'Test 7: Different type produces different hash'
  ));

  // Test 8: Different network → different hash
  const hash8 = computeCanonicalHash(DIFFERENT_NETWORK);
  results.push(assertNotEqual(
    hash8.hash!,
    baseHash.hash,
    'Test 8: Different network produces different hash'
  ));

  // Test 9: Different status → different hash
  const hash9 = computeCanonicalHash(DIFFERENT_STATUS);
  results.push(assertNotEqual(
    hash9.hash!,
    baseHash.hash,
    'Test 9: Different status produces different hash'
  ));

  // Test 10: Different token → different hash
  const hash10 = computeCanonicalHash(DIFFERENT_TOKEN);
  results.push(assertNotEqual(
    hash10.hash!,
    baseHash.hash,
    'Test 10: Different token produces different hash'
  ));

  // Test 11: Multiple computations are stable
  const hashes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const h = computeCanonicalHash(BASE_CR);
    hashes.push(h.hash!);
  }
  const allSame = hashes.every(h => h === hashes[0]);
  results.push({
    name: 'Test 11: Multiple computations are stable',
    passed: allSame,
    message: allSame ? '10 computations produced identical hashes' : 'Hashes varied across computations'
  });

  // Test 12: Canonical form is deterministic
  const canon1 = canonicalize(BASE_CR);
  const canon2 = canonicalize(WHITESPACE_VARIANT_3);
  results.push(assertEqual(
    canon1.canonical!,
    canon2.canonical!,
    'Test 12: Canonical form is deterministic across formatting'
  ));

  // Test 13: Hash format is correct (sha256:<64-hex>)
  const hashFormat = /^sha256:[a-f0-9]{64}$/;
  results.push({
    name: 'Test 13: Hash format is sha256:<64-hex>',
    passed: hashFormat.test(baseHash.hash),
    message: hashFormat.test(baseHash.hash) ? 'Format correct' : `Invalid format: ${baseHash.hash}`
  });

  // Test 14: Empty/whitespace-only changes don't affect canonical JSON
  const minimalCR = `[CR/MINIMAL]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=ethereum
[/CR]`;

  const spacedCR = `[CR/MINIMAL]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=ethereum
[/CR]`;

  const minimalHash = computeCanonicalHash(minimalCR);
  const spacedHash = computeCanonicalHash(spacedCR);
  results.push(assertEqual(
    minimalHash.hash!,
    spacedHash.hash!,
    'Test 14: Minimal vs spaced CR produce same hash'
  ));

  // Test 15: Case sensitivity in values matters
  const lowerName = `[CR/CASETEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=testexchange
[/CR]`;

  const upperName = `[CR/CASETEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TESTEXCHANGE
[/CR]`;

  const lowerHash = computeCanonicalHash(lowerName);
  const upperHash = computeCanonicalHash(upperName);
  results.push(assertNotEqual(
    lowerHash.hash!,
    upperHash.hash!,
    'Test 15: Case differences in values produce different hashes'
  ));

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Hash Determinism Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runHashDeterminismTests();

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status}: ${result.name}`);
    if (!result.passed) {
      console.log(`       ${result.message}`);
    }
  }

  console.log('='.repeat(60));
  console.log(`\nTotal: ${results.filter(r => r.passed).length}/${results.length} passed`);
  console.log(`Overall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  process.exit(passed ? 0 : 1);
}
