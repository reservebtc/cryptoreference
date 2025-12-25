#!/usr/bin/env npx tsx
/**
 * CR Registry ID Validator
 *
 * Enforces ID uniqueness and format rules.
 * Guarantees: one ID → one page.
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 1
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export interface IdValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IdUniquenessResult {
  valid: boolean;
  errors: string[];
  duplicates: string[];
  total_ids: number;
  unique_ids: number;
}

export interface RegistryIdCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    valid_ids: number;
    invalid_ids: number;
    duplicate_ids: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

/**
 * ID Format Rules:
 * - Must start with a lowercase letter
 * - Can contain lowercase letters, numbers, and hyphens
 * - Minimum 2 characters
 * - Maximum 100 characters
 * - No consecutive hyphens
 * - Cannot end with hyphen
 */
const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const CONSECUTIVE_HYPHENS = /--/;
const ENDS_WITH_HYPHEN = /-$/;
const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

// Reserved IDs that cannot be used
const RESERVED_IDS = new Set([
  'api',
  'admin',
  'auth',
  'config',
  'error',
  'health',
  'index',
  'login',
  'logout',
  'null',
  'private',
  'public',
  'registry',
  'root',
  'schema',
  'static',
  'system',
  'test',
  'undefined',
  'unknown',
  'user',
  'www'
]);

// ============================================
// ID FORMAT VALIDATION
// ============================================

/**
 * Validate a single ID format
 */
export function validateIdFormat(id: unknown): IdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type check
  if (id === null || id === undefined) {
    errors.push('ID is required (received null/undefined)');
    return { valid: false, errors, warnings };
  }

  if (typeof id !== 'string') {
    errors.push(`ID must be a string (received ${typeof id})`);
    return { valid: false, errors, warnings };
  }

  // Empty check
  if (id.length === 0) {
    errors.push('ID cannot be empty');
    return { valid: false, errors, warnings };
  }

  // Whitespace check
  if (id.trim() !== id) {
    errors.push(`ID "${id}" contains leading or trailing whitespace`);
  }

  if (id.includes(' ')) {
    errors.push(`ID "${id}" contains spaces (use hyphens instead)`);
  }

  // Length checks
  if (id.length < MIN_LENGTH) {
    errors.push(`ID "${id}" is too short (min ${MIN_LENGTH} characters, got ${id.length})`);
  }

  if (id.length > MAX_LENGTH) {
    errors.push(`ID "${id}" is too long (max ${MAX_LENGTH} characters, got ${id.length})`);
  }

  // Pattern check
  if (!ID_PATTERN.test(id)) {
    if (/^[0-9]/.test(id)) {
      errors.push(`ID "${id}" cannot start with a number`);
    } else if (/^-/.test(id)) {
      errors.push(`ID "${id}" cannot start with a hyphen`);
    } else if (/[A-Z]/.test(id)) {
      errors.push(`ID "${id}" must be lowercase (contains uppercase letters)`);
    } else if (/[^a-z0-9-]/.test(id)) {
      errors.push(`ID "${id}" contains invalid characters (only lowercase letters, numbers, and hyphens allowed)`);
    } else {
      errors.push(`ID "${id}" has invalid format`);
    }
  }

  // Consecutive hyphens
  if (CONSECUTIVE_HYPHENS.test(id)) {
    errors.push(`ID "${id}" contains consecutive hyphens`);
  }

  // Ends with hyphen
  if (ENDS_WITH_HYPHEN.test(id)) {
    errors.push(`ID "${id}" cannot end with a hyphen`);
  }

  // Reserved ID check
  if (RESERVED_IDS.has(id)) {
    errors.push(`ID "${id}" is reserved and cannot be used`);
  }

  // Warnings for potentially problematic IDs
  if (id.length > 50) {
    warnings.push(`ID "${id}" is quite long (${id.length} chars), consider shortening`);
  }

  if (/^[a-z]$/.test(id)) {
    warnings.push(`Single-letter ID "${id}" is valid but not recommended`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate multiple IDs and check for duplicates
 */
export function validateIdUniqueness(ids: string[]): IdUniquenessResult {
  const errors: string[] = [];
  const duplicates: string[] = [];
  const seen = new Map<string, number>();

  // Count occurrences
  for (const id of ids) {
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
  }

  // Find duplicates
  for (const [id, count] of Array.from(seen.entries())) {
    if (count > 1) {
      duplicates.push(id);
      errors.push(`Duplicate ID: "${id}" appears ${count} times`);
    }
  }

  return {
    valid: duplicates.length === 0,
    errors,
    duplicates,
    total_ids: ids.length,
    unique_ids: seen.size
  };
}

// ============================================
// REGISTRY ID VALIDATION
// ============================================

interface MinimalRegistryEntry {
  id: string;
  [key: string]: unknown;
}

interface MinimalRegistry {
  entries: MinimalRegistryEntry[];
  [key: string]: unknown;
}

/**
 * Validate all IDs in a registry
 */
export function validateRegistryIds(registry: MinimalRegistry): RegistryIdCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    total_entries: 0,
    valid_ids: 0,
    invalid_ids: 0,
    duplicate_ids: 0
  };

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Registry must have an entries array');
    return { valid: false, errors, warnings, stats };
  }

  stats.total_entries = registry.entries.length;
  const allIds: string[] = [];

  // Validate each ID format
  for (let i = 0; i < registry.entries.length; i++) {
    const entry = registry.entries[i];
    const id = entry?.id;

    const result = validateIdFormat(id);

    if (result.valid) {
      stats.valid_ids++;
      allIds.push(id as string);
    } else {
      stats.invalid_ids++;
      for (const error of result.errors) {
        errors.push(`Entry ${i}: ${error}`);
      }
    }

    for (const warning of result.warnings) {
      warnings.push(`Entry ${i}: ${warning}`);
    }
  }

  // Check uniqueness
  if (allIds.length > 0) {
    const uniquenessResult = validateIdUniqueness(allIds);
    if (!uniquenessResult.valid) {
      stats.duplicate_ids = uniquenessResult.duplicates.length;
      errors.push(...uniquenessResult.errors);
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
 * Load registry and validate IDs
 */
export function loadAndValidateRegistryIds(registryPath?: string): RegistryIdCheckResult {
  const defaultPath = path.resolve(__dirname, 'registry.json');
  const filePath = registryPath || defaultPath;

  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        errors: [`Registry file not found: ${filePath}`],
        warnings: [],
        stats: { total_entries: 0, valid_ids: 0, invalid_ids: 0, duplicate_ids: 0 }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as MinimalRegistry;

    return validateRegistryIds(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: { total_entries: 0, valid_ids: 0, invalid_ids: 0, duplicate_ids: 0 }
    };
  }
}

/**
 * Check if an ID can be added to registry (not duplicate)
 */
export function canAddId(newId: string, existingIds: string[]): IdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // First validate format
  const formatResult = validateIdFormat(newId);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Check for duplicate
  if (existingIds.includes(newId)) {
    errors.push(`ID "${newId}" already exists in registry`);
  }

  // Check for similar IDs (potential confusion)
  for (const existingId of existingIds) {
    // Check if only differs by hyphen placement
    const newNormalized = newId.replace(/-/g, '');
    const existingNormalized = existingId.replace(/-/g, '');
    if (newNormalized === existingNormalized && newId !== existingId) {
      warnings.push(`ID "${newId}" is similar to existing ID "${existingId}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [...formatResult.warnings, ...warnings]
  };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('ID Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Valid ID
  const validId = validateIdFormat('binance');
  if (validId.valid) {
    results.push('PASS: Test 1 - Valid ID "binance" validates');
  } else {
    results.push('FAIL: Test 1 - Valid ID should validate');
    allPassed = false;
  }

  // Test 2: Valid ID with numbers and hyphens
  const complexId = validateIdFormat('binance-spot-v2');
  if (complexId.valid) {
    results.push('PASS: Test 2 - Valid ID "binance-spot-v2" validates');
  } else {
    results.push('FAIL: Test 2 - Valid complex ID should validate');
    allPassed = false;
  }

  // Test 3: Empty ID rejected
  const emptyId = validateIdFormat('');
  if (!emptyId.valid && emptyId.errors.some(e => e.includes('empty'))) {
    results.push('PASS: Test 3 - Empty ID rejected');
  } else {
    results.push('FAIL: Test 3 - Empty ID should be rejected');
    allPassed = false;
  }

  // Test 4: Null ID rejected
  const nullId = validateIdFormat(null);
  if (!nullId.valid && nullId.errors.some(e => e.includes('null'))) {
    results.push('PASS: Test 4 - Null ID rejected');
  } else {
    results.push('FAIL: Test 4 - Null ID should be rejected');
    allPassed = false;
  }

  // Test 5: ID starting with number rejected
  const numericStart = validateIdFormat('123abc');
  if (!numericStart.valid && numericStart.errors.some(e => e.includes('number'))) {
    results.push('PASS: Test 5 - ID starting with number rejected');
  } else {
    results.push('FAIL: Test 5 - ID starting with number should be rejected');
    allPassed = false;
  }

  // Test 6: Uppercase ID rejected
  const uppercaseId = validateIdFormat('Binance');
  if (!uppercaseId.valid && uppercaseId.errors.some(e => e.includes('lowercase'))) {
    results.push('PASS: Test 6 - Uppercase ID rejected');
  } else {
    results.push('FAIL: Test 6 - Uppercase ID should be rejected');
    allPassed = false;
  }

  // Test 7: ID with spaces rejected
  const spacedId = validateIdFormat('binance spot');
  if (!spacedId.valid && spacedId.errors.some(e => e.includes('space'))) {
    results.push('PASS: Test 7 - ID with spaces rejected');
  } else {
    results.push('FAIL: Test 7 - ID with spaces should be rejected');
    allPassed = false;
  }

  // Test 8: ID with consecutive hyphens rejected
  const doubleHyphen = validateIdFormat('binance--spot');
  if (!doubleHyphen.valid && doubleHyphen.errors.some(e => e.includes('consecutive'))) {
    results.push('PASS: Test 8 - ID with consecutive hyphens rejected');
  } else {
    results.push('FAIL: Test 8 - ID with consecutive hyphens should be rejected');
    allPassed = false;
  }

  // Test 9: ID ending with hyphen rejected
  const endHyphen = validateIdFormat('binance-');
  if (!endHyphen.valid && endHyphen.errors.some(e => e.includes('end with'))) {
    results.push('PASS: Test 9 - ID ending with hyphen rejected');
  } else {
    results.push('FAIL: Test 9 - ID ending with hyphen should be rejected');
    allPassed = false;
  }

  // Test 10: Reserved ID rejected
  const reservedId = validateIdFormat('admin');
  if (!reservedId.valid && reservedId.errors.some(e => e.includes('reserved'))) {
    results.push('PASS: Test 10 - Reserved ID "admin" rejected');
  } else {
    results.push('FAIL: Test 10 - Reserved ID should be rejected');
    allPassed = false;
  }

  // Test 11: Duplicate ID detection
  const duplicates = validateIdUniqueness(['binance', 'okx', 'binance', 'gate']);
  if (!duplicates.valid && duplicates.duplicates.includes('binance')) {
    results.push('PASS: Test 11 - Duplicate ID detected');
  } else {
    results.push('FAIL: Test 11 - Duplicate ID should be detected');
    allPassed = false;
  }

  // Test 12: Unique IDs pass
  const unique = validateIdUniqueness(['binance', 'okx', 'gate', 'bybit']);
  if (unique.valid && unique.unique_ids === 4) {
    results.push('PASS: Test 12 - Unique IDs validate');
  } else {
    results.push('FAIL: Test 12 - Unique IDs should validate');
    allPassed = false;
  }

  // Test 13: Registry validation
  const registry = {
    entries: [
      { id: 'binance' },
      { id: 'okx' },
      { id: 'gate' }
    ]
  };
  const regResult = validateRegistryIds(registry);
  if (regResult.valid && regResult.stats.valid_ids === 3) {
    results.push('PASS: Test 13 - Registry with valid IDs validates');
  } else {
    results.push('FAIL: Test 13 - Registry with valid IDs should validate');
    allPassed = false;
  }

  // Test 14: Registry with duplicate rejects
  const dupRegistry = {
    entries: [
      { id: 'binance' },
      { id: 'binance' }
    ]
  };
  const dupRegResult = validateRegistryIds(dupRegistry);
  if (!dupRegResult.valid && dupRegResult.stats.duplicate_ids === 1) {
    results.push('PASS: Test 14 - Registry with duplicate IDs rejected');
  } else {
    results.push('FAIL: Test 14 - Registry with duplicate IDs should be rejected');
    allPassed = false;
  }

  // Test 15: canAddId checks existing
  const existingIds = ['binance', 'okx', 'gate'];
  const canAdd = canAddId('bybit', existingIds);
  if (canAdd.valid) {
    results.push('PASS: Test 15 - canAddId allows new ID');
  } else {
    results.push('FAIL: Test 15 - canAddId should allow new ID');
    allPassed = false;
  }

  // Test 16: canAddId rejects duplicate
  const cannotAdd = canAddId('binance', existingIds);
  if (!cannotAdd.valid && cannotAdd.errors.some(e => e.includes('already exists'))) {
    results.push('PASS: Test 16 - canAddId rejects duplicate');
  } else {
    results.push('FAIL: Test 16 - canAddId should reject duplicate');
    allPassed = false;
  }

  // Test 17: ID too short rejected
  const shortId = validateIdFormat('a');
  if (!shortId.valid && shortId.errors.some(e => e.includes('short'))) {
    results.push('PASS: Test 17 - ID too short rejected');
  } else {
    results.push('FAIL: Test 17 - Short ID should be rejected');
    allPassed = false;
  }

  // Test 18: Special characters rejected
  const specialId = validateIdFormat('binance@spot');
  if (!specialId.valid && specialId.errors.some(e => e.includes('invalid'))) {
    results.push('PASS: Test 18 - ID with special characters rejected');
  } else {
    results.push('FAIL: Test 18 - ID with special characters should be rejected');
    allPassed = false;
  }

  // Test 19: Load actual registry.json
  const loadResult = loadAndValidateRegistryIds();
  if (loadResult.valid) {
    results.push('PASS: Test 19 - registry.json IDs validate');
    results.push(`  Total: ${loadResult.stats.total_entries}, Valid: ${loadResult.stats.valid_ids}`);
  } else if (loadResult.stats.total_entries === 0) {
    results.push('PASS: Test 19 - Empty registry.json validates');
  } else {
    results.push('FAIL: Test 19 - registry.json IDs should validate');
    results.push(`  Errors: ${loadResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 20: Similar ID warning
  const similarIds = ['binance-spot', 'binancespot'];
  const existingForSimilar = ['binance-spot'];
  const similarCheck = canAddId('binancespot', existingForSimilar);
  if (similarCheck.valid && similarCheck.warnings.some(w => w.includes('similar'))) {
    results.push('PASS: Test 20 - Similar ID triggers warning');
  } else {
    results.push('FAIL: Test 20 - Similar ID should trigger warning');
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
  console.log('CI Check: Registry ID Uniqueness Enforcement');
  console.log('='.repeat(50));

  const result = loadAndValidateRegistryIds(registryPath);

  console.log(`\nTotal entries: ${result.stats.total_entries}`);
  console.log(`Valid IDs: ${result.stats.valid_ids}`);
  console.log(`Invalid IDs: ${result.stats.invalid_ids}`);
  console.log(`Duplicate IDs: ${result.stats.duplicate_ids}`);

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
    console.log('RESULT: PASS - All IDs are valid and unique');
  } else {
    console.log('RESULT: FAIL - ID validation errors found');
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
    // CI mode: just validate registry
    const success = runCICheck();
    process.exit(success ? 0 : 1);
  } else {
    // Test mode: run acceptance tests
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
