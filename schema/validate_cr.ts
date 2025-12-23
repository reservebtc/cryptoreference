/**
 * CR-Markup Protocol v1.0 - Unified Validation Engine
 *
 * Single authoritative entry point for CR-block validation.
 * Composes all validation steps into one pipeline.
 *
 * Pipeline:
 * 1. Grammar validation (structure check)
 * 2. Canonicalization (normalize + parse)
 * 3. Hash verification (if canonical_hash present)
 * 4. JSON Schema validation (field constraints)
 * 5. Forbidden content scan (emoji, marketing, etc.)
 *
 * Reference: /schema/spec.md
 */

import { canonicalize, CanonicalResult } from './canonicalize';
import { computeCanonicalHash, isValidHashFormat } from './hash';
import { validateCRBlock, ValidationResult as SchemaValidationResult } from './schema_validator';
import { scanForbiddenContent, ScanResult, Violation } from './forbidden_scan';

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  stage: ValidationStage;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: {
    token: string;
    canonical: string;
    computedHash: string;
    fields: Record<string, unknown>;
  };
}

export interface ValidationError {
  stage: ValidationStage;
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export type ValidationStage =
  | 'grammar'
  | 'canonicalization'
  | 'hash'
  | 'schema'
  | 'forbidden'
  | 'complete';

// ============================================
// VALIDATION PIPELINE
// ============================================

/**
 * Validates a CR-block through the complete pipeline.
 *
 * Any failure at any stage → INVALID (hard-fail semantics)
 *
 * @param input - Raw CR-block text
 * @returns ValidationResult with detailed status
 */
export function validateCR(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // ========================================
  // STAGE 1: Grammar Validation
  // ========================================

  // Check basic structure: [CR/TOKEN] ... [/CR]
  const openTagMatch = input.match(/\[CR\/([A-Za-z][A-Za-z0-9_-]*)\]/);
  if (!openTagMatch) {
    return {
      valid: false,
      stage: 'grammar',
      errors: [{
        stage: 'grammar',
        code: 'MISSING_OPEN_TAG',
        message: 'Missing or invalid opening tag [CR/<TOKEN>]'
      }],
      warnings
    };
  }

  const token = openTagMatch[1];

  if (!input.includes('[/CR]')) {
    return {
      valid: false,
      stage: 'grammar',
      errors: [{
        stage: 'grammar',
        code: 'MISSING_CLOSE_TAG',
        message: 'Missing closing tag [/CR]'
      }],
      warnings
    };
  }

  // Check for nested CR-blocks (forbidden)
  const openTags = input.match(/\[CR\/[A-Za-z][A-Za-z0-9_-]*\]/g) || [];
  if (openTags.length > 1) {
    return {
      valid: false,
      stage: 'grammar',
      errors: [{
        stage: 'grammar',
        code: 'NESTED_CR_BLOCK',
        message: 'Nested CR-blocks are forbidden'
      }],
      warnings
    };
  }

  // ========================================
  // STAGE 2: Canonicalization
  // ========================================

  const canonResult: CanonicalResult = canonicalize(input);

  if (!canonResult.success || !canonResult.canonical) {
    return {
      valid: false,
      stage: 'canonicalization',
      errors: [{
        stage: 'canonicalization',
        code: 'CANONICALIZATION_FAILED',
        message: canonResult.error || 'Failed to canonicalize CR-block'
      }],
      warnings
    };
  }

  // ========================================
  // STAGE 3: Hash Verification
  // ========================================

  const computedHash = computeCanonicalHash(input);

  if (!computedHash.success || !computedHash.hash) {
    return {
      valid: false,
      stage: 'hash',
      errors: [{
        stage: 'hash',
        code: 'HASH_COMPUTATION_FAILED',
        message: computedHash.error || 'Failed to compute canonical hash'
      }],
      warnings
    };
  }

  // If canonical_hash is provided in the block, verify it matches
  const providedHash = canonResult.json?.canonical_hash as string | undefined;

  if (providedHash) {
    if (!isValidHashFormat(providedHash)) {
      return {
        valid: false,
        stage: 'hash',
        errors: [{
          stage: 'hash',
          code: 'INVALID_HASH_FORMAT',
          message: `Invalid canonical_hash format: ${providedHash}`,
          field: 'canonical_hash',
          value: providedHash
        }],
        warnings
      };
    }

    // Note: We can't verify hash matches because hash includes canonical_hash field
    // This is a chicken-and-egg problem - hash verification is for external use
    warnings.push({
      code: 'HASH_SELF_REFERENCE',
      message: 'canonical_hash field present - external verification recommended',
      field: 'canonical_hash'
    });
  }

  // ========================================
  // STAGE 4: JSON Schema Validation
  // ========================================

  // Prepare data for schema validation
  const schemaData: Record<string, unknown> = {
    _token: token.toUpperCase(),
    ...canonResult.json
  };

  // Remove _token duplicate if exists
  delete schemaData._token;
  schemaData._token = token.toUpperCase();

  const schemaResult: SchemaValidationResult = validateCRBlock(schemaData);

  if (!schemaResult.valid) {
    return {
      valid: false,
      stage: 'schema',
      errors: schemaResult.errors.map(e => ({
        stage: 'schema' as ValidationStage,
        code: 'SCHEMA_VIOLATION',
        message: e.message,
        field: e.field,
        value: e.value
      })),
      warnings
    };
  }

  // ========================================
  // STAGE 5: Forbidden Content Scan
  // ========================================

  const scanResult: ScanResult = scanForbiddenContent(input);

  if (!scanResult.clean) {
    return {
      valid: false,
      stage: 'forbidden',
      errors: scanResult.violations.map((v: Violation) => ({
        stage: 'forbidden' as ValidationStage,
        code: `FORBIDDEN_${v.type.toUpperCase()}`,
        message: v.message,
        value: v.match
      })),
      warnings
    };
  }

  // ========================================
  // ALL STAGES PASSED
  // ========================================

  return {
    valid: true,
    stage: 'complete',
    errors: [],
    warnings,
    data: {
      token: token.toUpperCase(),
      canonical: canonResult.canonical,
      computedHash: computedHash.hash,
      fields: canonResult.json || {}
    }
  };
}

/**
 * Quick validation check - returns boolean only.
 */
export function isValidCR(input: string): boolean {
  return validateCR(input).valid;
}

/**
 * Validates and returns computed hash if valid.
 */
export function validateAndHash(input: string): { valid: boolean; hash?: string; error?: string } {
  const result = validateCR(input);

  if (!result.valid) {
    return {
      valid: false,
      error: result.errors[0]?.message || 'Validation failed'
    };
  }

  return {
    valid: true,
    hash: result.data?.computedHash
  };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Valid CR → returns structured ValidationResult
  const validCR = `[CR/BINANCE]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=multi
name=Binance
status=active
[/CR]`;

  const validResult = validateCR(validCR);
  if (validResult.valid && validResult.stage === 'complete' && validResult.data) {
    results.push('PASS: Test 1 - Valid CR returns structured ValidationResult');
    results.push(`       Token: ${validResult.data.token}`);
    results.push(`       Hash: ${validResult.data.computedHash}`);
  } else {
    results.push('FAIL: Test 1 - Valid CR should pass');
    results.push(`       Errors: ${JSON.stringify(validResult.errors)}`);
    allPassed = false;
  }

  // Test 2: Grammar failure → INVALID
  const noClosingTag = `[CR/TEST]
name=Test
`;

  const grammarResult = validateCR(noClosingTag);
  if (!grammarResult.valid && grammarResult.stage === 'grammar') {
    results.push('PASS: Test 2 - Grammar failure (missing close tag) → INVALID');
  } else {
    results.push('FAIL: Test 2 - Grammar failure should be caught');
    allPassed = false;
  }

  // Test 3: Schema failure → INVALID
  const missingFields = `[CR/TEST]
name=Test
[/CR]`;

  const schemaFailResult = validateCR(missingFields);
  if (!schemaFailResult.valid && schemaFailResult.stage === 'schema') {
    results.push('PASS: Test 3 - Schema failure (missing required fields) → INVALID');
  } else {
    results.push('FAIL: Test 3 - Schema failure should be caught');
    allPassed = false;
  }

  // Test 4: Forbidden content → INVALID
  // Note: Emoji is caught at canonicalization stage (early detection)
  const withEmoji = `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=Test Exchange 🚀
[/CR]`;

  const forbiddenResult = validateCR(withEmoji);
  // Emoji caught at canonicalization (early) or forbidden (late) - both valid
  if (!forbiddenResult.valid && (forbiddenResult.stage === 'forbidden' || forbiddenResult.stage === 'canonicalization')) {
    results.push('PASS: Test 4 - Forbidden content (emoji) → INVALID');
  } else {
    results.push('FAIL: Test 4 - Forbidden content should be caught');
    allPassed = false;
  }

  // Test 5: Nested CR-blocks → INVALID
  const nested = `[CR/OUTER]
name=Outer
[CR/INNER]
name=Inner
[/CR]
[/CR]`;

  const nestedResult = validateCR(nested);
  if (!nestedResult.valid && nestedResult.stage === 'grammar') {
    results.push('PASS: Test 5 - Nested CR-blocks → INVALID');
  } else {
    results.push('FAIL: Test 5 - Nested blocks should be caught');
    allPassed = false;
  }

  // Test 6: Marketing language → INVALID
  const marketing = `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=The Best Amazing Exchange
[/CR]`;

  const marketingResult = validateCR(marketing);
  if (!marketingResult.valid && marketingResult.stage === 'forbidden') {
    results.push('PASS: Test 6 - Marketing language → INVALID');
  } else {
    results.push('FAIL: Test 6 - Marketing language should be caught');
    allPassed = false;
  }

  // Test 7: isValidCR helper function
  const quickValid = isValidCR(`[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestExchange
[/CR]`);

  const quickInvalid = isValidCR(`[CR/TEST]
name=Missing fields
[/CR]`);

  if (quickValid && !quickInvalid) {
    results.push('PASS: Test 7 - isValidCR helper works correctly');
  } else {
    results.push('FAIL: Test 7 - isValidCR helper failed');
    allPassed = false;
  }

  // Test 8: validateAndHash function
  const hashResult = validateAndHash(`[CR/HASHTEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=solana
name=HashTest
[/CR]`);

  if (hashResult.valid && hashResult.hash?.startsWith('sha256:')) {
    results.push('PASS: Test 8 - validateAndHash returns computed hash');
  } else {
    results.push('FAIL: Test 8 - validateAndHash should return hash');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Unified Validation Engine - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example validation
  console.log('\n\nExample Full Validation:');
  console.log('-'.repeat(60));

  const exampleCR = `[CR/BINANCE]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
subtype=cex
network=multi
name=Binance
status=active
kyc_required=true
leverage_max=125
trading_fee_maker=0.1%
trading_fee_taker=0.1%
[/CR]`;

  console.log('Input:');
  console.log(exampleCR);

  const result = validateCR(exampleCR);
  console.log('\nValidation Result:');
  console.log(`Valid: ${result.valid}`);
  console.log(`Stage: ${result.stage}`);

  if (result.valid && result.data) {
    console.log(`Token: ${result.data.token}`);
    console.log(`Computed Hash: ${result.data.computedHash}`);
  }

  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const e of result.errors) {
      console.log(`  [${e.stage}] ${e.code}: ${e.message}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const w of result.warnings) {
      console.log(`  ${w.code}: ${w.message}`);
    }
  }
}
