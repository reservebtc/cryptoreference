#!/usr/bin/env npx tsx
/**
 * CR Registry Comparison Page Validator
 *
 * Enforces comparison page constraints.
 * Guarantees safe comparison layer.
 *
 * Comparison Page Rules:
 * - type = 'comparison'
 * - cr_required = false (CR-Markup forbidden)
 * - parent_id forbidden
 * - entities[] required with at least 2 entities
 * - All referenced entities must exist and be of type 'entity'
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 4
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';

export interface ComparisonValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ComparisonCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    comparison_pages: number;
    valid_comparisons: number;
    invalid_comparisons: number;
    total_entity_refs: number;
    missing_entity_refs: number;
    invalid_entity_type_refs: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

const MIN_ENTITIES_FOR_COMPARISON = 2;
const MAX_ENTITIES_FOR_COMPARISON = 10;

// Types that can be referenced in comparison
const COMPARABLE_TYPES: PageType[] = ['entity'];

// ============================================
// COMPARISON VALIDATION FUNCTIONS
// ============================================

/**
 * Validate comparison page constraints
 */
export function validateComparisonEntry(
  id: string,
  type: PageType,
  crRequired: boolean,
  parentId: string | undefined,
  entities: string[] | undefined,
  existingIds: Set<string>,
  typeMap: Map<string, PageType>
): ComparisonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate comparison type
  if (type !== 'comparison') {
    return { valid: true, errors, warnings };
  }

  const prefix = `Comparison "${id}"`;

  // Rule 1: cr_required must be false
  if (crRequired !== false) {
    errors.push(`${prefix}: cr_required must be false (CR-Markup is forbidden for comparisons)`);
  }

  // Rule 2: parent_id must not exist
  if (parentId) {
    errors.push(`${prefix}: parent_id is forbidden for comparison pages`);
  }

  // Rule 3: entities[] must exist and be an array
  if (!entities) {
    errors.push(`${prefix}: entities[] array is required`);
    return { valid: errors.length === 0, errors, warnings };
  }

  if (!Array.isArray(entities)) {
    errors.push(`${prefix}: entities must be an array`);
    return { valid: errors.length === 0, errors, warnings };
  }

  // Rule 4: entities[] must have at least MIN_ENTITIES_FOR_COMPARISON
  if (entities.length < MIN_ENTITIES_FOR_COMPARISON) {
    errors.push(
      `${prefix}: entities[] must have at least ${MIN_ENTITIES_FOR_COMPARISON} entities ` +
      `(found ${entities.length})`
    );
  }

  // Rule 5: entities[] should not exceed MAX_ENTITIES_FOR_COMPARISON
  if (entities.length > MAX_ENTITIES_FOR_COMPARISON) {
    warnings.push(
      `${prefix}: entities[] has ${entities.length} entities, ` +
      `consider limiting to ${MAX_ENTITIES_FOR_COMPARISON} for readability`
    );
  }

  // Rule 6: Check for duplicate entities
  const uniqueEntities = new Set(entities);
  if (uniqueEntities.size !== entities.length) {
    const duplicates = entities.filter((e, i) => entities.indexOf(e) !== i);
    errors.push(`${prefix}: entities[] contains duplicates: [${Array.from(new Set(duplicates)).join(', ')}]`);
  }

  // Rule 7: All referenced entities must exist
  for (const entityId of entities) {
    if (!existingIds.has(entityId)) {
      errors.push(`${prefix}: referenced entity "${entityId}" does not exist in registry`);
    }
  }

  // Rule 8: All referenced entities must be of type 'entity'
  for (const entityId of entities) {
    if (existingIds.has(entityId)) {
      const entityType = typeMap.get(entityId);
      if (entityType && !COMPARABLE_TYPES.includes(entityType)) {
        errors.push(
          `${prefix}: referenced "${entityId}" has type "${entityType}", ` +
          `only types [${COMPARABLE_TYPES.join(', ')}] can be compared`
        );
      }
    }
  }

  // Rule 9: Cannot reference itself
  if (entities.includes(id)) {
    errors.push(`${prefix}: cannot reference itself in entities[]`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate that non-comparison pages don't have entities[]
 */
export function validateNonComparisonEntities(
  id: string,
  type: PageType,
  entities: string[] | undefined
): ComparisonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (type === 'comparison') {
    return { valid: true, errors, warnings };
  }

  if (entities && entities.length > 0) {
    errors.push(
      `Entry "${id}": entities[] is only allowed for type "comparison", ` +
      `but type is "${type}"`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate comparison ID from entity IDs
 */
export function generateComparisonId(entityIds: string[]): string {
  // Sort alphabetically for determinism
  const sorted = [...entityIds].sort();
  return sorted.join('-vs-');
}

/**
 * Check if a comparison already exists for given entities
 */
export function findExistingComparison(
  entityIds: string[],
  comparisons: Array<{ id: string; entities: string[] }>
): string | null {
  const sortedInput = [...entityIds].sort();

  for (const comp of comparisons) {
    const sortedComp = [...comp.entities].sort();
    if (
      sortedInput.length === sortedComp.length &&
      sortedInput.every((e, i) => e === sortedComp[i])
    ) {
      return comp.id;
    }
  }

  return null;
}

/**
 * Get all comparisons that include a specific entity
 */
export function getComparisonsForEntity(
  entityId: string,
  comparisons: Array<{ id: string; entities: string[] }>
): string[] {
  return comparisons
    .filter(c => c.entities.includes(entityId))
    .map(c => c.id);
}

// ============================================
// REGISTRY COMPARISON VALIDATION
// ============================================

interface MinimalRegistryEntry {
  id: string;
  type: PageType;
  cr_required: boolean;
  parent_id?: string;
  entities?: string[];
  [key: string]: unknown;
}

interface MinimalRegistry {
  entries: MinimalRegistryEntry[];
  [key: string]: unknown;
}

/**
 * Validate all comparison constraints in a registry
 */
export function validateRegistryComparisons(registry: MinimalRegistry): ComparisonCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: ComparisonCheckResult['stats'] = {
    total_entries: 0,
    comparison_pages: 0,
    valid_comparisons: 0,
    invalid_comparisons: 0,
    total_entity_refs: 0,
    missing_entity_refs: 0,
    invalid_entity_type_refs: 0
  };

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Registry must have an entries array');
    return { valid: false, errors, warnings, stats };
  }

  stats.total_entries = registry.entries.length;

  // Build lookup maps
  const existingIds = new Set<string>();
  const typeMap = new Map<string, PageType>();

  for (const entry of registry.entries) {
    if (entry.id) {
      existingIds.add(entry.id);
      typeMap.set(entry.id, entry.type);
    }
  }

  // Validate each entry
  for (const entry of registry.entries) {
    // Validate comparison entries
    if (entry.type === 'comparison') {
      stats.comparison_pages++;

      const result = validateComparisonEntry(
        entry.id,
        entry.type,
        entry.cr_required,
        entry.parent_id,
        entry.entities,
        existingIds,
        typeMap
      );

      if (result.valid) {
        stats.valid_comparisons++;
      } else {
        stats.invalid_comparisons++;
      }

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      // Count entity references
      if (entry.entities) {
        stats.total_entity_refs += entry.entities.length;

        for (const entityId of entry.entities) {
          if (!existingIds.has(entityId)) {
            stats.missing_entity_refs++;
          } else {
            const entityType = typeMap.get(entityId);
            if (entityType && !COMPARABLE_TYPES.includes(entityType)) {
              stats.invalid_entity_type_refs++;
            }
          }
        }
      }
    } else {
      // Validate non-comparison entries don't have entities[]
      const nonCompResult = validateNonComparisonEntities(
        entry.id,
        entry.type,
        entry.entities
      );

      errors.push(...nonCompResult.errors);
      warnings.push(...nonCompResult.warnings);
    }
  }

  // Check for duplicate comparisons (same entities, different ID)
  const comparisons = registry.entries
    .filter(e => e.type === 'comparison' && e.entities)
    .map(e => ({ id: e.id, entities: e.entities! }));

  const seenEntitySets = new Map<string, string>();
  for (const comp of comparisons) {
    const key = [...comp.entities].sort().join('|');
    if (seenEntitySets.has(key)) {
      warnings.push(
        `Duplicate comparison: "${comp.id}" compares same entities as "${seenEntitySets.get(key)}"`
      );
    } else {
      seenEntitySets.set(key, comp.id);
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
 * Load registry and validate comparisons
 */
export function loadAndValidateRegistryComparisons(registryPath?: string): ComparisonCheckResult {
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
          comparison_pages: 0,
          valid_comparisons: 0,
          invalid_comparisons: 0,
          total_entity_refs: 0,
          missing_entity_refs: 0,
          invalid_entity_type_refs: 0
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as MinimalRegistry;

    return validateRegistryComparisons(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        total_entries: 0,
        comparison_pages: 0,
        valid_comparisons: 0,
        invalid_comparisons: 0,
        total_entity_refs: 0,
        missing_entity_refs: 0,
        invalid_entity_type_refs: 0
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

  console.log('Comparison Page Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Setup common test data
  const existingIds = new Set(['binance', 'okx', 'gate', 'bybit', 'compare-test']);
  const typeMap = new Map<string, PageType>([
    ['binance', 'entity'],
    ['okx', 'entity'],
    ['gate', 'entity'],
    ['bybit', 'entity'],
    ['compare-test', 'comparison']
  ]);

  // Test 1: Valid comparison page
  const validComp = validateComparisonEntry(
    'binance-vs-okx',
    'comparison',
    false,
    undefined,
    ['binance', 'okx'],
    existingIds,
    typeMap
  );
  if (validComp.valid) {
    results.push('PASS: Test 1 - Valid comparison page validates');
  } else {
    results.push('FAIL: Test 1 - Valid comparison page should validate');
    results.push(`  Errors: ${validComp.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 2: Comparison with parent_id rejected
  const compWithParent = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    'some-parent',
    ['binance', 'okx'],
    existingIds,
    typeMap
  );
  if (!compWithParent.valid && compWithParent.errors.some(e => e.includes('parent_id is forbidden'))) {
    results.push('PASS: Test 2 - Comparison with parent_id rejected');
  } else {
    results.push('FAIL: Test 2 - Comparison with parent_id should be rejected');
    allPassed = false;
  }

  // Test 3: Comparison with cr_required=true rejected
  const compWithCR = validateComparisonEntry(
    'compare-test',
    'comparison',
    true,
    undefined,
    ['binance', 'okx'],
    existingIds,
    typeMap
  );
  if (!compWithCR.valid && compWithCR.errors.some(e => e.includes('cr_required must be false'))) {
    results.push('PASS: Test 3 - Comparison with CR rejected');
  } else {
    results.push('FAIL: Test 3 - Comparison with CR should be rejected');
    allPassed = false;
  }

  // Test 4: Comparison without entities[] rejected
  const compNoEntities = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    undefined,
    existingIds,
    typeMap
  );
  if (!compNoEntities.valid && compNoEntities.errors.some(e => e.includes('entities[] array is required'))) {
    results.push('PASS: Test 4 - Comparison without entities[] rejected');
  } else {
    results.push('FAIL: Test 4 - Comparison without entities[] should be rejected');
    allPassed = false;
  }

  // Test 5: Comparison with less than 2 entities rejected
  const compOneEntity = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    ['binance'],
    existingIds,
    typeMap
  );
  if (!compOneEntity.valid && compOneEntity.errors.some(e => e.includes('at least 2'))) {
    results.push('PASS: Test 5 - Comparison with 1 entity rejected');
  } else {
    results.push('FAIL: Test 5 - Comparison with 1 entity should be rejected');
    allPassed = false;
  }

  // Test 6: Unknown entity reference rejected
  const compUnknownEntity = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    ['binance', 'unknown-exchange'],
    existingIds,
    typeMap
  );
  if (!compUnknownEntity.valid && compUnknownEntity.errors.some(e => e.includes('does not exist'))) {
    results.push('PASS: Test 6 - Unknown entity reference rejected');
  } else {
    results.push('FAIL: Test 6 - Unknown entity reference should be rejected');
    allPassed = false;
  }

  // Test 7: Duplicate entities in array rejected
  const compDuplicates = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    ['binance', 'binance', 'okx'],
    existingIds,
    typeMap
  );
  if (!compDuplicates.valid && compDuplicates.errors.some(e => e.includes('duplicates'))) {
    results.push('PASS: Test 7 - Duplicate entities rejected');
  } else {
    results.push('FAIL: Test 7 - Duplicate entities should be rejected');
    allPassed = false;
  }

  // Test 8: Self-reference rejected
  const compSelfRef = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    ['binance', 'compare-test'],
    existingIds,
    typeMap
  );
  if (!compSelfRef.valid && compSelfRef.errors.some(e => e.includes('cannot reference itself'))) {
    results.push('PASS: Test 8 - Self-reference rejected');
  } else {
    results.push('FAIL: Test 8 - Self-reference should be rejected');
    allPassed = false;
  }

  // Test 9: Non-entity type reference rejected
  const nonEntityMap = new Map<string, PageType>([
    ['binance', 'entity'],
    ['some-child', 'child_entity']
  ]);
  const nonEntityIds = new Set(['binance', 'some-child']);
  const compNonEntity = validateComparisonEntry(
    'compare-test',
    'comparison',
    false,
    undefined,
    ['binance', 'some-child'],
    nonEntityIds,
    nonEntityMap
  );
  if (!compNonEntity.valid && compNonEntity.errors.some(e => e.includes('only types'))) {
    results.push('PASS: Test 9 - Non-entity type reference rejected');
  } else {
    results.push('FAIL: Test 9 - Non-entity type reference should be rejected');
    allPassed = false;
  }

  // Test 10: Non-comparison with entities[] rejected
  const entityWithEntities = validateNonComparisonEntities(
    'binance',
    'entity',
    ['okx', 'gate']
  );
  if (!entityWithEntities.valid && entityWithEntities.errors.some(e => e.includes('only allowed for type "comparison"'))) {
    results.push('PASS: Test 10 - Non-comparison with entities[] rejected');
  } else {
    results.push('FAIL: Test 10 - Non-comparison with entities[] should be rejected');
    allPassed = false;
  }

  // Test 11: generateComparisonId function
  const genId = generateComparisonId(['okx', 'binance', 'gate']);
  if (genId === 'binance-vs-gate-vs-okx') {
    results.push('PASS: Test 11 - generateComparisonId works correctly');
  } else {
    results.push('FAIL: Test 11 - generateComparisonId should sort alphabetically');
    allPassed = false;
  }

  // Test 12: findExistingComparison function
  const comparisons = [
    { id: 'binance-vs-okx', entities: ['binance', 'okx'] },
    { id: 'gate-vs-bybit', entities: ['gate', 'bybit'] }
  ];
  const found = findExistingComparison(['okx', 'binance'], comparisons);
  if (found === 'binance-vs-okx') {
    results.push('PASS: Test 12 - findExistingComparison finds match');
  } else {
    results.push('FAIL: Test 12 - findExistingComparison should find match');
    allPassed = false;
  }

  // Test 13: findExistingComparison returns null for no match
  const notFound = findExistingComparison(['binance', 'gate'], comparisons);
  if (notFound === null) {
    results.push('PASS: Test 13 - findExistingComparison returns null for no match');
  } else {
    results.push('FAIL: Test 13 - findExistingComparison should return null');
    allPassed = false;
  }

  // Test 14: getComparisonsForEntity function
  const compsForBinance = getComparisonsForEntity('binance', comparisons);
  if (compsForBinance.length === 1 && compsForBinance[0] === 'binance-vs-okx') {
    results.push('PASS: Test 14 - getComparisonsForEntity works correctly');
  } else {
    results.push('FAIL: Test 14 - getComparisonsForEntity should work correctly');
    allPassed = false;
  }

  // Test 15: Valid registry with comparisons
  const validRegistry = {
    entries: [
      { id: 'binance', type: 'entity' as PageType, cr_required: true },
      { id: 'okx', type: 'entity' as PageType, cr_required: true },
      { id: 'binance-vs-okx', type: 'comparison' as PageType, cr_required: false, entities: ['binance', 'okx'] }
    ]
  };
  const regResult = validateRegistryComparisons(validRegistry);
  if (regResult.valid && regResult.stats.valid_comparisons === 1) {
    results.push('PASS: Test 15 - Valid registry with comparisons validates');
  } else {
    results.push('FAIL: Test 15 - Valid registry with comparisons should validate');
    results.push(`  Errors: ${regResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 16: Registry with invalid comparison rejected
  const invalidRegistry = {
    entries: [
      { id: 'binance', type: 'entity' as PageType, cr_required: true },
      { id: 'bad-compare', type: 'comparison' as PageType, cr_required: true, entities: ['binance'] }
    ]
  };
  const invalidResult = validateRegistryComparisons(invalidRegistry);
  if (!invalidResult.valid && invalidResult.stats.invalid_comparisons === 1) {
    results.push('PASS: Test 16 - Registry with invalid comparison rejected');
  } else {
    results.push('FAIL: Test 16 - Registry with invalid comparison should be rejected');
    allPassed = false;
  }

  // Test 17: Comparison with 3+ entities validates
  const threeEntities = validateComparisonEntry(
    'multi-compare',
    'comparison',
    false,
    undefined,
    ['binance', 'okx', 'gate'],
    existingIds,
    typeMap
  );
  if (threeEntities.valid) {
    results.push('PASS: Test 17 - Comparison with 3 entities validates');
  } else {
    results.push('FAIL: Test 17 - Comparison with 3 entities should validate');
    allPassed = false;
  }

  // Test 18: Stats calculation
  const statsRegistry = {
    entries: [
      { id: 'binance', type: 'entity' as PageType, cr_required: true },
      { id: 'okx', type: 'entity' as PageType, cr_required: true },
      { id: 'gate', type: 'entity' as PageType, cr_required: true },
      { id: 'comp1', type: 'comparison' as PageType, cr_required: false, entities: ['binance', 'okx'] },
      { id: 'comp2', type: 'comparison' as PageType, cr_required: false, entities: ['okx', 'gate'] }
    ]
  };
  const statsResult = validateRegistryComparisons(statsRegistry);
  if (statsResult.stats.comparison_pages === 2 && statsResult.stats.total_entity_refs === 4) {
    results.push('PASS: Test 18 - Stats calculated correctly');
  } else {
    results.push('FAIL: Test 18 - Stats should be calculated correctly');
    allPassed = false;
  }

  // Test 19: Duplicate comparison warning
  const dupCompRegistry = {
    entries: [
      { id: 'binance', type: 'entity' as PageType, cr_required: true },
      { id: 'okx', type: 'entity' as PageType, cr_required: true },
      { id: 'comp1', type: 'comparison' as PageType, cr_required: false, entities: ['binance', 'okx'] },
      { id: 'comp2', type: 'comparison' as PageType, cr_required: false, entities: ['okx', 'binance'] }
    ]
  };
  const dupResult = validateRegistryComparisons(dupCompRegistry);
  if (dupResult.warnings.some(w => w.includes('Duplicate comparison'))) {
    results.push('PASS: Test 19 - Duplicate comparison triggers warning');
  } else {
    results.push('FAIL: Test 19 - Duplicate comparison should trigger warning');
    allPassed = false;
  }

  // Test 20: Load actual registry.json
  const loadResult = loadAndValidateRegistryComparisons();
  if (loadResult.valid) {
    results.push('PASS: Test 20 - registry.json comparisons validate');
    results.push(`  Comparison pages: ${loadResult.stats.comparison_pages}`);
  } else if (loadResult.stats.total_entries === 0) {
    results.push('PASS: Test 20 - Empty registry.json validates');
  } else {
    results.push('FAIL: Test 20 - registry.json comparisons should validate');
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
  console.log('CI Check: Comparison Page Validation');
  console.log('='.repeat(50));

  const result = loadAndValidateRegistryComparisons(registryPath);

  console.log(`\nTotal entries: ${result.stats.total_entries}`);
  console.log(`Comparison pages: ${result.stats.comparison_pages}`);
  console.log(`Valid comparisons: ${result.stats.valid_comparisons}`);
  console.log(`Invalid comparisons: ${result.stats.invalid_comparisons}`);
  console.log(`Total entity refs: ${result.stats.total_entity_refs}`);
  console.log(`Missing entity refs: ${result.stats.missing_entity_refs}`);
  console.log(`Invalid type refs: ${result.stats.invalid_entity_type_refs}`);

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
    console.log('RESULT: PASS - All comparison pages are valid');
  } else {
    console.log('RESULT: FAIL - Comparison validation errors found');
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
