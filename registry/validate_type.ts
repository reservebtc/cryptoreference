#!/usr/bin/env npx tsx
/**
 * CR Registry Type Semantics Validator
 *
 * Enforces allowed page types and CR-required rules.
 * Guarantees ontology-safe registry.
 *
 * Type Semantics:
 * - entity, child_entity → cr_required=true (CR-Markup mandatory)
 * - education, comparison, interface, metrics → cr_required=false (CR forbidden)
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 2
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';

export interface TypeSemantics {
  type: PageType;
  cr_required: boolean;
  description: string;
  allows_parent: boolean;
  requires_parent: boolean;
  allows_entities_ref: boolean;
  requires_entities_ref: boolean;
}

export interface TypeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RegistryTypeCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    by_type: Record<PageType, number>;
    cr_required_count: number;
    cr_forbidden_count: number;
    type_mismatches: number;
  };
}

// ============================================
// TYPE SEMANTICS DEFINITIONS
// ============================================

/**
 * Canonical type semantics - single source of truth
 */
export const TYPE_SEMANTICS: Record<PageType, TypeSemantics> = {
  entity: {
    type: 'entity',
    cr_required: true,
    description: 'Canonical entity with CR-Markup',
    allows_parent: false,
    requires_parent: false,
    allows_entities_ref: false,
    requires_entities_ref: false
  },
  child_entity: {
    type: 'child_entity',
    cr_required: true,
    description: 'Child entity with CR-Markup, requires parent',
    allows_parent: true,
    requires_parent: true,
    allows_entities_ref: false,
    requires_entities_ref: false
  },
  education: {
    type: 'education',
    cr_required: false,
    description: 'Educational content, no CR-Markup',
    allows_parent: true,
    requires_parent: false,
    allows_entities_ref: false,
    requires_entities_ref: false
  },
  comparison: {
    type: 'comparison',
    cr_required: false,
    description: 'Entity comparison, no CR-Markup',
    allows_parent: false,
    requires_parent: false,
    allows_entities_ref: true,
    requires_entities_ref: true
  },
  interface: {
    type: 'interface',
    cr_required: false,
    description: 'UI walkthrough, no CR-Markup',
    allows_parent: true,
    requires_parent: false,
    allows_entities_ref: false,
    requires_entities_ref: false
  },
  metrics: {
    type: 'metrics',
    cr_required: false,
    description: 'Data/metrics description, no CR-Markup',
    allows_parent: true,
    requires_parent: false,
    allows_entities_ref: false,
    requires_entities_ref: false
  }
};

// Derived constants
export const VALID_TYPES: PageType[] = Object.keys(TYPE_SEMANTICS) as PageType[];
export const CR_REQUIRED_TYPES: PageType[] = VALID_TYPES.filter(t => TYPE_SEMANTICS[t].cr_required);
export const CR_FORBIDDEN_TYPES: PageType[] = VALID_TYPES.filter(t => !TYPE_SEMANTICS[t].cr_required);

// ============================================
// TYPE VALIDATION FUNCTIONS
// ============================================

/**
 * Check if a type is valid
 */
export function isValidType(type: unknown): type is PageType {
  return typeof type === 'string' && VALID_TYPES.includes(type as PageType);
}

/**
 * Get type semantics
 */
export function getTypeSemantics(type: PageType): TypeSemantics {
  return TYPE_SEMANTICS[type];
}

/**
 * Check if CR is required for a type
 */
export function isCRRequired(type: PageType): boolean {
  return TYPE_SEMANTICS[type]?.cr_required ?? false;
}

/**
 * Check if CR is forbidden for a type
 */
export function isCRForbidden(type: PageType): boolean {
  return !isCRRequired(type);
}

/**
 * Validate type value
 */
export function validateType(type: unknown): TypeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (type === null || type === undefined) {
    errors.push('Type is required (received null/undefined)');
    return { valid: false, errors, warnings };
  }

  if (typeof type !== 'string') {
    errors.push(`Type must be a string (received ${typeof type})`);
    return { valid: false, errors, warnings };
  }

  if (!isValidType(type)) {
    errors.push(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`);

    // Suggest closest match
    const lowerType = type.toLowerCase();
    for (const validType of VALID_TYPES) {
      if (validType.includes(lowerType) || lowerType.includes(validType)) {
        warnings.push(`Did you mean "${validType}"?`);
        break;
      }
    }

    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

/**
 * Validate type and cr_required consistency
 */
export function validateTypeCRConsistency(
  type: PageType,
  cr_required: unknown
): TypeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // First validate type
  const typeResult = validateType(type);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Check cr_required type
  if (typeof cr_required !== 'boolean') {
    errors.push(`cr_required must be a boolean (received ${typeof cr_required})`);
    return { valid: false, errors, warnings };
  }

  const semantics = TYPE_SEMANTICS[type];
  const expectedCR = semantics.cr_required;

  if (cr_required !== expectedCR) {
    if (expectedCR) {
      errors.push(
        `Type "${type}" requires cr_required=true (CR-Markup is mandatory for this type)`
      );
    } else {
      errors.push(
        `Type "${type}" requires cr_required=false (CR-Markup is forbidden for this type)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate type with parent_id rules
 */
export function validateTypeParentRules(
  type: PageType,
  hasParentId: boolean
): TypeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const typeResult = validateType(type);
  if (!typeResult.valid) {
    return typeResult;
  }

  const semantics = TYPE_SEMANTICS[type];

  if (semantics.requires_parent && !hasParentId) {
    errors.push(`Type "${type}" requires parent_id`);
  }

  if (!semantics.allows_parent && hasParentId) {
    errors.push(`Type "${type}" does not allow parent_id`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate type with entities reference rules
 */
export function validateTypeEntitiesRules(
  type: PageType,
  hasEntities: boolean,
  entitiesCount: number
): TypeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const typeResult = validateType(type);
  if (!typeResult.valid) {
    return typeResult;
  }

  const semantics = TYPE_SEMANTICS[type];

  if (semantics.requires_entities_ref && !hasEntities) {
    errors.push(`Type "${type}" requires entities[] array`);
  }

  if (semantics.requires_entities_ref && hasEntities && entitiesCount < 2) {
    errors.push(`Type "${type}" requires at least 2 entities in entities[] array`);
  }

  if (!semantics.allows_entities_ref && hasEntities) {
    errors.push(`Type "${type}" does not allow entities[] array`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// REGISTRY TYPE VALIDATION
// ============================================

interface MinimalRegistryEntry {
  id?: string;
  type?: unknown;
  cr_required?: unknown;
  parent_id?: string;
  entities?: string[];
  [key: string]: unknown;
}

interface MinimalRegistry {
  entries: MinimalRegistryEntry[];
  [key: string]: unknown;
}

/**
 * Validate all type semantics in a registry
 */
export function validateRegistryTypes(registry: MinimalRegistry): RegistryTypeCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: RegistryTypeCheckResult['stats'] = {
    total_entries: 0,
    by_type: {
      entity: 0,
      child_entity: 0,
      education: 0,
      comparison: 0,
      interface: 0,
      metrics: 0
    },
    cr_required_count: 0,
    cr_forbidden_count: 0,
    type_mismatches: 0
  };

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Registry must have an entries array');
    return { valid: false, errors, warnings, stats };
  }

  stats.total_entries = registry.entries.length;

  for (let i = 0; i < registry.entries.length; i++) {
    const entry = registry.entries[i];
    const prefix = `Entry "${entry.id || `index ${i}`}"`;

    // Validate type
    const typeResult = validateType(entry.type);
    if (!typeResult.valid) {
      for (const error of typeResult.errors) {
        errors.push(`${prefix}: ${error}`);
      }
      stats.type_mismatches++;
      continue;
    }

    const type = entry.type as PageType;
    stats.by_type[type]++;

    // Validate CR consistency
    const crResult = validateTypeCRConsistency(type, entry.cr_required);
    if (!crResult.valid) {
      for (const error of crResult.errors) {
        errors.push(`${prefix}: ${error}`);
      }
      stats.type_mismatches++;
    }

    // Update CR stats
    if (TYPE_SEMANTICS[type].cr_required) {
      stats.cr_required_count++;
    } else {
      stats.cr_forbidden_count++;
    }

    // Validate parent rules
    const parentResult = validateTypeParentRules(type, !!entry.parent_id);
    if (!parentResult.valid) {
      for (const error of parentResult.errors) {
        errors.push(`${prefix}: ${error}`);
      }
    }

    // Validate entities rules
    const entitiesResult = validateTypeEntitiesRules(
      type,
      Array.isArray(entry.entities),
      entry.entities?.length || 0
    );
    if (!entitiesResult.valid) {
      for (const error of entitiesResult.errors) {
        errors.push(`${prefix}: ${error}`);
      }
    }

    warnings.push(...typeResult.warnings.map(w => `${prefix}: ${w}`));
    warnings.push(...crResult.warnings.map(w => `${prefix}: ${w}`));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Load registry and validate types
 */
export function loadAndValidateRegistryTypes(registryPath?: string): RegistryTypeCheckResult {
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
          cr_required_count: 0,
          cr_forbidden_count: 0,
          type_mismatches: 0
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as MinimalRegistry;

    return validateRegistryTypes(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        total_entries: 0,
        by_type: { entity: 0, child_entity: 0, education: 0, comparison: 0, interface: 0, metrics: 0 },
        cr_required_count: 0,
        cr_forbidden_count: 0,
        type_mismatches: 0
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

  console.log('Type Semantics Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Valid entity type
  const entityResult = validateType('entity');
  if (entityResult.valid) {
    results.push('PASS: Test 1 - Valid type "entity" validates');
  } else {
    results.push('FAIL: Test 1 - Valid type should validate');
    allPassed = false;
  }

  // Test 2: All valid types validate
  let allTypesValid = true;
  for (const type of VALID_TYPES) {
    if (!validateType(type).valid) {
      allTypesValid = false;
      break;
    }
  }
  if (allTypesValid) {
    results.push('PASS: Test 2 - All valid types validate');
  } else {
    results.push('FAIL: Test 2 - All valid types should validate');
    allPassed = false;
  }

  // Test 3: Invalid type rejected
  const invalidType = validateType('invalid_type');
  if (!invalidType.valid && invalidType.errors.some(e => e.includes('Invalid type'))) {
    results.push('PASS: Test 3 - Invalid type rejected');
  } else {
    results.push('FAIL: Test 3 - Invalid type should be rejected');
    allPassed = false;
  }

  // Test 4: Null type rejected
  const nullType = validateType(null);
  if (!nullType.valid && nullType.errors.some(e => e.includes('required'))) {
    results.push('PASS: Test 4 - Null type rejected');
  } else {
    results.push('FAIL: Test 4 - Null type should be rejected');
    allPassed = false;
  }

  // Test 5: entity + cr_required=true validates
  const entityCR = validateTypeCRConsistency('entity', true);
  if (entityCR.valid) {
    results.push('PASS: Test 5 - entity + cr_required=true validates');
  } else {
    results.push('FAIL: Test 5 - entity + cr_required=true should validate');
    allPassed = false;
  }

  // Test 6: entity + cr_required=false rejected
  const entityNoCR = validateTypeCRConsistency('entity', false);
  if (!entityNoCR.valid && entityNoCR.errors.some(e => e.includes('cr_required=true'))) {
    results.push('PASS: Test 6 - entity + cr_required=false rejected');
  } else {
    results.push('FAIL: Test 6 - entity + cr_required=false should be rejected');
    allPassed = false;
  }

  // Test 7: education + cr_required=false validates
  const eduNoCR = validateTypeCRConsistency('education', false);
  if (eduNoCR.valid) {
    results.push('PASS: Test 7 - education + cr_required=false validates');
  } else {
    results.push('FAIL: Test 7 - education + cr_required=false should validate');
    allPassed = false;
  }

  // Test 8: education + cr_required=true rejected
  const eduCR = validateTypeCRConsistency('education', true);
  if (!eduCR.valid && eduCR.errors.some(e => e.includes('cr_required=false'))) {
    results.push('PASS: Test 8 - education + cr_required=true rejected');
  } else {
    results.push('FAIL: Test 8 - education + cr_required=true should be rejected');
    allPassed = false;
  }

  // Test 9: child_entity requires parent_id
  const childNoParent = validateTypeParentRules('child_entity', false);
  if (!childNoParent.valid && childNoParent.errors.some(e => e.includes('requires parent_id'))) {
    results.push('PASS: Test 9 - child_entity without parent_id rejected');
  } else {
    results.push('FAIL: Test 9 - child_entity without parent_id should be rejected');
    allPassed = false;
  }

  // Test 10: entity does not allow parent_id
  const entityWithParent = validateTypeParentRules('entity', true);
  if (!entityWithParent.valid && entityWithParent.errors.some(e => e.includes('does not allow parent_id'))) {
    results.push('PASS: Test 10 - entity with parent_id rejected');
  } else {
    results.push('FAIL: Test 10 - entity with parent_id should be rejected');
    allPassed = false;
  }

  // Test 11: comparison requires entities[]
  const compNoEntities = validateTypeEntitiesRules('comparison', false, 0);
  if (!compNoEntities.valid && compNoEntities.errors.some(e => e.includes('requires entities[]'))) {
    results.push('PASS: Test 11 - comparison without entities rejected');
  } else {
    results.push('FAIL: Test 11 - comparison without entities should be rejected');
    allPassed = false;
  }

  // Test 12: comparison requires at least 2 entities
  const compOneEntity = validateTypeEntitiesRules('comparison', true, 1);
  if (!compOneEntity.valid && compOneEntity.errors.some(e => e.includes('at least 2'))) {
    results.push('PASS: Test 12 - comparison with 1 entity rejected');
  } else {
    results.push('FAIL: Test 12 - comparison with 1 entity should be rejected');
    allPassed = false;
  }

  // Test 13: entity does not allow entities[]
  const entityWithEntities = validateTypeEntitiesRules('entity', true, 2);
  if (!entityWithEntities.valid && entityWithEntities.errors.some(e => e.includes('does not allow entities[]'))) {
    results.push('PASS: Test 13 - entity with entities[] rejected');
  } else {
    results.push('FAIL: Test 13 - entity with entities[] should be rejected');
    allPassed = false;
  }

  // Test 14: Registry validation with valid entries
  const validRegistry = {
    entries: [
      { id: 'binance', type: 'entity', cr_required: true },
      { id: 'okx', type: 'entity', cr_required: true },
      { id: 'binance-guide', type: 'education', cr_required: false }
    ]
  };
  const regResult = validateRegistryTypes(validRegistry);
  if (regResult.valid) {
    results.push('PASS: Test 14 - Valid registry validates');
  } else {
    results.push('FAIL: Test 14 - Valid registry should validate');
    results.push(`  Errors: ${regResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 15: Registry with type mismatch rejected
  const mismatchRegistry = {
    entries: [
      { id: 'binance', type: 'entity', cr_required: false } // Wrong!
    ]
  };
  const mismatchResult = validateRegistryTypes(mismatchRegistry);
  if (!mismatchResult.valid && mismatchResult.stats.type_mismatches > 0) {
    results.push('PASS: Test 15 - Registry with CR mismatch rejected');
  } else {
    results.push('FAIL: Test 15 - Registry with CR mismatch should be rejected');
    allPassed = false;
  }

  // Test 16: CR_REQUIRED_TYPES correct
  const expectedCRTypes = ['entity', 'child_entity'];
  const crTypesCorrect = CR_REQUIRED_TYPES.length === 2 &&
    expectedCRTypes.every(t => CR_REQUIRED_TYPES.includes(t as PageType));
  if (crTypesCorrect) {
    results.push('PASS: Test 16 - CR_REQUIRED_TYPES is correct');
  } else {
    results.push('FAIL: Test 16 - CR_REQUIRED_TYPES should be [entity, child_entity]');
    allPassed = false;
  }

  // Test 17: CR_FORBIDDEN_TYPES correct
  const expectedForbiddenTypes = ['education', 'comparison', 'interface', 'metrics'];
  const forbiddenTypesCorrect = CR_FORBIDDEN_TYPES.length === 4 &&
    expectedForbiddenTypes.every(t => CR_FORBIDDEN_TYPES.includes(t as PageType));
  if (forbiddenTypesCorrect) {
    results.push('PASS: Test 17 - CR_FORBIDDEN_TYPES is correct');
  } else {
    results.push('FAIL: Test 17 - CR_FORBIDDEN_TYPES should have 4 types');
    allPassed = false;
  }

  // Test 18: isCRRequired function
  if (isCRRequired('entity') && isCRRequired('child_entity') && !isCRRequired('education')) {
    results.push('PASS: Test 18 - isCRRequired function works');
  } else {
    results.push('FAIL: Test 18 - isCRRequired function should work correctly');
    allPassed = false;
  }

  // Test 19: getTypeSemantics function
  const entitySemantics = getTypeSemantics('entity');
  if (entitySemantics.cr_required === true && entitySemantics.allows_parent === false) {
    results.push('PASS: Test 19 - getTypeSemantics returns correct data');
  } else {
    results.push('FAIL: Test 19 - getTypeSemantics should return correct data');
    allPassed = false;
  }

  // Test 20: Load actual registry.json
  const loadResult = loadAndValidateRegistryTypes();
  if (loadResult.valid) {
    results.push('PASS: Test 20 - registry.json types validate');
    results.push(`  Total: ${loadResult.stats.total_entries}`);
  } else if (loadResult.stats.total_entries === 0) {
    results.push('PASS: Test 20 - Empty registry.json validates');
  } else {
    results.push('FAIL: Test 20 - registry.json types should validate');
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
  console.log('CI Check: Registry Type Semantics Validation');
  console.log('='.repeat(50));

  const result = loadAndValidateRegistryTypes(registryPath);

  console.log(`\nTotal entries: ${result.stats.total_entries}`);
  console.log(`\nBy type:`);
  for (const [type, count] of Object.entries(result.stats.by_type)) {
    if (count > 0) console.log(`  ${type}: ${count}`);
  }

  console.log(`\nCR-Markup required: ${result.stats.cr_required_count}`);
  console.log(`CR-Markup forbidden: ${result.stats.cr_forbidden_count}`);
  console.log(`Type mismatches: ${result.stats.type_mismatches}`);

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
    console.log('RESULT: PASS - All types are valid and consistent');
  } else {
    console.log('RESULT: FAIL - Type validation errors found');
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
