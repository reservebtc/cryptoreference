/**
 * CR-Markup Protocol v1.0 - Hard-Fail Semantics Enforcement
 *
 * Implements binary existence model for CR-blocks:
 * - VALID → fully ingestable
 * - INVALID → zero ingestion (non-existent)
 *
 * Validation Modes:
 * - draft: Collects all errors/warnings, allows experimentation
 * - preview: Validates fully, shows what would fail in production
 * - production: Hard-fail on any error, no partial acceptance
 *
 * Reference: /schema/spec.md
 */

import { validateCR, ValidationResult, ValidationError } from './validate_cr';

// ============================================
// TYPES
// ============================================

export type ValidationMode = 'draft' | 'preview' | 'production';

export interface ModeValidationResult {
  mode: ValidationMode;
  accepted: boolean;
  ingestable: boolean;
  result: ValidationResult;
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  criticalErrors: number;
  blockedByMode: boolean;
  message: string;
}

export interface ModeConfig {
  mode: ValidationMode;
  allowWarnings: boolean;
  allowNonCriticalErrors: boolean;
  hardFailOnAnyError: boolean;
  collectAllIssues: boolean;
}

// ============================================
// MODE CONFIGURATIONS
// ============================================

const MODE_CONFIGS: Record<ValidationMode, ModeConfig> = {
  /**
   * DRAFT MODE
   * - For development and experimentation
   * - Collects all errors and warnings
   * - Does not block on warnings
   * - Allows inspection of all issues
   */
  draft: {
    mode: 'draft',
    allowWarnings: true,
    allowNonCriticalErrors: false,
    hardFailOnAnyError: false,
    collectAllIssues: true
  },

  /**
   * PREVIEW MODE
   * - For pre-production validation
   * - Shows exactly what would fail in production
   * - Does not ingest, only validates
   * - Full error reporting
   */
  preview: {
    mode: 'preview',
    allowWarnings: true,
    allowNonCriticalErrors: false,
    hardFailOnAnyError: true,
    collectAllIssues: true
  },

  /**
   * PRODUCTION MODE
   * - Hard-fail semantics
   * - Any error → INVALID → zero ingestion
   * - No partial acceptance
   * - Binary: fully valid or non-existent
   */
  production: {
    mode: 'production',
    allowWarnings: true,
    allowNonCriticalErrors: false,
    hardFailOnAnyError: true,
    collectAllIssues: false  // Fail fast
  }
};

// ============================================
// CRITICAL ERROR CLASSIFICATION
// ============================================

/**
 * All errors in CR-Markup are critical.
 * This aligns with the binary existence model.
 */
function isCriticalError(error: ValidationError): boolean {
  // In CR-Markup, ALL errors are critical
  // There is no concept of "non-critical" errors
  // A CR-block is either VALID or NON-EXISTENT
  return true;
}

// ============================================
// MODE VALIDATORS
// ============================================

/**
 * Validates CR-block in specified mode.
 *
 * @param input - Raw CR-block text
 * @param mode - Validation mode (draft | preview | production)
 * @returns ModeValidationResult with mode-specific behavior
 */
export function validateInMode(input: string, mode: ValidationMode): ModeValidationResult {
  const config = MODE_CONFIGS[mode];
  const result = validateCR(input);

  const totalErrors = result.errors.length;
  const totalWarnings = result.warnings.length;
  const criticalErrors = result.errors.filter(isCriticalError).length;

  // Determine acceptance based on mode
  let accepted = result.valid;
  let ingestable = result.valid;
  let blockedByMode = false;
  let message = '';

  switch (mode) {
    case 'draft':
      // Draft mode: accepted if no critical errors, warnings OK
      accepted = criticalErrors === 0;
      ingestable = false; // Never ingest in draft mode
      message = accepted
        ? `Draft valid (${totalWarnings} warnings)`
        : `Draft invalid: ${criticalErrors} critical errors`;
      break;

    case 'preview':
      // Preview mode: shows production behavior but doesn't ingest
      accepted = result.valid;
      ingestable = false; // Never ingest in preview mode
      blockedByMode = !result.valid;
      message = accepted
        ? 'Preview passed - ready for production'
        : `Preview failed: would be rejected in production (${totalErrors} errors)`;
      break;

    case 'production':
      // Production mode: binary existence model
      // ANY error → INVALID → zero ingestion
      accepted = result.valid && totalErrors === 0;
      ingestable = accepted;
      blockedByMode = !accepted;
      message = accepted
        ? 'Production valid - CR-block is ingestable'
        : 'Production REJECTED - CR-block is NON-EXISTENT (zero ingestion)';
      break;
  }

  return {
    mode,
    accepted,
    ingestable,
    result,
    summary: {
      totalErrors,
      totalWarnings,
      criticalErrors,
      blockedByMode,
      message
    }
  };
}

/**
 * Production-only validator with hard-fail semantics.
 * Returns null if invalid (non-existent).
 */
export function validateProduction(input: string): ValidationResult | null {
  const modeResult = validateInMode(input, 'production');

  if (!modeResult.ingestable) {
    // INVALID → NON-EXISTENT → null
    return null;
  }

  return modeResult.result;
}

/**
 * Checks if CR-block would be accepted in production.
 */
export function wouldPassProduction(input: string): boolean {
  return validateInMode(input, 'production').ingestable;
}

/**
 * Gets detailed preview of what would happen in production.
 */
export function previewProduction(input: string): ModeValidationResult {
  return validateInMode(input, 'preview');
}

/**
 * Draft validation for development.
 */
export function validateDraft(input: string): ModeValidationResult {
  return validateInMode(input, 'draft');
}

// ============================================
// BINARY EXISTENCE HELPERS
// ============================================

/**
 * Implements the binary existence model.
 *
 * A CR-block either:
 * - EXISTS (valid, ingestable, has data)
 * - DOES NOT EXIST (invalid, null, no data)
 *
 * There is no middle ground. No partial data. No "mostly valid".
 */
export function existsAsCR(input: string): boolean {
  const result = validateInMode(input, 'production');
  return result.ingestable;
}

/**
 * Returns CR data if exists, null if not.
 * This is the primary API for ingestion systems.
 */
export function ingestCR(input: string): {
  token: string;
  canonical: string;
  hash: string;
  fields: Record<string, unknown>;
} | null {
  const result = validateProduction(input);

  if (!result || !result.data) {
    return null;
  }

  return {
    token: result.data.token,
    canonical: result.data.canonical,
    hash: result.data.computedHash,
    fields: result.data.fields
  };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Valid CR-block for testing
  const validCR = `[CR/TESTENTITY]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=TestEntity
status=active
[/CR]`;

  // Invalid CR-block (missing required fields)
  const invalidCR = `[CR/INVALID]
name=Missing Fields
[/CR]`;

  // CR with warnings only (valid but has warnings)
  const warningCR = `[CR/WARNING]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=solana
name=WarningTest
[/CR]`;

  // Test 1: Production mode rejects any invalid CR
  const prodInvalid = validateInMode(invalidCR, 'production');
  if (!prodInvalid.accepted && !prodInvalid.ingestable && prodInvalid.summary.blockedByMode) {
    results.push('PASS: Test 1 - Production mode rejects invalid CR');
  } else {
    results.push('FAIL: Test 1 - Production should reject invalid CR');
    allPassed = false;
  }

  // Test 2: Production mode accepts valid CR
  const prodValid = validateInMode(validCR, 'production');
  if (prodValid.accepted && prodValid.ingestable) {
    results.push('PASS: Test 2 - Production mode accepts valid CR');
  } else {
    results.push('FAIL: Test 2 - Production should accept valid CR');
    results.push(`       Errors: ${JSON.stringify(prodValid.result.errors)}`);
    allPassed = false;
  }

  // Test 3: Draft mode allows warnings
  const draftResult = validateInMode(warningCR, 'draft');
  if (draftResult.accepted && !draftResult.ingestable) {
    results.push('PASS: Test 3 - Draft mode allows warnings (no ingestion)');
  } else {
    results.push('FAIL: Test 3 - Draft should allow warnings');
    allPassed = false;
  }

  // Test 4: Preview shows production behavior
  const previewInvalid = validateInMode(invalidCR, 'preview');
  if (!previewInvalid.accepted && previewInvalid.summary.blockedByMode) {
    results.push('PASS: Test 4 - Preview shows production rejection');
  } else {
    results.push('FAIL: Test 4 - Preview should show production behavior');
    allPassed = false;
  }

  // Test 5: validateProduction returns null for invalid
  const prodNull = validateProduction(invalidCR);
  if (prodNull === null) {
    results.push('PASS: Test 5 - validateProduction returns null for invalid');
  } else {
    results.push('FAIL: Test 5 - Should return null for invalid');
    allPassed = false;
  }

  // Test 6: validateProduction returns result for valid
  const prodResult = validateProduction(validCR);
  if (prodResult !== null && prodResult.valid) {
    results.push('PASS: Test 6 - validateProduction returns result for valid');
  } else {
    results.push('FAIL: Test 6 - Should return result for valid');
    allPassed = false;
  }

  // Test 7: existsAsCR binary check
  const exists = existsAsCR(validCR);
  const notExists = existsAsCR(invalidCR);
  if (exists && !notExists) {
    results.push('PASS: Test 7 - existsAsCR binary existence model works');
  } else {
    results.push('FAIL: Test 7 - Binary existence check failed');
    allPassed = false;
  }

  // Test 8: ingestCR returns data or null
  const ingested = ingestCR(validCR);
  const notIngested = ingestCR(invalidCR);
  if (ingested !== null && ingested.token === 'TESTENTITY' && notIngested === null) {
    results.push('PASS: Test 8 - ingestCR returns data for valid, null for invalid');
  } else {
    results.push('FAIL: Test 8 - ingestCR behavior incorrect');
    allPassed = false;
  }

  // Test 9: No partial acceptance (all-or-nothing)
  const partialTest = validateInMode(invalidCR, 'production');
  if (partialTest.result.data === undefined && !partialTest.ingestable) {
    results.push('PASS: Test 9 - No partial acceptance (all-or-nothing)');
  } else {
    results.push('FAIL: Test 9 - Should not have partial data');
    allPassed = false;
  }

  // Test 10: Mode config correctness
  const draftConfig = MODE_CONFIGS['draft'];
  const prodConfig = MODE_CONFIGS['production'];
  if (draftConfig.collectAllIssues && !prodConfig.collectAllIssues &&
      prodConfig.hardFailOnAnyError) {
    results.push('PASS: Test 10 - Mode configurations correct');
  } else {
    results.push('FAIL: Test 10 - Mode configurations incorrect');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Hard-Fail Semantics - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example usage
  console.log('\n\nBinary Existence Model Demo:');
  console.log('-'.repeat(60));

  const validCR = `[CR/DEMO]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=protocol
network=ethereum
name=DemoProtocol
[/CR]`;

  const invalidCR = `[CR/INVALID]
name=MissingFields
[/CR]`;

  console.log('Valid CR:');
  console.log(`  existsAsCR(): ${existsAsCR(validCR)}`);
  console.log(`  ingestCR(): ${ingestCR(validCR) ? 'DATA RETURNED' : 'null'}`);

  console.log('\nInvalid CR:');
  console.log(`  existsAsCR(): ${existsAsCR(invalidCR)}`);
  console.log(`  ingestCR(): ${ingestCR(invalidCR) ? 'DATA RETURNED' : 'null'}`);

  console.log('\nMode Comparison:');
  const modes: ValidationMode[] = ['draft', 'preview', 'production'];
  for (const mode of modes) {
    const result = validateInMode(invalidCR, mode);
    console.log(`  ${mode.padEnd(12)}: accepted=${result.accepted}, ingestable=${result.ingestable}`);
  }
}
