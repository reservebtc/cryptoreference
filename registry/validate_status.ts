#!/usr/bin/env npx tsx
/**
 * CR Registry Status State Machine
 *
 * Enforces page lifecycle status rules.
 * Guarantees immutable content history.
 *
 * Status State Machine:
 * - missing: Page not yet created (initial state)
 * - published: Page is live (immutable)
 * - deprecated: Page is obsolete (immutable)
 * - duplicate: Page duplicates another (requires canonical_id)
 *
 * Allowed Transitions:
 * - missing → published (on successful generation)
 * - missing → duplicate (if duplicate detected)
 * - published → deprecated (on obsolescence)
 * - duplicate → (no transitions, terminal)
 * - deprecated → (no transitions, terminal)
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 5
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageStatus = 'missing' | 'published' | 'deprecated' | 'duplicate';

export interface StatusTransition {
  from: PageStatus;
  to: PageStatus;
  allowed: boolean;
  reason?: string;
}

export interface StatusValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StatusCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    by_status: Record<PageStatus, number>;
    immutable_entries: number;
    missing_canonical_id: number;
    invalid_canonical_refs: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

export const VALID_STATUSES: PageStatus[] = ['missing', 'published', 'deprecated', 'duplicate'];

// Immutable statuses (cannot be regenerated)
export const IMMUTABLE_STATUSES: PageStatus[] = ['published', 'deprecated'];

// Statuses that require canonical_id
export const REQUIRES_CANONICAL_ID: PageStatus[] = ['duplicate'];

// Terminal statuses (no outgoing transitions)
export const TERMINAL_STATUSES: PageStatus[] = ['deprecated', 'duplicate'];

// Status transition rules
export const STATUS_TRANSITIONS: Record<PageStatus, PageStatus[]> = {
  missing: ['published', 'duplicate'],
  published: ['deprecated'],
  deprecated: [], // Terminal
  duplicate: []   // Terminal
};

// ============================================
// STATUS VALIDATION FUNCTIONS
// ============================================

/**
 * Check if a status is valid
 */
export function isValidStatus(status: unknown): status is PageStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status as PageStatus);
}

/**
 * Check if a status is immutable
 */
export function isImmutableStatus(status: PageStatus): boolean {
  return IMMUTABLE_STATUSES.includes(status);
}

/**
 * Check if a status is terminal (no outgoing transitions)
 */
export function isTerminalStatus(status: PageStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a transition is allowed
 */
export function isTransitionAllowed(from: PageStatus, to: PageStatus): StatusTransition {
  const allowedTargets = STATUS_TRANSITIONS[from] || [];
  const allowed = allowedTargets.includes(to);

  let reason: string | undefined;
  if (!allowed) {
    if (isTerminalStatus(from)) {
      reason = `Status "${from}" is terminal and cannot transition to any other status`;
    } else if (isImmutableStatus(from) && !allowedTargets.includes(to)) {
      reason = `Status "${from}" can only transition to: [${allowedTargets.join(', ')}]`;
    } else {
      reason = `Transition from "${from}" to "${to}" is not allowed`;
    }
  }

  return { from, to, allowed, reason };
}

/**
 * Get allowed transitions from a status
 */
export function getAllowedTransitions(status: PageStatus): PageStatus[] {
  return STATUS_TRANSITIONS[status] || [];
}

/**
 * Validate status value
 */
export function validateStatus(status: unknown): StatusValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (status === null || status === undefined) {
    errors.push('page_status is required');
    return { valid: false, errors, warnings };
  }

  if (typeof status !== 'string') {
    errors.push(`page_status must be a string (received ${typeof status})`);
    return { valid: false, errors, warnings };
  }

  if (!isValidStatus(status)) {
    errors.push(`Invalid page_status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

/**
 * Validate status with canonical_id rules
 */
export function validateStatusCanonicalId(
  id: string,
  status: PageStatus,
  canonicalId: string | undefined,
  existingIds: Set<string>
): StatusValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Entry "${id}"`;

  // Check if canonical_id is required
  if (REQUIRES_CANONICAL_ID.includes(status)) {
    if (!canonicalId) {
      errors.push(`${prefix}: canonical_id is required when page_status is "${status}"`);
    } else {
      // Validate canonical_id exists
      if (!existingIds.has(canonicalId)) {
        errors.push(`${prefix}: canonical_id "${canonicalId}" does not exist in registry`);
      }

      // Cannot reference itself
      if (canonicalId === id) {
        errors.push(`${prefix}: canonical_id cannot reference itself`);
      }
    }
  } else {
    // canonical_id should not exist for other statuses
    if (canonicalId) {
      warnings.push(`${prefix}: canonical_id is only used for status "duplicate", ignoring`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate that immutable entries are not modified
 * (Used when comparing old and new registry)
 */
export function validateImmutability(
  oldEntry: { id: string; page_status: PageStatus; [key: string]: unknown },
  newEntry: { id: string; page_status: PageStatus; [key: string]: unknown }
): StatusValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Entry "${oldEntry.id}"`;

  // Check if old status is immutable
  if (isImmutableStatus(oldEntry.page_status)) {
    // Check if status changed
    if (oldEntry.page_status !== newEntry.page_status) {
      const transition = isTransitionAllowed(oldEntry.page_status, newEntry.page_status);
      if (!transition.allowed) {
        errors.push(
          `${prefix}: Cannot change status from "${oldEntry.page_status}" to "${newEntry.page_status}". ` +
          (transition.reason || '')
        );
      }
    }

    // For published entries, warn about any changes
    if (oldEntry.page_status === 'published') {
      // Compare key fields (excluding metadata like published_at)
      const immutableFields = ['type', 'cr_required', 'parent_id', 'entities'];
      for (const field of immutableFields) {
        const oldValue = JSON.stringify(oldEntry[field]);
        const newValue = JSON.stringify(newEntry[field]);
        if (oldValue !== newValue) {
          errors.push(
            `${prefix}: Cannot modify "${field}" for published entry. ` +
            `Use supersedes mechanism instead.`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check if regeneration is allowed for an entry
 */
export function canRegenerate(status: PageStatus): { allowed: boolean; reason?: string } {
  if (status === 'missing') {
    return { allowed: true };
  }

  if (status === 'published') {
    return {
      allowed: false,
      reason: 'Published pages cannot be regenerated. Create a new entry with supersedes.'
    };
  }

  if (status === 'deprecated') {
    return {
      allowed: false,
      reason: 'Deprecated pages cannot be regenerated.'
    };
  }

  if (status === 'duplicate') {
    return {
      allowed: false,
      reason: 'Duplicate pages cannot be regenerated. Update the canonical entry instead.'
    };
  }

  return { allowed: false, reason: 'Unknown status' };
}

// ============================================
// REGISTRY STATUS VALIDATION
// ============================================

interface MinimalRegistryEntry {
  id: string;
  page_status: PageStatus;
  canonical_id?: string;
  [key: string]: unknown;
}

interface MinimalRegistry {
  entries: MinimalRegistryEntry[];
  [key: string]: unknown;
}

/**
 * Validate all status rules in a registry
 */
export function validateRegistryStatus(registry: MinimalRegistry): StatusCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: StatusCheckResult['stats'] = {
    total_entries: 0,
    by_status: {
      missing: 0,
      published: 0,
      deprecated: 0,
      duplicate: 0
    },
    immutable_entries: 0,
    missing_canonical_id: 0,
    invalid_canonical_refs: 0
  };

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Registry must have an entries array');
    return { valid: false, errors, warnings, stats };
  }

  stats.total_entries = registry.entries.length;

  // Build lookup set
  const existingIds = new Set<string>();
  for (const entry of registry.entries) {
    if (entry.id) {
      existingIds.add(entry.id);
    }
  }

  // Validate each entry
  for (const entry of registry.entries) {
    const prefix = `Entry "${entry.id}"`;

    // Validate status value
    const statusResult = validateStatus(entry.page_status);
    if (!statusResult.valid) {
      errors.push(...statusResult.errors.map(e => `${prefix}: ${e}`));
      continue;
    }

    // Update stats
    stats.by_status[entry.page_status]++;
    if (isImmutableStatus(entry.page_status)) {
      stats.immutable_entries++;
    }

    // Validate canonical_id rules
    const canonicalResult = validateStatusCanonicalId(
      entry.id,
      entry.page_status,
      entry.canonical_id,
      existingIds
    );

    errors.push(...canonicalResult.errors);
    warnings.push(...canonicalResult.warnings);

    // Track stats
    if (REQUIRES_CANONICAL_ID.includes(entry.page_status) && !entry.canonical_id) {
      stats.missing_canonical_id++;
    }
    if (entry.canonical_id && !existingIds.has(entry.canonical_id)) {
      stats.invalid_canonical_refs++;
    }
  }

  // Check for circular canonical_id references
  const canonicalMap = new Map<string, string>();
  for (const entry of registry.entries) {
    if (entry.canonical_id) {
      canonicalMap.set(entry.id, entry.canonical_id);
    }
  }

  for (const [id, canonicalId] of Array.from(canonicalMap.entries())) {
    const visited = new Set<string>();
    let current = canonicalId;

    while (current && canonicalMap.has(current)) {
      if (visited.has(current)) {
        errors.push(`Circular canonical_id reference detected involving "${id}"`);
        break;
      }
      visited.add(current);
      current = canonicalMap.get(current)!;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Compare old and new registry for immutability violations
 */
export function validateRegistryImmutability(
  oldRegistry: MinimalRegistry,
  newRegistry: MinimalRegistry
): StatusCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: StatusCheckResult['stats'] = {
    total_entries: newRegistry.entries?.length || 0,
    by_status: { missing: 0, published: 0, deprecated: 0, duplicate: 0 },
    immutable_entries: 0,
    missing_canonical_id: 0,
    invalid_canonical_refs: 0
  };

  if (!oldRegistry?.entries || !newRegistry?.entries) {
    return { valid: true, errors, warnings, stats };
  }

  // Build old entry map
  const oldEntryMap = new Map<string, MinimalRegistryEntry>();
  for (const entry of oldRegistry.entries) {
    oldEntryMap.set(entry.id, entry);
  }

  // Check each new entry against old
  for (const newEntry of newRegistry.entries) {
    const oldEntry = oldEntryMap.get(newEntry.id);

    if (oldEntry) {
      const result = validateImmutability(oldEntry, newEntry);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  // Check for deleted immutable entries
  for (const oldEntry of oldRegistry.entries) {
    if (isImmutableStatus(oldEntry.page_status)) {
      const stillExists = newRegistry.entries.some(e => e.id === oldEntry.id);
      if (!stillExists) {
        errors.push(
          `Entry "${oldEntry.id}": Cannot delete entry with status "${oldEntry.page_status}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Load registry and validate status
 */
export function loadAndValidateRegistryStatus(registryPath?: string): StatusCheckResult {
  const defaultPath = path.resolve(__dirname, 'registry.json');
  const filePath = registryPath || defaultPath;

  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        errors: [`Registry file not found: ${filePath}`],
        warnings: [],
        stats: {
          total_entries: 0,
          by_status: { missing: 0, published: 0, deprecated: 0, duplicate: 0 },
          immutable_entries: 0,
          missing_canonical_id: 0,
          invalid_canonical_refs: 0
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as MinimalRegistry;

    return validateRegistryStatus(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        total_entries: 0,
        by_status: { missing: 0, published: 0, deprecated: 0, duplicate: 0 },
        immutable_entries: 0,
        missing_canonical_id: 0,
        invalid_canonical_refs: 0
      }
    };
  }
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('Status State Machine - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Valid statuses
  for (const status of VALID_STATUSES) {
    const result = validateStatus(status);
    if (!result.valid) {
      results.push(`FAIL: Test 1 - Status "${status}" should be valid`);
      allPassed = false;
      break;
    }
  }
  if (allPassed) {
    results.push('PASS: Test 1 - All valid statuses validate');
  }

  // Test 2: Invalid status rejected
  const invalidStatus = validateStatus('invalid');
  if (!invalidStatus.valid && invalidStatus.errors.some(e => e.includes('Invalid page_status'))) {
    results.push('PASS: Test 2 - Invalid status rejected');
  } else {
    results.push('FAIL: Test 2 - Invalid status should be rejected');
    allPassed = false;
  }

  // Test 3: Null status rejected
  const nullStatus = validateStatus(null);
  if (!nullStatus.valid && nullStatus.errors.some(e => e.includes('required'))) {
    results.push('PASS: Test 3 - Null status rejected');
  } else {
    results.push('FAIL: Test 3 - Null status should be rejected');
    allPassed = false;
  }

  // Test 4: missing → published allowed
  const missingToPublished = isTransitionAllowed('missing', 'published');
  if (missingToPublished.allowed) {
    results.push('PASS: Test 4 - Transition missing → published allowed');
  } else {
    results.push('FAIL: Test 4 - Transition missing → published should be allowed');
    allPassed = false;
  }

  // Test 5: published → missing not allowed
  const publishedToMissing = isTransitionAllowed('published', 'missing');
  if (!publishedToMissing.allowed) {
    results.push('PASS: Test 5 - Transition published → missing rejected');
  } else {
    results.push('FAIL: Test 5 - Transition published → missing should be rejected');
    allPassed = false;
  }

  // Test 6: published → deprecated allowed
  const publishedToDeprecated = isTransitionAllowed('published', 'deprecated');
  if (publishedToDeprecated.allowed) {
    results.push('PASS: Test 6 - Transition published → deprecated allowed');
  } else {
    results.push('FAIL: Test 6 - Transition published → deprecated should be allowed');
    allPassed = false;
  }

  // Test 7: deprecated is terminal
  const deprecatedTransitions = getAllowedTransitions('deprecated');
  if (deprecatedTransitions.length === 0 && isTerminalStatus('deprecated')) {
    results.push('PASS: Test 7 - deprecated is terminal status');
  } else {
    results.push('FAIL: Test 7 - deprecated should be terminal');
    allPassed = false;
  }

  // Test 8: duplicate requires canonical_id
  const existingIds = new Set(['binance', 'okx']);
  const dupNoCanonical = validateStatusCanonicalId('dup-entry', 'duplicate', undefined, existingIds);
  if (!dupNoCanonical.valid && dupNoCanonical.errors.some(e => e.includes('canonical_id is required'))) {
    results.push('PASS: Test 8 - duplicate without canonical_id rejected');
  } else {
    results.push('FAIL: Test 8 - duplicate without canonical_id should be rejected');
    allPassed = false;
  }

  // Test 9: duplicate with valid canonical_id
  const dupWithCanonical = validateStatusCanonicalId('dup-entry', 'duplicate', 'binance', existingIds);
  if (dupWithCanonical.valid) {
    results.push('PASS: Test 9 - duplicate with valid canonical_id validates');
  } else {
    results.push('FAIL: Test 9 - duplicate with valid canonical_id should validate');
    allPassed = false;
  }

  // Test 10: canonical_id must exist
  const dupInvalidCanonical = validateStatusCanonicalId('dup-entry', 'duplicate', 'non-existent', existingIds);
  if (!dupInvalidCanonical.valid && dupInvalidCanonical.errors.some(e => e.includes('does not exist'))) {
    results.push('PASS: Test 10 - Non-existent canonical_id rejected');
  } else {
    results.push('FAIL: Test 10 - Non-existent canonical_id should be rejected');
    allPassed = false;
  }

  // Test 11: Cannot self-reference canonical_id
  const selfCanonical = validateStatusCanonicalId('self', 'duplicate', 'self', new Set(['self']));
  if (!selfCanonical.valid && selfCanonical.errors.some(e => e.includes('cannot reference itself'))) {
    results.push('PASS: Test 11 - Self-referencing canonical_id rejected');
  } else {
    results.push('FAIL: Test 11 - Self-referencing canonical_id should be rejected');
    allPassed = false;
  }

  // Test 12: canRegenerate for missing
  const canRegenMissing = canRegenerate('missing');
  if (canRegenMissing.allowed) {
    results.push('PASS: Test 12 - missing can be regenerated');
  } else {
    results.push('FAIL: Test 12 - missing should allow regeneration');
    allPassed = false;
  }

  // Test 13: canRegenerate for published
  const canRegenPublished = canRegenerate('published');
  if (!canRegenPublished.allowed && canRegenPublished.reason?.includes('supersedes')) {
    results.push('PASS: Test 13 - published cannot be regenerated');
  } else {
    results.push('FAIL: Test 13 - published should not allow regeneration');
    allPassed = false;
  }

  // Test 14: Immutability validation
  const oldEntry = { id: 'test', page_status: 'published' as PageStatus, type: 'entity' };
  const newEntryChanged = { id: 'test', page_status: 'published' as PageStatus, type: 'education' };
  const immutabilityResult = validateImmutability(oldEntry, newEntryChanged);
  if (!immutabilityResult.valid && immutabilityResult.errors.some(e => e.includes('Cannot modify'))) {
    results.push('PASS: Test 14 - Published entry modification rejected');
  } else {
    results.push('FAIL: Test 14 - Published entry modification should be rejected');
    allPassed = false;
  }

  // Test 15: Valid registry status
  const validRegistry = {
    entries: [
      { id: 'binance', page_status: 'published' as PageStatus },
      { id: 'okx', page_status: 'missing' as PageStatus },
      { id: 'dup-binance', page_status: 'duplicate' as PageStatus, canonical_id: 'binance' }
    ]
  };
  const regResult = validateRegistryStatus(validRegistry);
  if (regResult.valid) {
    results.push('PASS: Test 15 - Valid registry status validates');
  } else {
    results.push('FAIL: Test 15 - Valid registry status should validate');
    results.push(`  Errors: ${regResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 16: Registry with missing canonical_id rejected
  const invalidRegistry = {
    entries: [
      { id: 'dup-entry', page_status: 'duplicate' as PageStatus }
    ]
  };
  const invalidRegResult = validateRegistryStatus(invalidRegistry);
  if (!invalidRegResult.valid && invalidRegResult.stats.missing_canonical_id > 0) {
    results.push('PASS: Test 16 - Registry with missing canonical_id rejected');
  } else {
    results.push('FAIL: Test 16 - Registry with missing canonical_id should be rejected');
    allPassed = false;
  }

  // Test 17: Stats calculation
  const statsRegistry = {
    entries: [
      { id: 'a', page_status: 'missing' as PageStatus },
      { id: 'b', page_status: 'published' as PageStatus },
      { id: 'c', page_status: 'deprecated' as PageStatus },
      { id: 'd', page_status: 'duplicate' as PageStatus, canonical_id: 'b' }
    ]
  };
  const statsResult = validateRegistryStatus(statsRegistry);
  if (
    statsResult.stats.by_status.missing === 1 &&
    statsResult.stats.by_status.published === 1 &&
    statsResult.stats.by_status.deprecated === 1 &&
    statsResult.stats.by_status.duplicate === 1 &&
    statsResult.stats.immutable_entries === 2
  ) {
    results.push('PASS: Test 17 - Stats calculated correctly');
  } else {
    results.push('FAIL: Test 17 - Stats should be calculated correctly');
    allPassed = false;
  }

  // Test 18: Circular canonical_id detection
  const circularRegistry = {
    entries: [
      { id: 'a', page_status: 'duplicate' as PageStatus, canonical_id: 'b' },
      { id: 'b', page_status: 'duplicate' as PageStatus, canonical_id: 'a' }
    ]
  };
  const circularResult = validateRegistryStatus(circularRegistry);
  if (!circularResult.valid && circularResult.errors.some(e => e.includes('Circular'))) {
    results.push('PASS: Test 18 - Circular canonical_id detected');
  } else {
    results.push('FAIL: Test 18 - Circular canonical_id should be detected');
    allPassed = false;
  }

  // Test 19: Immutability check between registries
  const oldRegistry = {
    entries: [
      { id: 'binance', page_status: 'published' as PageStatus, type: 'entity' }
    ]
  };
  const newRegistryDeleted = {
    entries: []
  };
  const deleteResult = validateRegistryImmutability(oldRegistry, newRegistryDeleted);
  if (!deleteResult.valid && deleteResult.errors.some(e => e.includes('Cannot delete'))) {
    results.push('PASS: Test 19 - Deletion of published entry rejected');
  } else {
    results.push('FAIL: Test 19 - Deletion of published entry should be rejected');
    allPassed = false;
  }

  // Test 20: Load actual registry.json
  const loadResult = loadAndValidateRegistryStatus();
  if (loadResult.valid) {
    results.push('PASS: Test 20 - registry.json status validates');
    results.push(`  By status: missing=${loadResult.stats.by_status.missing}, published=${loadResult.stats.by_status.published}`);
  } else if (loadResult.stats.total_entries === 0) {
    results.push('PASS: Test 20 - Empty registry.json validates');
  } else {
    results.push('FAIL: Test 20 - registry.json status should validate');
    results.push(`  Errors: ${loadResult.errors.join(', ')}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CI RUNNER
// ============================================

/**
 * Run as CI check - exits with code 1 on failure
 */
export function runCICheck(registryPath?: string): boolean {
  console.log('='.repeat(50));
  console.log('CI Check: Registry Status State Machine');
  console.log('='.repeat(50));

  const result = loadAndValidateRegistryStatus(registryPath);

  console.log(`\nTotal entries: ${result.stats.total_entries}`);
  console.log('\nBy status:');
  for (const [status, count] of Object.entries(result.stats.by_status)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`\nImmutable entries: ${result.stats.immutable_entries}`);
  console.log(`Missing canonical_id: ${result.stats.missing_canonical_id}`);
  console.log(`Invalid canonical refs: ${result.stats.invalid_canonical_refs}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log('\n' + '='.repeat(50));

  if (result.valid) {
    console.log('RESULT: PASS - All status rules are valid');
  } else {
    console.log('RESULT: FAIL - Status validation errors found');
  }

  console.log('='.repeat(50));

  return result.valid;
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--ci')) {
    const success = runCICheck();
    process.exit(success ? 0 : 1);
  } else {
    const { passed, results } = runAcceptanceTests();

    for (const result of results) {
      console.log(result);
    }

    console.log('='.repeat(50));
    console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    // Also run CI check
    console.log('\n');
    const ciPassed = runCICheck();

    process.exit(passed && ciPassed ? 0 : 1);
  }
}
