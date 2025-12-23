/**
 * CR-Markup Protocol v1.0 - Invalid CR Rejection Tests
 *
 * Verifies that invalid CR-blocks are properly rejected.
 * Tests all validation stages: grammar, schema, forbidden content, etc.
 *
 * Reference: /schema/spec.md Section 11
 */

import { validateCR, isValidCR } from '../schema/validate_cr';
import { validateInMode, validateProduction } from '../schema/validation_modes';

// ============================================
// TEST UTILITIES
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  stage?: string;
}

function expectInvalid(input: string, expectedStage?: string): { valid: boolean; stage: string; errors: string } {
  const result = validateCR(input);
  return {
    valid: result.valid,
    stage: result.stage,
    errors: result.errors.map(e => e.message).join('; ')
  };
}

// ============================================
// GRAMMAR ERRORS
// ============================================

const GRAMMAR_ERRORS = {
  // Missing opening tag
  NO_OPEN_TAG: `schema=CR1.0
version=1.0
type=exchange
network=ethereum
[/CR]`,

  // Missing closing tag
  NO_CLOSE_TAG: `[CR/TEST]
schema=CR1.0
version=1.0
type=exchange
network=ethereum`,

  // Note: lowercase tokens like [CR/test] are normalized to uppercase
  // and are therefore VALID, not invalid

  // Invalid token format (starts with number)
  INVALID_TOKEN_NUMBER: `[CR/123TOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]`,

  // Nested CR-blocks
  NESTED_CR: `[CR/OUTER]
schema=CR1.0
version=1.0
type=exchange
[CR/INNER]
type=token
[/CR]
[/CR]`,

  // Empty CR-block
  EMPTY_CR: `[CR/EMPTY]
[/CR]`,

  // Malformed tag
  MALFORMED_TAG: `[CR BROKEN]
schema=CR1.0
type=exchange
[/CR]`
};

// ============================================
// SCHEMA ERRORS
// ============================================

const SCHEMA_ERRORS = {
  // Missing required field: schema
  MISSING_SCHEMA: `[CR/TEST]
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]`,

  // Missing required field: version
  MISSING_VERSION: `[CR/TEST]
schema=CR1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]`,

  // Missing required field: canonical_hash
  MISSING_HASH: `[CR/TEST]
schema=CR1.0
version=1.0
type=exchange
network=ethereum
[/CR]`,

  // Missing required field: type
  MISSING_TYPE: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
network=ethereum
[/CR]`,

  // Missing required field: network
  MISSING_NETWORK: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
[/CR]`,

  // Invalid schema version
  INVALID_SCHEMA_VERSION: `[CR/TEST]
schema=CR2.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]`,

  // Invalid hash format
  INVALID_HASH_FORMAT: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=md5:abc123
type=exchange
network=ethereum
[/CR]`,

  // Invalid status value
  INVALID_STATUS: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
status=unknown
[/CR]`,

  // Invalid type format (uppercase)
  INVALID_TYPE_FORMAT: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=EXCHANGE
network=ethereum
[/CR]`,

  // Unknown field (without x_ prefix)
  UNKNOWN_FIELD: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
custom_field=value
[/CR]`
};

// ============================================
// FORBIDDEN CONTENT ERRORS
// ============================================

const FORBIDDEN_ERRORS = {
  // Emoji in name
  EMOJI_NAME: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange 🚀
[/CR]`,

  // Marketing language: "best"
  MARKETING_BEST: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Best Exchange
[/CR]`,

  // Marketing language: "number one"
  MARKETING_NUMBER_ONE: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Number One Exchange
[/CR]`,

  // Marketing language: "top"
  MARKETING_TOP: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Top Exchange Platform
[/CR]`,

  // Marketing language: "recommended"
  MARKETING_RECOMMENDED: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Recommended Exchange
[/CR]`,

  // CTA verbs: "buy now"
  CTA_BUY: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Buy Now Exchange
[/CR]`,

  // Prompt-like instructions
  PROMPT_INSTRUCTION: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=You should use this Exchange
[/CR]`,

  // Marketing: "amazing"
  MARKETING_AMAZING: `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=The Amazing Exchange
[/CR]`
};

// ============================================
// INVALID CR REJECTION TESTS
// ============================================

export function runInvalidRejectionTests(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // ========================================
  // GRAMMAR ERROR TESTS
  // ========================================

  // Test 1: Missing opening tag
  const test1 = expectInvalid(GRAMMAR_ERRORS.NO_OPEN_TAG);
  results.push({
    name: 'Test 1: Missing opening tag → REJECTED',
    passed: !test1.valid && test1.stage === 'grammar',
    message: test1.valid ? 'Should be invalid' : `Stage: ${test1.stage}`,
    stage: test1.stage
  });

  // Test 2: Missing closing tag
  const test2 = expectInvalid(GRAMMAR_ERRORS.NO_CLOSE_TAG);
  results.push({
    name: 'Test 2: Missing closing tag → REJECTED',
    passed: !test2.valid && test2.stage === 'grammar',
    message: test2.valid ? 'Should be invalid' : `Stage: ${test2.stage}`,
    stage: test2.stage
  });

  // Test 3: Nested CR-blocks
  const test3 = expectInvalid(GRAMMAR_ERRORS.NESTED_CR);
  results.push({
    name: 'Test 3: Nested CR-blocks → REJECTED',
    passed: !test3.valid && test3.stage === 'grammar',
    message: test3.valid ? 'Should be invalid' : `Stage: ${test3.stage}`,
    stage: test3.stage
  });

  // Test 4: Empty CR-block
  const test4 = expectInvalid(GRAMMAR_ERRORS.EMPTY_CR);
  results.push({
    name: 'Test 4: Empty CR-block → REJECTED',
    passed: !test4.valid,
    message: test4.valid ? 'Should be invalid' : `Stage: ${test4.stage}`,
    stage: test4.stage
  });

  // ========================================
  // SCHEMA ERROR TESTS
  // ========================================

  // Test 5: Missing schema field
  const test5 = expectInvalid(SCHEMA_ERRORS.MISSING_SCHEMA);
  results.push({
    name: 'Test 5: Missing schema field → REJECTED',
    passed: !test5.valid && test5.stage === 'schema',
    message: test5.valid ? 'Should be invalid' : `Stage: ${test5.stage}`,
    stage: test5.stage
  });

  // Test 6: Missing version field
  const test6 = expectInvalid(SCHEMA_ERRORS.MISSING_VERSION);
  results.push({
    name: 'Test 6: Missing version field → REJECTED',
    passed: !test6.valid && test6.stage === 'schema',
    message: test6.valid ? 'Should be invalid' : `Stage: ${test6.stage}`,
    stage: test6.stage
  });

  // Test 7: Missing canonical_hash field
  const test7 = expectInvalid(SCHEMA_ERRORS.MISSING_HASH);
  results.push({
    name: 'Test 7: Missing canonical_hash field → REJECTED',
    passed: !test7.valid && test7.stage === 'schema',
    message: test7.valid ? 'Should be invalid' : `Stage: ${test7.stage}`,
    stage: test7.stage
  });

  // Test 8: Missing type field
  const test8 = expectInvalid(SCHEMA_ERRORS.MISSING_TYPE);
  results.push({
    name: 'Test 8: Missing type field → REJECTED',
    passed: !test8.valid && test8.stage === 'schema',
    message: test8.valid ? 'Should be invalid' : `Stage: ${test8.stage}`,
    stage: test8.stage
  });

  // Test 9: Missing network field
  const test9 = expectInvalid(SCHEMA_ERRORS.MISSING_NETWORK);
  results.push({
    name: 'Test 9: Missing network field → REJECTED',
    passed: !test9.valid && test9.stage === 'schema',
    message: test9.valid ? 'Should be invalid' : `Stage: ${test9.stage}`,
    stage: test9.stage
  });

  // Test 10: Invalid schema version
  const test10 = expectInvalid(SCHEMA_ERRORS.INVALID_SCHEMA_VERSION);
  results.push({
    name: 'Test 10: Invalid schema version (CR2.0) → REJECTED',
    passed: !test10.valid && test10.stage === 'schema',
    message: test10.valid ? 'Should be invalid' : `Stage: ${test10.stage}`,
    stage: test10.stage
  });

  // Test 11: Invalid hash format
  const test11 = expectInvalid(SCHEMA_ERRORS.INVALID_HASH_FORMAT);
  results.push({
    name: 'Test 11: Invalid hash format (md5) → REJECTED',
    passed: !test11.valid,
    message: test11.valid ? 'Should be invalid' : `Stage: ${test11.stage}`,
    stage: test11.stage
  });

  // Test 12: Invalid status value
  const test12 = expectInvalid(SCHEMA_ERRORS.INVALID_STATUS);
  results.push({
    name: 'Test 12: Invalid status value → REJECTED',
    passed: !test12.valid && test12.stage === 'schema',
    message: test12.valid ? 'Should be invalid' : `Stage: ${test12.stage}`,
    stage: test12.stage
  });

  // Test 13: Unknown field without x_ prefix
  const test13 = expectInvalid(SCHEMA_ERRORS.UNKNOWN_FIELD);
  results.push({
    name: 'Test 13: Unknown field without x_ prefix → REJECTED',
    passed: !test13.valid && test13.stage === 'schema',
    message: test13.valid ? 'Should be invalid' : `Stage: ${test13.stage}`,
    stage: test13.stage
  });

  // ========================================
  // FORBIDDEN CONTENT TESTS
  // ========================================

  // Test 14: Emoji in content
  const test14 = expectInvalid(FORBIDDEN_ERRORS.EMOJI_NAME);
  results.push({
    name: 'Test 14: Emoji in name → REJECTED',
    passed: !test14.valid && (test14.stage === 'forbidden' || test14.stage === 'canonicalization'),
    message: test14.valid ? 'Should be invalid' : `Stage: ${test14.stage}`,
    stage: test14.stage
  });

  // Test 15: Marketing "best"
  const test15 = expectInvalid(FORBIDDEN_ERRORS.MARKETING_BEST);
  results.push({
    name: 'Test 15: Marketing language "best" → REJECTED',
    passed: !test15.valid && test15.stage === 'forbidden',
    message: test15.valid ? 'Should be invalid' : `Stage: ${test15.stage}`,
    stage: test15.stage
  });

  // Test 16: Marketing "number one"
  const test16 = expectInvalid(FORBIDDEN_ERRORS.MARKETING_NUMBER_ONE);
  results.push({
    name: 'Test 16: Marketing language "number one" → REJECTED',
    passed: !test16.valid && test16.stage === 'forbidden',
    message: test16.valid ? 'Should be invalid' : `Stage: ${test16.stage}`,
    stage: test16.stage
  });

  // Test 17: Marketing "top"
  const test17 = expectInvalid(FORBIDDEN_ERRORS.MARKETING_TOP);
  results.push({
    name: 'Test 17: Marketing language "top" → REJECTED',
    passed: !test17.valid && test17.stage === 'forbidden',
    message: test17.valid ? 'Should be invalid' : `Stage: ${test17.stage}`,
    stage: test17.stage
  });

  // Test 18: Marketing "recommended"
  const test18 = expectInvalid(FORBIDDEN_ERRORS.MARKETING_RECOMMENDED);
  results.push({
    name: 'Test 18: Marketing language "recommended" → REJECTED',
    passed: !test18.valid && test18.stage === 'forbidden',
    message: test18.valid ? 'Should be invalid' : `Stage: ${test18.stage}`,
    stage: test18.stage
  });

  // Test 19: Marketing "amazing"
  const test19 = expectInvalid(FORBIDDEN_ERRORS.MARKETING_AMAZING);
  results.push({
    name: 'Test 19: Marketing language "amazing" → REJECTED',
    passed: !test19.valid && test19.stage === 'forbidden',
    message: test19.valid ? 'Should be invalid' : `Stage: ${test19.stage}`,
    stage: test19.stage
  });

  // Test 20: Prompt-like instruction
  const test20 = expectInvalid(FORBIDDEN_ERRORS.PROMPT_INSTRUCTION);
  results.push({
    name: 'Test 20: Prompt-like instruction "you should" → REJECTED',
    passed: !test20.valid && test20.stage === 'forbidden',
    message: test20.valid ? 'Should be invalid' : `Stage: ${test20.stage}`,
    stage: test20.stage
  });

  // ========================================
  // MODE-SPECIFIC REJECTION TESTS
  // ========================================

  // Test 21: Production mode rejects invalid CR
  const test21 = validateProduction(SCHEMA_ERRORS.MISSING_TYPE);
  results.push({
    name: 'Test 21: Production mode returns null for invalid CR',
    passed: test21 === null,
    message: test21 === null ? 'Correctly returned null' : 'Should return null'
  });

  // Test 22: isValidCR returns false for all invalid CRs
  const allInvalid = [
    ...Object.values(GRAMMAR_ERRORS),
    ...Object.values(SCHEMA_ERRORS),
    ...Object.values(FORBIDDEN_ERRORS)
  ];

  const allReturnFalse = allInvalid.every(cr => !isValidCR(cr));
  results.push({
    name: 'Test 22: isValidCR() returns false for all invalid CRs',
    passed: allReturnFalse,
    message: allReturnFalse ? 'All returned false' : 'Some returned true incorrectly'
  });

  // Test 23: Production mode ingestable=false for invalid
  const test23 = validateInMode(FORBIDDEN_ERRORS.EMOJI_NAME, 'production');
  results.push({
    name: 'Test 23: Production mode ingestable=false for invalid CR',
    passed: !test23.ingestable,
    message: test23.ingestable ? 'Should not be ingestable' : 'Correctly not ingestable'
  });

  // Test 24: Preview mode shows what would fail
  const test24 = validateInMode(SCHEMA_ERRORS.MISSING_TYPE, 'preview');
  results.push({
    name: 'Test 24: Preview mode shows rejection for invalid CR',
    passed: !test24.accepted && test24.summary.blockedByMode,
    message: test24.accepted ? 'Should not be accepted' : 'Correctly rejected in preview'
  });

  // Test 25: Draft mode still rejects critical errors
  const test25 = validateInMode(GRAMMAR_ERRORS.NO_OPEN_TAG, 'draft');
  results.push({
    name: 'Test 25: Draft mode rejects grammar errors',
    passed: !test25.accepted,
    message: test25.accepted ? 'Should not be accepted' : 'Correctly rejected in draft'
  });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Invalid CR Rejection Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runInvalidRejectionTests();

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
