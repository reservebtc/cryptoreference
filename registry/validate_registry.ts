#!/usr/bin/env npx tsx
/**
 * CR Registry Validator
 *
 * Validates registry.json against registry.schema.json
 * and enforces semantic rules from spec3.md.
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 0
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';
export type PageStatus = 'missing' | 'published' | 'deprecated' | 'duplicate';
export type SourceScope = 'official_site' | 'official_docs' | 'product_pages' | 'campaigns' | 'analytics' | 'official_social';

export interface RegistryEntry {
  id: string;
  type: PageType;
  parent_id?: string;
  entities?: string[];
  cr_required: boolean;
  page_status: PageStatus;
  source_scope: SourceScope[];
  canonical_id?: string;
  created_at?: string;
  published_at?: string;
}

export interface Registry {
  $schema?: string;
  version: string;
  entries: RegistryEntry[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    by_type: Record<PageType, number>;
    by_status: Record<PageStatus, number>;
  };
}

// ============================================
// CONSTANTS
// ============================================

const VALID_TYPES: PageType[] = ['entity', 'child_entity', 'education', 'comparison', 'interface', 'metrics'];
const VALID_STATUSES: PageStatus[] = ['missing', 'published', 'deprecated', 'duplicate'];
const VALID_SCOPES: SourceScope[] = ['official_site', 'official_docs', 'product_pages', 'campaigns', 'analytics', 'official_social'];
const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

// CR-required types
const CR_REQUIRED_TYPES: PageType[] = ['entity', 'child_entity'];
const CR_FORBIDDEN_TYPES: PageType[] = ['education', 'comparison', 'interface', 'metrics'];

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate ID format
 */
function validateId(id: string): string[] {
  const errors: string[] = [];

  if (!id || typeof id !== 'string') {
    errors.push('ID is required and must be a string');
    return errors;
  }

  if (id.length < 2) {
    errors.push(`ID "${id}" is too short (min 2 characters)`);
  }

  if (id.length > 100) {
    errors.push(`ID "${id}" is too long (max 100 characters)`);
  }

  if (!ID_PATTERN.test(id)) {
    errors.push(`ID "${id}" has invalid format (must be lowercase, start with letter, contain only letters, numbers, hyphens)`);
  }

  return errors;
}

/**
 * Validate single registry entry
 */
function validateEntry(entry: RegistryEntry, allIds: Set<string>): string[] {
  const errors: string[] = [];
  const prefix = `Entry "${entry.id || 'unknown'}"`;

  // Validate ID
  errors.push(...validateId(entry.id).map(e => `${prefix}: ${e}`));

  // Validate type
  if (!VALID_TYPES.includes(entry.type)) {
    errors.push(`${prefix}: Invalid type "${entry.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // Validate page_status
  if (!VALID_STATUSES.includes(entry.page_status)) {
    errors.push(`${prefix}: Invalid page_status "${entry.page_status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate source_scope
  if (!Array.isArray(entry.source_scope)) {
    errors.push(`${prefix}: source_scope must be an array`);
  } else {
    for (const scope of entry.source_scope) {
      if (!VALID_SCOPES.includes(scope as SourceScope)) {
        errors.push(`${prefix}: Invalid source_scope "${scope}". Must be one of: ${VALID_SCOPES.join(', ')}`);
      }
    }
  }

  // Validate cr_required based on type
  if (CR_REQUIRED_TYPES.includes(entry.type) && entry.cr_required !== true) {
    errors.push(`${prefix}: cr_required must be true for type "${entry.type}"`);
  }

  if (CR_FORBIDDEN_TYPES.includes(entry.type) && entry.cr_required !== false) {
    errors.push(`${prefix}: cr_required must be false for type "${entry.type}"`);
  }

  // Validate parent_id rules
  if (entry.type === 'child_entity') {
    if (!entry.parent_id) {
      errors.push(`${prefix}: parent_id is required for type "child_entity"`);
    } else if (!allIds.has(entry.parent_id)) {
      errors.push(`${prefix}: parent_id "${entry.parent_id}" does not exist in registry`);
    }
  } else if (entry.type === 'entity' && entry.parent_id) {
    errors.push(`${prefix}: parent_id is forbidden for type "entity"`);
  }

  // Validate comparison entities
  if (entry.type === 'comparison') {
    if (entry.parent_id) {
      errors.push(`${prefix}: parent_id is forbidden for type "comparison"`);
    }
    if (!entry.entities || !Array.isArray(entry.entities)) {
      errors.push(`${prefix}: entities array is required for type "comparison"`);
    } else if (entry.entities.length < 2) {
      errors.push(`${prefix}: comparison must reference at least 2 entities`);
    } else {
      for (const entityId of entry.entities) {
        if (!allIds.has(entityId)) {
          errors.push(`${prefix}: referenced entity "${entityId}" does not exist in registry`);
        }
      }
    }
  }

  // Validate duplicate status
  if (entry.page_status === 'duplicate') {
    if (!entry.canonical_id) {
      errors.push(`${prefix}: canonical_id is required when page_status is "duplicate"`);
    } else if (!allIds.has(entry.canonical_id)) {
      errors.push(`${prefix}: canonical_id "${entry.canonical_id}" does not exist in registry`);
    }
  }

  return errors;
}

/**
 * Validate entire registry
 */
export function validateRegistry(registry: Registry): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Initialize stats
  const stats: ValidationResult['stats'] = {
    total_entries: 0,
    by_type: {
      entity: 0,
      child_entity: 0,
      education: 0,
      comparison: 0,
      interface: 0,
      metrics: 0
    },
    by_status: {
      missing: 0,
      published: 0,
      deprecated: 0,
      duplicate: 0
    }
  };

  // Validate version
  if (!registry.version || typeof registry.version !== 'string') {
    errors.push('Registry version is required');
  }

  // Validate entries array
  if (!Array.isArray(registry.entries)) {
    errors.push('Registry entries must be an array');
    return { valid: false, errors, warnings, stats };
  }

  stats.total_entries = registry.entries.length;

  // Collect all IDs for reference validation
  const allIds = new Set<string>();
  const seenIds = new Set<string>();

  // First pass: collect IDs and check for duplicates
  for (const entry of registry.entries) {
    if (entry.id) {
      if (seenIds.has(entry.id)) {
        errors.push(`Duplicate registry ID: "${entry.id}"`);
      } else {
        seenIds.add(entry.id);
        allIds.add(entry.id);
      }
    }
  }

  // Second pass: validate each entry
  for (const entry of registry.entries) {
    errors.push(...validateEntry(entry, allIds));

    // Update stats
    if (VALID_TYPES.includes(entry.type)) {
      stats.by_type[entry.type]++;
    }
    if (VALID_STATUSES.includes(entry.page_status)) {
      stats.by_status[entry.page_status]++;
    }
  }

  // Check for cycles in parent-child relationships
  const cycleErrors = detectCycles(registry.entries);
  errors.push(...cycleErrors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Detect cycles in parent-child relationships
 */
function detectCycles(entries: RegistryEntry[]): string[] {
  const errors: string[] = [];
  const parentMap = new Map<string, string>();

  // Build parent map
  for (const entry of entries) {
    if (entry.parent_id) {
      parentMap.set(entry.id, entry.parent_id);
    }
  }

  // Check each entry for cycles
  for (const entry of entries) {
    if (!entry.parent_id) continue;

    const visited = new Set<string>();
    let current = entry.id;

    while (current && parentMap.has(current)) {
      if (visited.has(current)) {
        errors.push(`Cycle detected in parent-child hierarchy involving ID: "${entry.id}"`);
        break;
      }
      visited.add(current);
      current = parentMap.get(current)!;
    }
  }

  return errors;
}

/**
 * Load and validate registry from file
 */
export function loadAndValidateRegistry(registryPath?: string): ValidationResult {
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
          by_type: { entity: 0, child_entity: 0, education: 0, comparison: 0, interface: 0, metrics: 0 },
          by_status: { missing: 0, published: 0, deprecated: 0, duplicate: 0 }
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry: Registry = JSON.parse(content);

    return validateRegistry(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        total_entries: 0,
        by_type: { entity: 0, child_entity: 0, education: 0, comparison: 0, interface: 0, metrics: 0 },
        by_status: { missing: 0, published: 0, deprecated: 0, duplicate: 0 }
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

  console.log('Registry Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Empty registry validates
  const emptyRegistry: Registry = { version: '1.0', entries: [] };
  const emptyResult = validateRegistry(emptyRegistry);
  if (emptyResult.valid) {
    results.push('PASS: Test 1 - Empty registry validates');
  } else {
    results.push('FAIL: Test 1 - Empty registry should validate');
    results.push(`  Errors: ${emptyResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 2: Valid entity entry
  const validEntity: Registry = {
    version: '1.0',
    entries: [{
      id: 'binance',
      type: 'entity',
      cr_required: true,
      page_status: 'missing',
      source_scope: ['official_site', 'official_docs']
    }]
  };
  const entityResult = validateRegistry(validEntity);
  if (entityResult.valid) {
    results.push('PASS: Test 2 - Valid entity entry validates');
  } else {
    results.push('FAIL: Test 2 - Valid entity entry should validate');
    results.push(`  Errors: ${entityResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 3: Duplicate ID rejection
  const duplicateRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'test', type: 'entity', cr_required: true, page_status: 'missing', source_scope: [] },
      { id: 'test', type: 'entity', cr_required: true, page_status: 'missing', source_scope: [] }
    ]
  };
  const duplicateResult = validateRegistry(duplicateRegistry);
  if (!duplicateResult.valid && duplicateResult.errors.some(e => e.includes('Duplicate'))) {
    results.push('PASS: Test 3 - Duplicate ID rejected');
  } else {
    results.push('FAIL: Test 3 - Duplicate ID should be rejected');
    allPassed = false;
  }

  // Test 4: Invalid type rejection
  const invalidType: Registry = {
    version: '1.0',
    entries: [{
      id: 'test',
      type: 'invalid' as PageType,
      cr_required: true,
      page_status: 'missing',
      source_scope: []
    }]
  };
  const typeResult = validateRegistry(invalidType);
  if (!typeResult.valid && typeResult.errors.some(e => e.includes('Invalid type'))) {
    results.push('PASS: Test 4 - Invalid type rejected');
  } else {
    results.push('FAIL: Test 4 - Invalid type should be rejected');
    allPassed = false;
  }

  // Test 5: CR-required mismatch for entity
  const crMismatch: Registry = {
    version: '1.0',
    entries: [{
      id: 'test',
      type: 'entity',
      cr_required: false, // Should be true for entity
      page_status: 'missing',
      source_scope: []
    }]
  };
  const crResult = validateRegistry(crMismatch);
  if (!crResult.valid && crResult.errors.some(e => e.includes('cr_required must be true'))) {
    results.push('PASS: Test 5 - CR-required mismatch rejected for entity');
  } else {
    results.push('FAIL: Test 5 - CR-required mismatch should be rejected for entity');
    allPassed = false;
  }

  // Test 6: child_entity without parent_id
  const noParent: Registry = {
    version: '1.0',
    entries: [{
      id: 'test-child',
      type: 'child_entity',
      cr_required: true,
      page_status: 'missing',
      source_scope: []
    }]
  };
  const parentResult = validateRegistry(noParent);
  if (!parentResult.valid && parentResult.errors.some(e => e.includes('parent_id is required'))) {
    results.push('PASS: Test 6 - child_entity without parent_id rejected');
  } else {
    results.push('FAIL: Test 6 - child_entity without parent_id should be rejected');
    allPassed = false;
  }

  // Test 7: comparison without entities
  const noEntities: Registry = {
    version: '1.0',
    entries: [{
      id: 'compare-test',
      type: 'comparison',
      cr_required: false,
      page_status: 'missing',
      source_scope: []
    }]
  };
  const entitiesResult = validateRegistry(noEntities);
  if (!entitiesResult.valid && entitiesResult.errors.some(e => e.includes('entities array is required'))) {
    results.push('PASS: Test 7 - comparison without entities rejected');
  } else {
    results.push('FAIL: Test 7 - comparison without entities should be rejected');
    allPassed = false;
  }

  // Test 8: Load actual registry.json
  const loadResult = loadAndValidateRegistry();
  if (loadResult.valid) {
    results.push('PASS: Test 8 - registry.json loads and validates');
    results.push(`  Stats: ${loadResult.stats.total_entries} entries`);
  } else {
    results.push('FAIL: Test 8 - registry.json should load and validate');
    results.push(`  Errors: ${loadResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 9: Invalid ID format rejection
  const invalidId: Registry = {
    version: '1.0',
    entries: [{
      id: '123-invalid',
      type: 'entity',
      cr_required: true,
      page_status: 'missing',
      source_scope: []
    }]
  };
  const idResult = validateRegistry(invalidId);
  if (!idResult.valid && idResult.errors.some(e => e.includes('invalid format'))) {
    results.push('PASS: Test 9 - Invalid ID format rejected');
  } else {
    results.push('FAIL: Test 9 - Invalid ID format should be rejected');
    allPassed = false;
  }

  // Test 10: education with cr_required=true rejection
  const eduCR: Registry = {
    version: '1.0',
    entries: [{
      id: 'edu-test',
      type: 'education',
      cr_required: true, // Should be false
      page_status: 'missing',
      source_scope: []
    }]
  };
  const eduResult = validateRegistry(eduCR);
  if (!eduResult.valid && eduResult.errors.some(e => e.includes('cr_required must be false'))) {
    results.push('PASS: Test 10 - education with cr_required=true rejected');
  } else {
    results.push('FAIL: Test 10 - education with cr_required=true should be rejected');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Also validate the actual registry
  console.log('\n' + '='.repeat(50));
  console.log('\nValidating registry.json:');
  console.log('-'.repeat(50));

  const registryResult = loadAndValidateRegistry();
  console.log(`Valid: ${registryResult.valid}`);
  console.log(`Total entries: ${registryResult.stats.total_entries}`);

  if (registryResult.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of registryResult.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (registryResult.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of registryResult.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log('\nBy Type:');
  for (const [type, count] of Object.entries(registryResult.stats.by_type)) {
    if (count > 0) console.log(`  ${type}: ${count}`);
  }

  console.log('\nBy Status:');
  for (const [status, count] of Object.entries(registryResult.stats.by_status)) {
    if (count > 0) console.log(`  ${status}: ${count}`);
  }

  process.exit(passed && registryResult.valid ? 0 : 1);
}
