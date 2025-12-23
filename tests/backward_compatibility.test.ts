/**
 * CR-Markup Protocol v1.0 - Backward Compatibility Tests
 *
 * Verifies that older CR-blocks (v1.x) still validate correctly.
 * Ensures protocol evolution doesn't break existing data.
 *
 * Reference: /schema/spec.md
 */

import { validateCR, isValidCR } from '../schema/validate_cr';
import { validateInMode } from '../schema/validation_modes';

// ============================================
// TEST UTILITIES
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

// ============================================
// V1.0 TEST DATA - Baseline CR-blocks
// ============================================

// Minimal valid v1.0 CR-block (only required fields)
const V1_MINIMAL = `[CR/MINIMALV1]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]`;

// Full v1.0 CR-block with all common fields
const V1_FULL = `[CR/FULLV1]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
subtype=cex
network=multi
name=FullExchange
status=active
url=https://example.com
founded=2020
kyc_required=true
leverage_max=100
trading_fee_maker=0.1%
trading_fee_taker=0.2%
[/CR]`;

// v1.0 token type
const V1_TOKEN = `[CR/TOKENTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=solana
name=TestToken
status=active
[/CR]`;

// v1.0 protocol type
const V1_PROTOCOL = `[CR/PROTOCOLTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=protocol
network=ethereum
name=TestProtocol
status=active
[/CR]`;

// v1.0 DEX type
const V1_DEX = `[CR/DEXTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=dex
subtype=perp-dex
network=arbitrum
name=TestDEX
status=active
[/CR]`;

// v1.0 with array network (multi-chain)
const V1_MULTICHAIN = `[CR/MULTICHAIN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=["ethereum","arbitrum","optimism"]
name=MultiChainExchange
status=active
[/CR]`;

// v1.0 with tags array
const V1_TAGS = `[CR/TAGGEDTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TaggedExchange
tags=["defi","perps","spot"]
status=active
[/CR]`;

// v1.0 deprecated entity
const V1_DEPRECATED = `[CR/DEPRECATEDV1]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=OldExchange
status=deprecated
replaced_by=NEWEXCHANGE
[/CR]`;

// v1.0 with parent_id (hierarchy)
const V1_CHILD = `[CR/CHILDENTITY]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=ethereum
name=ChildToken
parent_id=PARENTPROTOCOL
status=active
[/CR]`;

// v1.0 with supersedes (version chain)
const V1_SUPERSEDES = `[CR/NEWVERSION]
schema=CR1.0
version=2.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=UpdatedExchange
supersedes=OLDVERSION
supersedes_hash=sha256:0000000000000000000000000000000000000000000000000000000000000000
status=active
[/CR]`;

// v1.0 beta status
const V1_BETA = `[CR/BETATEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=protocol
network=ethereum
name=BetaProtocol
status=beta
[/CR]`;

// v1.0 inactive status
const V1_INACTIVE = `[CR/INACTIVETEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=InactiveExchange
status=inactive
[/CR]`;

// v1.0 with extension fields (x_ prefix)
const V1_EXTENSION = `[CR/EXTENSIONTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=ExtendedExchange
x_custom_field=customvalue
x_another_field=123
status=active
[/CR]`;

// ============================================
// BACKWARD COMPATIBILITY TESTS
// ============================================

export function runBackwardCompatibilityTests(): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // Test 1: Minimal v1.0 CR validates
  const test1 = validateCR(V1_MINIMAL);
  results.push({
    name: 'Test 1: Minimal v1.0 CR validates',
    passed: test1.valid,
    message: test1.valid ? 'Valid' : `Errors: ${JSON.stringify(test1.errors)}`
  });

  // Test 2: Full v1.0 CR validates
  const test2 = validateCR(V1_FULL);
  results.push({
    name: 'Test 2: Full v1.0 CR with all common fields validates',
    passed: test2.valid,
    message: test2.valid ? 'Valid' : `Errors: ${JSON.stringify(test2.errors)}`
  });

  // Test 3: v1.0 token type validates
  const test3 = validateCR(V1_TOKEN);
  results.push({
    name: 'Test 3: v1.0 token type validates',
    passed: test3.valid,
    message: test3.valid ? 'Valid' : `Errors: ${JSON.stringify(test3.errors)}`
  });

  // Test 4: v1.0 protocol type validates
  const test4 = validateCR(V1_PROTOCOL);
  results.push({
    name: 'Test 4: v1.0 protocol type validates',
    passed: test4.valid,
    message: test4.valid ? 'Valid' : `Errors: ${JSON.stringify(test4.errors)}`
  });

  // Test 5: v1.0 DEX type validates
  const test5 = validateCR(V1_DEX);
  results.push({
    name: 'Test 5: v1.0 DEX type validates',
    passed: test5.valid,
    message: test5.valid ? 'Valid' : `Errors: ${JSON.stringify(test5.errors)}`
  });

  // Test 6: v1.0 multi-chain array validates
  const test6 = validateCR(V1_MULTICHAIN);
  results.push({
    name: 'Test 6: v1.0 multi-chain network array validates',
    passed: test6.valid,
    message: test6.valid ? 'Valid' : `Errors: ${JSON.stringify(test6.errors)}`
  });

  // Test 7: v1.0 tags array validates
  const test7 = validateCR(V1_TAGS);
  results.push({
    name: 'Test 7: v1.0 tags array validates',
    passed: test7.valid,
    message: test7.valid ? 'Valid' : `Errors: ${JSON.stringify(test7.errors)}`
  });

  // Test 8: v1.0 deprecated entity validates
  const test8 = validateCR(V1_DEPRECATED);
  results.push({
    name: 'Test 8: v1.0 deprecated entity validates',
    passed: test8.valid,
    message: test8.valid ? 'Valid' : `Errors: ${JSON.stringify(test8.errors)}`
  });

  // Test 9: v1.0 child entity with parent_id validates
  const test9 = validateCR(V1_CHILD);
  results.push({
    name: 'Test 9: v1.0 child entity with parent_id validates',
    passed: test9.valid,
    message: test9.valid ? 'Valid' : `Errors: ${JSON.stringify(test9.errors)}`
  });

  // Test 10: v1.0 supersedes chain validates
  const test10 = validateCR(V1_SUPERSEDES);
  results.push({
    name: 'Test 10: v1.0 supersedes version chain validates',
    passed: test10.valid,
    message: test10.valid ? 'Valid' : `Errors: ${JSON.stringify(test10.errors)}`
  });

  // Test 11: v1.0 beta status validates
  const test11 = validateCR(V1_BETA);
  results.push({
    name: 'Test 11: v1.0 beta status validates',
    passed: test11.valid,
    message: test11.valid ? 'Valid' : `Errors: ${JSON.stringify(test11.errors)}`
  });

  // Test 12: v1.0 inactive status validates
  const test12 = validateCR(V1_INACTIVE);
  results.push({
    name: 'Test 12: v1.0 inactive status validates',
    passed: test12.valid,
    message: test12.valid ? 'Valid' : `Errors: ${JSON.stringify(test12.errors)}`
  });

  // Test 13: v1.0 with extension fields validates
  const test13 = validateCR(V1_EXTENSION);
  results.push({
    name: 'Test 13: v1.0 with x_ extension fields validates',
    passed: test13.valid,
    message: test13.valid ? 'Valid' : `Errors: ${JSON.stringify(test13.errors)}`
  });

  // Test 14: All v1.0 CRs pass production mode
  const productionTests = [
    V1_MINIMAL, V1_FULL, V1_TOKEN, V1_PROTOCOL, V1_DEX,
    V1_MULTICHAIN, V1_TAGS, V1_DEPRECATED, V1_CHILD,
    V1_SUPERSEDES, V1_BETA, V1_INACTIVE, V1_EXTENSION
  ];

  const allPassProduction = productionTests.every(cr => {
    const result = validateInMode(cr, 'production');
    return result.accepted;
  });

  results.push({
    name: 'Test 14: All v1.0 CRs pass production mode',
    passed: allPassProduction,
    message: allPassProduction ? 'All passed' : 'Some CRs failed production mode'
  });

  // Test 15: isValidCR quick check works for v1.0
  const allQuickValid = productionTests.every(cr => isValidCR(cr));
  results.push({
    name: 'Test 15: isValidCR() returns true for all v1.0 CRs',
    passed: allQuickValid,
    message: allQuickValid ? 'All passed' : 'Some CRs failed quick validation'
  });

  // Test 16: Version field accepts string format
  const versionString = `[CR/VERSIONSTR]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=ethereum
[/CR]`;

  const test16 = validateCR(versionString);
  results.push({
    name: 'Test 16: Version field accepts string "1.0"',
    passed: test16.valid,
    message: test16.valid ? 'Valid' : `Errors: ${JSON.stringify(test16.errors)}`
  });

  // Test 17: Token is correctly extracted and uppercased
  const test17 = validateCR(V1_MINIMAL);
  const tokenCorrect = test17.valid && test17.data?.token === 'MINIMALV1';
  results.push({
    name: 'Test 17: Token is correctly extracted and uppercased',
    passed: tokenCorrect,
    message: tokenCorrect ? `Token: ${test17.data?.token}` : 'Token extraction failed'
  });

  // Test 18: Canonical hash is computed for v1.0 CRs
  const test18 = validateCR(V1_MINIMAL);
  const hashComputed = test18.valid && test18.data?.computedHash?.startsWith('sha256:');
  results.push({
    name: 'Test 18: Canonical hash is computed for v1.0 CRs',
    passed: hashComputed,
    message: hashComputed ? `Hash: ${test18.data?.computedHash}` : 'Hash computation failed'
  });

  // Test 19: Fields are preserved in validation result
  const test19 = validateCR(V1_FULL);
  const fieldsPreserved = test19.valid &&
    test19.data?.fields?.type === 'exchange' &&
    test19.data?.fields?.subtype === 'cex' &&
    test19.data?.fields?.name === 'FullExchange';
  results.push({
    name: 'Test 19: Fields are preserved in validation result',
    passed: fieldsPreserved,
    message: fieldsPreserved ? 'Fields preserved' : 'Fields not preserved correctly'
  });

  // Test 20: Draft mode shows warnings but validates v1.0
  const test20 = validateInMode(V1_MINIMAL, 'draft');
  results.push({
    name: 'Test 20: Draft mode accepts v1.0 CRs',
    passed: test20.accepted,
    message: test20.accepted ? 'Accepted in draft mode' : 'Rejected in draft mode'
  });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Backward Compatibility Tests (v1.x)\n');
  console.log('='.repeat(60));

  const { passed, results } = runBackwardCompatibilityTests();

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
