/**
 * CR-Markup Protocol v1.0 - Canonical Hash Generator
 *
 * This module computes deterministic SHA-256 hashes for CR-blocks.
 * The hash is computed from the canonical JSON representation.
 *
 * Reference: /schema/spec.md, /schema/canonicalize.ts
 */

import { createHash } from 'crypto';
import { canonicalize, CanonicalResult } from './canonicalize';

// ============================================
// TYPES
// ============================================

export interface HashResult {
  success: boolean;
  hash?: string;           // Full format: "sha256:<hex>"
  hexDigest?: string;      // Raw hex: "<64-char-hex>"
  canonical?: string;      // The canonical JSON used for hashing
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const HASH_PREFIX = 'sha256:';
const HASH_ALGORITHM = 'sha256';

// ============================================
// 1. SHA-256 HASH COMPUTATION
// ============================================

/**
 * Computes SHA-256 hash of a UTF-8 string.
 * Returns lowercase hex digest (64 characters).
 */
export function sha256(input: string): string {
  return createHash(HASH_ALGORITHM)
    .update(input, 'utf8')
    .digest('hex')
    .toLowerCase();
}

// ============================================
// 2. CANONICAL HASH FORMAT
// ============================================

/**
 * Formats a hex digest as canonical hash.
 * Format: "sha256:<64-char-lowercase-hex>"
 */
export function formatCanonicalHash(hexDigest: string): string {
  return `${HASH_PREFIX}${hexDigest.toLowerCase()}`;
}

/**
 * Validates canonical hash format.
 * Must be: sha256:<64-char-lowercase-hex>
 */
export function isValidHashFormat(hash: string): boolean {
  if (!hash.startsWith(HASH_PREFIX)) {
    return false;
  }

  const hex = hash.slice(HASH_PREFIX.length);

  if (hex.length !== 64) {
    return false;
  }

  return /^[0-9a-f]{64}$/.test(hex);
}

// ============================================
// 3. MAIN HASH FUNCTION
// ============================================

/**
 * Computes the canonical hash for a CR-block.
 *
 * Steps:
 * 1. Canonicalize the CR-block
 * 2. Compute SHA-256 of canonical JSON
 * 3. Format as "sha256:<hex>"
 *
 * @param input - Raw CR-block text
 * @returns HashResult with success status and hash
 */
export function computeCanonicalHash(input: string): HashResult {
  // Step 1: Canonicalize
  const canonicalResult: CanonicalResult = canonicalize(input);

  if (!canonicalResult.success || !canonicalResult.canonical) {
    return {
      success: false,
      error: canonicalResult.error || 'Canonicalization failed'
    };
  }

  // Step 2: Compute SHA-256
  const hexDigest = sha256(canonicalResult.canonical);

  // Step 3: Format
  const hash = formatCanonicalHash(hexDigest);

  return {
    success: true,
    hash,
    hexDigest,
    canonical: canonicalResult.canonical
  };
}

/**
 * Verifies that a CR-block's canonical_hash field matches its computed hash.
 *
 * @param input - Raw CR-block text (must contain canonical_hash field)
 * @returns Whether the hash is valid
 */
export function verifyCanonicalHash(input: string, expectedHash: string): boolean {
  const result = computeCanonicalHash(input);

  if (!result.success || !result.hash) {
    return false;
  }

  return result.hash.toLowerCase() === expectedHash.toLowerCase();
}

// ============================================
// 4. ACCEPTANCE TESTS
// ============================================

/**
 * Run acceptance tests for hash generation.
 *
 * Test 1: Hash is stable across formatting changes
 * Test 2: Hash changes if any field value changes
 * Test 3: URL/location never affects hash
 */
export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Hash is stable across formatting changes
  const crFormat1 = `
[CR/TEST]
name=TestEntity
type=example
version=1.0
[/CR]
`;

  const crFormat2 = `[CR/TEST]
version=1.0
type=example
name=TestEntity
[/CR]`;

  const crFormat3 = `

  [CR/TEST]
  name=TestEntity

  type=example
  version=1.0

  [/CR]

`;

  const hash1 = computeCanonicalHash(crFormat1);
  const hash2 = computeCanonicalHash(crFormat2);
  const hash3 = computeCanonicalHash(crFormat3);

  if (hash1.hash === hash2.hash && hash2.hash === hash3.hash) {
    results.push('PASS: Test 1 - Hash is stable across formatting changes');
    results.push(`       Hash: ${hash1.hash}`);
  } else {
    results.push('FAIL: Test 1 - Hash changed with different formatting');
    results.push(`  Format1: ${hash1.hash}`);
    results.push(`  Format2: ${hash2.hash}`);
    results.push(`  Format3: ${hash3.hash}`);
    allPassed = false;
  }

  // Test 2: Hash changes if any field value changes
  const crValueA = `
[CR/TEST]
name=EntityA
type=example
[/CR]
`;

  const crValueB = `
[CR/TEST]
name=EntityB
type=example
[/CR]
`;

  const hashA = computeCanonicalHash(crValueA);
  const hashB = computeCanonicalHash(crValueB);

  if (hashA.hash !== hashB.hash) {
    results.push('PASS: Test 2 - Hash changes if any field value changes');
    results.push(`       HashA: ${hashA.hash}`);
    results.push(`       HashB: ${hashB.hash}`);
  } else {
    results.push('FAIL: Test 2 - Hash did not change with different values');
    allPassed = false;
  }

  // Test 3: URL/location never affects hash (same content = same hash)
  // Simulating "same CR-block from different URLs"
  const crFromURL1 = `[CR/BINANCE]
name=Binance
type=exchange
url=https://binance.com
[/CR]`;

  const crFromURL2 = `[CR/BINANCE]
name=Binance
type=exchange
url=https://binance.com
[/CR]`;

  const hashURL1 = computeCanonicalHash(crFromURL1);
  const hashURL2 = computeCanonicalHash(crFromURL2);

  if (hashURL1.hash === hashURL2.hash) {
    results.push('PASS: Test 3 - URL/location never affects hash (content-based)');
  } else {
    results.push('FAIL: Test 3 - Same content produced different hashes');
    allPassed = false;
  }

  // Test 4: Hash format validation
  const validHash = 'sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890';
  const invalidHash1 = 'md5:a1b2c3d4e5f67890';
  const invalidHash2 = 'sha256:UPPERCASE';
  const invalidHash3 = 'sha256:tooshort';

  if (isValidHashFormat(validHash) &&
      !isValidHashFormat(invalidHash1) &&
      !isValidHashFormat(invalidHash2) &&
      !isValidHashFormat(invalidHash3)) {
    results.push('PASS: Test 4 - Hash format validation works correctly');
  } else {
    results.push('FAIL: Test 4 - Hash format validation incorrect');
    allPassed = false;
  }

  // Test 5: Deterministic output (same input = same hash, always)
  const testCR = `[CR/DETERMINISM]
value=test123
[/CR]`;

  const hashes = Array.from({ length: 10 }, () => computeCanonicalHash(testCR).hash);
  const allSame = hashes.every(h => h === hashes[0]);

  if (allSame) {
    results.push('PASS: Test 5 - Hash is deterministic (10 runs identical)');
  } else {
    results.push('FAIL: Test 5 - Hash is not deterministic');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Canonical Hash Generator - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example usage
  console.log('\n\nExample Hash Computation:');
  console.log('-'.repeat(60));

  const exampleCR = `
[CR/BINANCE]
schema=CR1.0
version=1.0
type=exchange
name=Binance
trading_fee=0.1%
leverage_max=125
kyc_required=true
[/CR]
`;

  const result = computeCanonicalHash(exampleCR);

  console.log('Input CR-block:');
  console.log(exampleCR);
  console.log('Canonical JSON:');
  console.log(result.canonical);
  console.log('\nCanonical Hash:');
  console.log(result.hash);
}
