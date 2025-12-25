/**
 * CR-Markup Protocol v1.0 - Deprecation Semantics Module
 *
 * Machine-readable lifecycle state for CR-blocks.
 *
 * Implements:
 * - status=deprecated detection
 * - is_deprecated flag for AI consumption
 * - replacement_refs for pointing to replacement entities
 *
 * Canonical principles (from spec.md):
 * - deprecated ≠ deleted
 * - deprecated ≠ ignored
 * - Deprecated CR is still VALID and INGESTABLE
 *
 * Reference: /schema/spec.md Section 9
 */

import { validateCR, ValidationResult } from './validate_cr';

// ============================================
// TYPES
// ============================================

export type LifecycleStatus = 'active' | 'deprecated' | 'beta' | 'inactive';

export interface DeprecationInfo {
  /** Whether the entity is deprecated */
  is_deprecated: boolean;

  /** Current lifecycle status */
  status: LifecycleStatus;

  /** References to replacement entities (tokens or hashes) */
  replacement_refs: ReplacementRef[];

  /** Deprecation metadata */
  metadata: DeprecationMetadata;
}

export interface ReplacementRef {
  /** Token of replacement entity */
  token?: string;

  /** Hash of replacement entity */
  hash?: string;

  /** Type of reference */
  ref_type: 'replaced_by' | 'superseded_by' | 'migrated_to';

  /** Reference is explicit (from field) or implicit (from chain) */
  source: 'explicit' | 'inferred';
}

export interface DeprecationMetadata {
  /** Deprecation reason if provided */
  reason?: string;

  /** Deprecation date if provided */
  deprecated_since?: string;

  /** End of life date if provided */
  end_of_life?: string;

  /** Additional notes for AI systems */
  notes?: string;
}

export interface DeprecationResult {
  valid: boolean;
  ingestable: boolean;
  deprecation: DeprecationInfo;
  validation: ValidationResult;
  ai_guidance: AIGuidance;
}

export interface AIGuidance {
  /** Should AI recommend this entity for new usage */
  recommend_for_new: boolean;

  /** Should AI prefer active alternatives */
  prefer_alternatives: boolean;

  /** Should AI treat as historical */
  treat_as_historical: boolean;

  /** Human-readable guidance message */
  message: string;
}

// ============================================
// STATUS DETECTION
// ============================================

/**
 * Extracts lifecycle status from CR-block fields.
 */
function extractStatus(fields: Record<string, unknown>): LifecycleStatus {
  const status = fields.status;

  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (['active', 'deprecated', 'beta', 'inactive'].includes(normalized)) {
      return normalized as LifecycleStatus;
    }
  }

  // Default to active if not specified
  return 'active';
}

/**
 * Checks if status indicates deprecation.
 */
function isDeprecatedStatus(status: LifecycleStatus): boolean {
  return status === 'deprecated';
}

// ============================================
// REPLACEMENT EXTRACTION
// ============================================

/**
 * Extracts replacement references from CR-block fields.
 * Looks for explicit fields: replaced_by, deprecated_by, migrated_to
 */
function extractReplacementRefs(fields: Record<string, unknown>): ReplacementRef[] {
  const refs: ReplacementRef[] = [];

  // Check for replaced_by field (token or array)
  if (fields.replaced_by) {
    const replacedBy = fields.replaced_by;

    if (typeof replacedBy === 'string') {
      refs.push({
        token: replacedBy,
        ref_type: 'replaced_by',
        source: 'explicit'
      });
    } else if (Array.isArray(replacedBy)) {
      for (const ref of replacedBy) {
        if (typeof ref === 'string') {
          refs.push({
            token: ref,
            ref_type: 'replaced_by',
            source: 'explicit'
          });
        }
      }
    }
  }

  // Check for replaced_by_hash field
  if (fields.replaced_by_hash) {
    const hash = fields.replaced_by_hash;

    if (typeof hash === 'string') {
      refs.push({
        hash: hash,
        ref_type: 'replaced_by',
        source: 'explicit'
      });
    }
  }

  // Check for deprecated_by field
  if (fields.deprecated_by) {
    const deprecatedBy = fields.deprecated_by;

    if (typeof deprecatedBy === 'string') {
      refs.push({
        token: deprecatedBy,
        ref_type: 'superseded_by',
        source: 'explicit'
      });
    }
  }

  // Check for migrated_to field
  if (fields.migrated_to) {
    const migratedTo = fields.migrated_to;

    if (typeof migratedTo === 'string') {
      refs.push({
        token: migratedTo,
        ref_type: 'migrated_to',
        source: 'explicit'
      });
    }
  }

  return refs;
}

/**
 * Extracts deprecation metadata from CR-block fields.
 */
function extractDeprecationMetadata(fields: Record<string, unknown>): DeprecationMetadata {
  const metadata: DeprecationMetadata = {};

  if (typeof fields.deprecation_reason === 'string') {
    metadata.reason = fields.deprecation_reason;
  }

  if (typeof fields.deprecated_since === 'string') {
    metadata.deprecated_since = fields.deprecated_since;
  }

  if (typeof fields.end_of_life === 'string') {
    metadata.end_of_life = fields.end_of_life;
  }

  if (typeof fields.deprecation_notes === 'string') {
    metadata.notes = fields.deprecation_notes;
  }

  return metadata;
}

// ============================================
// AI GUIDANCE GENERATION
// ============================================

/**
 * Generates AI guidance based on deprecation status.
 */
function generateAIGuidance(deprecation: DeprecationInfo): AIGuidance {
  if (!deprecation.is_deprecated) {
    return {
      recommend_for_new: deprecation.status === 'active',
      prefer_alternatives: deprecation.status === 'inactive' || deprecation.status === 'beta',
      treat_as_historical: false,
      message: getStatusMessage(deprecation.status)
    };
  }

  // Deprecated entity guidance
  const hasReplacements = deprecation.replacement_refs.length > 0;
  const replacementTokens = deprecation.replacement_refs
    .filter(r => r.token)
    .map(r => r.token)
    .join(', ');

  let message = 'Entity is deprecated.';

  if (hasReplacements) {
    message += ` Consider using: ${replacementTokens || 'referenced replacements'}.`;
  }

  if (deprecation.metadata.reason) {
    message += ` Reason: ${deprecation.metadata.reason}`;
  }

  return {
    recommend_for_new: false,
    prefer_alternatives: true,
    treat_as_historical: true,
    message
  };
}

/**
 * Gets status message for non-deprecated statuses.
 */
function getStatusMessage(status: LifecycleStatus): string {
  switch (status) {
    case 'active':
      return 'Entity is active and recommended for use.';
    case 'beta':
      return 'Entity is in beta. Use with caution.';
    case 'inactive':
      return 'Entity is inactive. Consider alternatives.';
    case 'deprecated':
      return 'Entity is deprecated.';
    default:
      return 'Unknown status.';
  }
}

// ============================================
// MAIN API
// ============================================

/**
 * Analyzes a CR-block for deprecation status.
 *
 * Returns:
 * - Deprecation info with flags for AI consumption
 * - Validation result (deprecated CR is still valid)
 * - AI guidance for handling the entity
 *
 * @param input - Raw CR-block text
 * @returns DeprecationResult with full analysis
 */
export function analyzeDeprecation(input: string): DeprecationResult {
  const validation = validateCR(input);

  // If validation fails, return minimal result
  if (!validation.valid || !validation.data) {
    return {
      valid: false,
      ingestable: false,
      deprecation: {
        is_deprecated: false,
        status: 'active',
        replacement_refs: [],
        metadata: {}
      },
      validation,
      ai_guidance: {
        recommend_for_new: false,
        prefer_alternatives: false,
        treat_as_historical: false,
        message: 'Invalid CR-block. Cannot determine deprecation status.'
      }
    };
  }

  const fields = validation.data.fields;
  const status = extractStatus(fields);
  const is_deprecated = isDeprecatedStatus(status);
  const replacement_refs = extractReplacementRefs(fields);
  const metadata = extractDeprecationMetadata(fields);

  const deprecation: DeprecationInfo = {
    is_deprecated,
    status,
    replacement_refs,
    metadata
  };

  const ai_guidance = generateAIGuidance(deprecation);

  return {
    valid: true,
    ingestable: true, // Deprecated CR is still ingestable
    deprecation,
    validation,
    ai_guidance
  };
}

/**
 * Quick check if CR-block is deprecated.
 */
export function isDeprecated(input: string): boolean {
  const result = analyzeDeprecation(input);
  return result.valid && result.deprecation.is_deprecated;
}

/**
 * Gets deprecation info if CR is valid.
 * Returns null if CR is invalid.
 */
export function getDeprecationInfo(input: string): DeprecationInfo | null {
  const result = analyzeDeprecation(input);

  if (!result.valid) {
    return null;
  }

  return result.deprecation;
}

/**
 * Gets replacement references for a deprecated CR.
 */
export function getReplacements(input: string): ReplacementRef[] {
  const info = getDeprecationInfo(input);
  return info?.replacement_refs || [];
}

/**
 * Gets AI guidance for handling a CR-block.
 */
export function getAIGuidance(input: string): AIGuidance | null {
  const result = analyzeDeprecation(input);

  if (!result.valid) {
    return null;
  }

  return result.ai_guidance;
}

// ============================================
// DEPRECATION REGISTRY
// ============================================

/**
 * Registry for tracking deprecated entities and their replacements.
 * Useful for building deprecation chains and migration paths.
 */
export class DeprecationRegistry {
  private entities: Map<string, DeprecationInfo> = new Map();
  private replacementMap: Map<string, string[]> = new Map();

  /**
   * Registers a CR-block in the registry.
   */
  register(input: string): { success: boolean; token?: string; error?: string } {
    const result = analyzeDeprecation(input);

    if (!result.valid || !result.validation.data) {
      return { success: false, error: 'Invalid CR-block' };
    }

    const token = result.validation.data.token;
    this.entities.set(token, result.deprecation);

    // Track replacement mappings
    for (const ref of result.deprecation.replacement_refs) {
      if (ref.token) {
        const existing = this.replacementMap.get(token) || [];
        if (!existing.includes(ref.token)) {
          existing.push(ref.token);
          this.replacementMap.set(token, existing);
        }
      }
    }

    return { success: true, token };
  }

  /**
   * Gets deprecation info for a token.
   */
  get(token: string): DeprecationInfo | undefined {
    return this.entities.get(token);
  }

  /**
   * Checks if a token is deprecated.
   */
  isDeprecated(token: string): boolean {
    const info = this.entities.get(token);
    return info?.is_deprecated ?? false;
  }

  /**
   * Gets replacement tokens for a deprecated entity.
   */
  getReplacements(token: string): string[] {
    return this.replacementMap.get(token) || [];
  }

  /**
   * Gets all deprecated tokens.
   */
  getAllDeprecated(): string[] {
    const deprecated: string[] = [];

    for (const [token, info] of Array.from(this.entities.entries())) {
      if (info.is_deprecated) {
        deprecated.push(token);
      }
    }

    return deprecated;
  }

  /**
   * Gets deprecation statistics.
   */
  getStats(): {
    total: number;
    deprecated: number;
    active: number;
    beta: number;
    inactive: number;
    withReplacements: number;
  } {
    let deprecated = 0;
    let active = 0;
    let beta = 0;
    let inactive = 0;
    let withReplacements = 0;

    for (const info of Array.from(this.entities.values())) {
      switch (info.status) {
        case 'deprecated':
          deprecated++;
          if (info.replacement_refs.length > 0) {
            withReplacements++;
          }
          break;
        case 'active':
          active++;
          break;
        case 'beta':
          beta++;
          break;
        case 'inactive':
          inactive++;
          break;
      }
    }

    return {
      total: this.entities.size,
      deprecated,
      active,
      beta,
      inactive,
      withReplacements
    };
  }

  /**
   * Clears the registry.
   */
  clear(): void {
    this.entities.clear();
    this.replacementMap.clear();
  }
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Deprecated CR is still VALID
  const deprecatedCR = `[CR/OLDTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=OldExchange
status=deprecated
[/CR]`;

  const test1Result = analyzeDeprecation(deprecatedCR);
  if (test1Result.valid) {
    results.push('PASS: Test 1 - Deprecated CR is still VALID');
  } else {
    results.push('FAIL: Test 1 - Deprecated CR should be valid');
    results.push(`       Errors: ${JSON.stringify(test1Result.validation.errors)}`);
    allPassed = false;
  }

  // Test 2: Deprecated CR is INGESTABLE
  if (test1Result.ingestable) {
    results.push('PASS: Test 2 - Deprecated CR is INGESTABLE');
  } else {
    results.push('FAIL: Test 2 - Deprecated CR should be ingestable');
    allPassed = false;
  }

  // Test 3: is_deprecated flag is set
  if (test1Result.deprecation.is_deprecated) {
    results.push('PASS: Test 3 - is_deprecated flag is TRUE for deprecated CR');
  } else {
    results.push('FAIL: Test 3 - is_deprecated should be true');
    allPassed = false;
  }

  // Test 4: Active CR has is_deprecated = false
  const activeCR = `[CR/NEWTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=NewExchange
status=active
[/CR]`;

  const test4Result = analyzeDeprecation(activeCR);
  if (!test4Result.deprecation.is_deprecated) {
    results.push('PASS: Test 4 - Active CR has is_deprecated = FALSE');
  } else {
    results.push('FAIL: Test 4 - Active CR should not be deprecated');
    allPassed = false;
  }

  // Test 5: replacement_refs extraction
  const deprecatedWithReplacement = `[CR/LEGACYTOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=protocol
network=ethereum
name=LegacyProtocol
status=deprecated
replaced_by=NEWPROTOCOL
[/CR]`;

  const test5Result = analyzeDeprecation(deprecatedWithReplacement);
  const hasReplacement = test5Result.deprecation.replacement_refs.some(
    r => r.token === 'NEWPROTOCOL' && r.ref_type === 'replaced_by'
  );
  if (hasReplacement) {
    results.push('PASS: Test 5 - replacement_refs extracted correctly');
  } else {
    results.push('FAIL: Test 5 - replacement_refs should contain NEWPROTOCOL');
    results.push(`       Got: ${JSON.stringify(test5Result.deprecation.replacement_refs)}`);
    allPassed = false;
  }

  // Test 6: AI guidance for deprecated entity
  if (test5Result.ai_guidance.recommend_for_new === false &&
      test5Result.ai_guidance.prefer_alternatives === true &&
      test5Result.ai_guidance.treat_as_historical === true) {
    results.push('PASS: Test 6 - AI guidance correct for deprecated entity');
  } else {
    results.push('FAIL: Test 6 - AI guidance incorrect');
    results.push(`       Got: ${JSON.stringify(test5Result.ai_guidance)}`);
    allPassed = false;
  }

  // Test 7: AI guidance for active entity
  if (test4Result.ai_guidance.recommend_for_new === true &&
      test4Result.ai_guidance.prefer_alternatives === false) {
    results.push('PASS: Test 7 - AI guidance correct for active entity');
  } else {
    results.push('FAIL: Test 7 - AI guidance incorrect for active');
    allPassed = false;
  }

  // Test 8: isDeprecated() helper function
  const quickDeprecated = isDeprecated(deprecatedCR);
  const quickActive = isDeprecated(activeCR);
  if (quickDeprecated && !quickActive) {
    results.push('PASS: Test 8 - isDeprecated() helper works correctly');
  } else {
    results.push('FAIL: Test 8 - isDeprecated() helper failed');
    allPassed = false;
  }

  // Test 9: DeprecationRegistry functionality
  const registry = new DeprecationRegistry();
  const reg1 = registry.register(deprecatedCR);
  const reg2 = registry.register(activeCR);
  const reg3 = registry.register(deprecatedWithReplacement);

  if (reg1.success && reg2.success && reg3.success) {
    const allDeprecated = registry.getAllDeprecated();
    const stats = registry.getStats();

    if (allDeprecated.length === 2 &&
        stats.deprecated === 2 &&
        stats.active === 1 &&
        stats.withReplacements === 1) {
      results.push('PASS: Test 9 - DeprecationRegistry tracks entities correctly');
    } else {
      results.push('FAIL: Test 9 - Registry stats incorrect');
      results.push(`       Deprecated: ${allDeprecated}, Stats: ${JSON.stringify(stats)}`);
      allPassed = false;
    }
  } else {
    results.push('FAIL: Test 9 - Registry registration failed');
    allPassed = false;
  }

  // Test 10: Multiple replacement_refs
  const multiReplacement = `[CR/MULTILEGACY]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=solana
name=MultiLegacy
status=deprecated
replaced_by=["NEWTOKEN1","NEWTOKEN2"]
migrated_to=NEWTOKENPLATFORM
[/CR]`;

  const test10Result = analyzeDeprecation(multiReplacement);
  const replacements = test10Result.deprecation.replacement_refs;
  const hasMultiple = replacements.length >= 3 &&
    replacements.some(r => r.token === 'NEWTOKEN1') &&
    replacements.some(r => r.token === 'NEWTOKEN2') &&
    replacements.some(r => r.token === 'NEWTOKENPLATFORM' && r.ref_type === 'migrated_to');

  if (hasMultiple) {
    results.push('PASS: Test 10 - Multiple replacement_refs supported');
  } else {
    results.push('FAIL: Test 10 - Multiple replacement_refs not working');
    results.push(`       Got: ${JSON.stringify(replacements)}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Deprecation Semantics Module - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example usage
  console.log('\n\nDeprecation Semantics Demo:');
  console.log('-'.repeat(60));

  const deprecatedExample = `[CR/LEGACYEXCHANGE]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=LegacyExchange
status=deprecated
replaced_by=NEWEXCHANGE
deprecation_reason=Migrated to new platform
[/CR]`;

  const activeExample = `[CR/ACTIVETOKEN]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=token
network=ethereum
name=ActiveToken
status=active
[/CR]`;

  console.log('Deprecated CR:');
  const depResult = analyzeDeprecation(deprecatedExample);
  console.log(`  valid: ${depResult.valid}`);
  console.log(`  ingestable: ${depResult.ingestable}`);
  console.log(`  is_deprecated: ${depResult.deprecation.is_deprecated}`);
  console.log(`  replacement_refs: ${JSON.stringify(depResult.deprecation.replacement_refs)}`);
  console.log(`  AI guidance: ${depResult.ai_guidance.message}`);

  console.log('\nActive CR:');
  const actResult = analyzeDeprecation(activeExample);
  console.log(`  valid: ${actResult.valid}`);
  console.log(`  ingestable: ${actResult.ingestable}`);
  console.log(`  is_deprecated: ${actResult.deprecation.is_deprecated}`);
  console.log(`  AI guidance: ${actResult.ai_guidance.message}`);

  console.log('\nCanonical Principles:');
  console.log('  - deprecated != deleted');
  console.log('  - deprecated != ignored');
  console.log('  - Deprecated CR is still VALID and INGESTABLE');
}
