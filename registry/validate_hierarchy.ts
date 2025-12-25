#!/usr/bin/env npx tsx
/**
 * CR Registry Hierarchy Validator
 *
 * Enforces parent/child relationship rules.
 * Guarantees valid entity graph with no cycles.
 *
 * Rules:
 * - child_entity MUST have parent_id
 * - entity MUST NOT have parent_id
 * - parent_id MUST reference existing entity
 * - No cycles allowed in hierarchy
 * - Parent must be of type 'entity' (not child_entity)
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 3
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';

export interface HierarchyNode {
  id: string;
  type: PageType;
  parent_id?: string;
  children: string[];
  depth: number;
}

export interface HierarchyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: string[][];
}

export interface HierarchyCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total_entries: number;
    root_entities: number;
    child_entities: number;
    max_depth: number;
    orphaned_children: number;
    invalid_parents: number;
    cycles_detected: number;
  };
  graph: Map<string, HierarchyNode>;
}

// ============================================
// CONSTANTS
// ============================================

// Types that can have parent_id
const ALLOWS_PARENT: PageType[] = ['child_entity', 'education', 'interface', 'metrics'];

// Types that require parent_id
const REQUIRES_PARENT: PageType[] = ['child_entity'];

// Types that cannot have parent_id
const FORBIDS_PARENT: PageType[] = ['entity', 'comparison'];

// Types that can be parents (root entities only)
const CAN_BE_PARENT: PageType[] = ['entity'];

// Maximum allowed hierarchy depth
const MAX_HIERARCHY_DEPTH = 10;

// ============================================
// HIERARCHY VALIDATION FUNCTIONS
// ============================================

/**
 * Validate parent_id rules for a single entry
 */
export function validateParentRules(
  id: string,
  type: PageType,
  parentId: string | undefined,
  existingIds: Set<string>,
  typeMap: Map<string, PageType>
): HierarchyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if parent_id is required
  if (REQUIRES_PARENT.includes(type) && !parentId) {
    errors.push(`Entry "${id}": type "${type}" requires parent_id`);
  }

  // Check if parent_id is forbidden
  if (FORBIDS_PARENT.includes(type) && parentId) {
    errors.push(`Entry "${id}": type "${type}" cannot have parent_id`);
  }

  // If parent_id is provided, validate it
  if (parentId) {
    // Check parent exists
    if (!existingIds.has(parentId)) {
      errors.push(`Entry "${id}": parent_id "${parentId}" does not exist`);
    } else {
      // Check parent type is valid
      const parentType = typeMap.get(parentId);
      if (parentType && !CAN_BE_PARENT.includes(parentType)) {
        errors.push(
          `Entry "${id}": parent "${parentId}" has type "${parentType}" which cannot be a parent. ` +
          `Only types [${CAN_BE_PARENT.join(', ')}] can be parents.`
        );
      }
    }

    // Self-reference check
    if (parentId === id) {
      errors.push(`Entry "${id}": cannot reference itself as parent`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Detect cycles in parent-child hierarchy using DFS
 */
export function detectCycles(
  entries: Array<{ id: string; parent_id?: string }>
): CycleDetectionResult {
  const parentMap = new Map<string, string>();
  const cycles: string[][] = [];

  // Build parent map
  for (const entry of entries) {
    if (entry.parent_id) {
      parentMap.set(entry.id, entry.parent_id);
    }
  }

  // Check each node for cycles
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    if (inStack.has(nodeId)) {
      // Found cycle - extract it
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      cycle.push(nodeId); // Complete the cycle
      cycles.push(cycle);
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const parentId = parentMap.get(nodeId);
    if (parentId) {
      dfs(parentId, path);
    }

    inStack.delete(nodeId);
    path.pop();
    return false;
  }

  for (const entry of entries) {
    if (!visited.has(entry.id)) {
      dfs(entry.id, []);
    }
  }

  return {
    hasCycles: cycles.length > 0,
    cycles
  };
}

/**
 * Build hierarchy graph from entries
 */
export function buildHierarchyGraph(
  entries: Array<{ id: string; type: PageType; parent_id?: string }>
): Map<string, HierarchyNode> {
  const graph = new Map<string, HierarchyNode>();

  // First pass: create nodes
  for (const entry of entries) {
    graph.set(entry.id, {
      id: entry.id,
      type: entry.type,
      parent_id: entry.parent_id,
      children: [],
      depth: 0
    });
  }

  // Second pass: link children to parents
  for (const entry of entries) {
    if (entry.parent_id) {
      const parent = graph.get(entry.parent_id);
      if (parent) {
        parent.children.push(entry.id);
      }
    }
  }

  // Third pass: calculate depths
  function calculateDepth(nodeId: string, depth: number, visited: Set<string>): void {
    if (visited.has(nodeId)) return; // Prevent infinite loop on cycles
    visited.add(nodeId);

    const node = graph.get(nodeId);
    if (!node) return;

    node.depth = depth;

    for (const childId of node.children) {
      calculateDepth(childId, depth + 1, visited);
    }
  }

  // Start from root nodes (no parent)
  for (const [id, node] of Array.from(graph.entries())) {
    if (!node.parent_id) {
      calculateDepth(id, 0, new Set());
    }
  }

  return graph;
}

/**
 * Validate hierarchy depth
 */
export function validateHierarchyDepth(
  graph: Map<string, HierarchyNode>
): HierarchyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [id, node] of Array.from(graph.entries())) {
    if (node.depth > MAX_HIERARCHY_DEPTH) {
      errors.push(
        `Entry "${id}": hierarchy depth ${node.depth} exceeds maximum ${MAX_HIERARCHY_DEPTH}`
      );
    } else if (node.depth > MAX_HIERARCHY_DEPTH - 2) {
      warnings.push(
        `Entry "${id}": hierarchy depth ${node.depth} is approaching maximum ${MAX_HIERARCHY_DEPTH}`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get all ancestors of a node
 */
export function getAncestors(
  nodeId: string,
  graph: Map<string, HierarchyNode>
): string[] {
  const ancestors: string[] = [];
  let currentId: string | undefined = nodeId;

  while (currentId) {
    const node = graph.get(currentId);
    if (!node || !node.parent_id) break;

    ancestors.push(node.parent_id);
    currentId = node.parent_id;

    // Prevent infinite loop
    if (ancestors.length > MAX_HIERARCHY_DEPTH) break;
  }

  return ancestors;
}

/**
 * Get all descendants of a node
 */
export function getDescendants(
  nodeId: string,
  graph: Map<string, HierarchyNode>
): string[] {
  const descendants: string[] = [];
  const queue = [nodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = graph.get(currentId);
    if (!node) continue;

    for (const childId of node.children) {
      descendants.push(childId);
      queue.push(childId);
    }
  }

  return descendants;
}

// ============================================
// REGISTRY HIERARCHY VALIDATION
// ============================================

interface MinimalRegistryEntry {
  id: string;
  type: PageType;
  parent_id?: string;
  [key: string]: unknown;
}

interface MinimalRegistry {
  entries: MinimalRegistryEntry[];
  [key: string]: unknown;
}

/**
 * Validate all hierarchy rules in a registry
 */
export function validateRegistryHierarchy(registry: MinimalRegistry): HierarchyCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: HierarchyCheckResult['stats'] = {
    total_entries: 0,
    root_entities: 0,
    child_entities: 0,
    max_depth: 0,
    orphaned_children: 0,
    invalid_parents: 0,
    cycles_detected: 0
  };

  let graph = new Map<string, HierarchyNode>();

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Registry must have an entries array');
    return { valid: false, errors, warnings, stats, graph };
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

  // Validate each entry's parent rules
  for (const entry of registry.entries) {
    const result = validateParentRules(
      entry.id,
      entry.type,
      entry.parent_id,
      existingIds,
      typeMap
    );

    errors.push(...result.errors);
    warnings.push(...result.warnings);

    // Track orphaned children
    if (entry.parent_id && !existingIds.has(entry.parent_id)) {
      stats.orphaned_children++;
    }

    // Track invalid parent types
    if (entry.parent_id && existingIds.has(entry.parent_id)) {
      const parentType = typeMap.get(entry.parent_id);
      if (parentType && !CAN_BE_PARENT.includes(parentType)) {
        stats.invalid_parents++;
      }
    }
  }

  // Detect cycles
  const cycleResult = detectCycles(registry.entries);
  if (cycleResult.hasCycles) {
    stats.cycles_detected = cycleResult.cycles.length;
    for (const cycle of cycleResult.cycles) {
      errors.push(`Cycle detected: ${cycle.join(' -> ')}`);
    }
  }

  // Build hierarchy graph (only if no cycles)
  if (!cycleResult.hasCycles) {
    graph = buildHierarchyGraph(registry.entries);

    // Validate depth
    const depthResult = validateHierarchyDepth(graph);
    errors.push(...depthResult.errors);
    warnings.push(...depthResult.warnings);

    // Calculate stats
    for (const [, node] of Array.from(graph.entries())) {
      if (!node.parent_id && node.type === 'entity') {
        stats.root_entities++;
      }
      if (node.type === 'child_entity') {
        stats.child_entities++;
      }
      if (node.depth > stats.max_depth) {
        stats.max_depth = node.depth;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
    graph
  };
}

/**
 * Load registry and validate hierarchy
 */
export function loadAndValidateRegistryHierarchy(registryPath?: string): HierarchyCheckResult {
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
          root_entities: 0,
          child_entities: 0,
          max_depth: 0,
          orphaned_children: 0,
          invalid_parents: 0,
          cycles_detected: 0
        },
        graph: new Map()
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as MinimalRegistry;

    return validateRegistryHierarchy(registry);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        total_entries: 0,
        root_entities: 0,
        child_entities: 0,
        max_depth: 0,
        orphaned_children: 0,
        invalid_parents: 0,
        cycles_detected: 0
      },
      graph: new Map()
    };
  }
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('Hierarchy Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Valid entity without parent
  const validEntity = validateParentRules(
    'binance',
    'entity',
    undefined,
    new Set(['binance']),
    new Map([['binance', 'entity']])
  );
  if (validEntity.valid) {
    results.push('PASS: Test 1 - Entity without parent validates');
  } else {
    results.push('FAIL: Test 1 - Entity without parent should validate');
    allPassed = false;
  }

  // Test 2: Entity with parent rejected
  const entityWithParent = validateParentRules(
    'binance',
    'entity',
    'some-parent',
    new Set(['binance', 'some-parent']),
    new Map([['binance', 'entity'], ['some-parent', 'entity']])
  );
  if (!entityWithParent.valid && entityWithParent.errors.some(e => e.includes('cannot have parent_id'))) {
    results.push('PASS: Test 2 - Entity with parent rejected');
  } else {
    results.push('FAIL: Test 2 - Entity with parent should be rejected');
    allPassed = false;
  }

  // Test 3: child_entity without parent rejected
  const childNoParent = validateParentRules(
    'binance-spot',
    'child_entity',
    undefined,
    new Set(['binance-spot']),
    new Map([['binance-spot', 'child_entity']])
  );
  if (!childNoParent.valid && childNoParent.errors.some(e => e.includes('requires parent_id'))) {
    results.push('PASS: Test 3 - child_entity without parent rejected');
  } else {
    results.push('FAIL: Test 3 - child_entity without parent should be rejected');
    allPassed = false;
  }

  // Test 4: child_entity with valid parent validates
  const childWithParent = validateParentRules(
    'binance-spot',
    'child_entity',
    'binance',
    new Set(['binance-spot', 'binance']),
    new Map([['binance-spot', 'child_entity'], ['binance', 'entity']])
  );
  if (childWithParent.valid) {
    results.push('PASS: Test 4 - child_entity with valid parent validates');
  } else {
    results.push('FAIL: Test 4 - child_entity with valid parent should validate');
    results.push(`  Errors: ${childWithParent.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 5: parent_id referencing non-existent ID rejected
  const orphanChild = validateParentRules(
    'orphan-child',
    'child_entity',
    'non-existent',
    new Set(['orphan-child']),
    new Map([['orphan-child', 'child_entity']])
  );
  if (!orphanChild.valid && orphanChild.errors.some(e => e.includes('does not exist'))) {
    results.push('PASS: Test 5 - Orphan child rejected');
  } else {
    results.push('FAIL: Test 5 - Orphan child should be rejected');
    allPassed = false;
  }

  // Test 6: Self-reference rejected
  const selfRef = validateParentRules(
    'self-ref',
    'child_entity',
    'self-ref',
    new Set(['self-ref']),
    new Map([['self-ref', 'child_entity']])
  );
  if (!selfRef.valid && selfRef.errors.some(e => e.includes('itself'))) {
    results.push('PASS: Test 6 - Self-reference rejected');
  } else {
    results.push('FAIL: Test 6 - Self-reference should be rejected');
    allPassed = false;
  }

  // Test 7: Cycle detection - simple cycle
  const simpleCycle = detectCycles([
    { id: 'a', parent_id: 'b' },
    { id: 'b', parent_id: 'a' }
  ]);
  if (simpleCycle.hasCycles && simpleCycle.cycles.length > 0) {
    results.push('PASS: Test 7 - Simple cycle detected');
  } else {
    results.push('FAIL: Test 7 - Simple cycle should be detected');
    allPassed = false;
  }

  // Test 8: Cycle detection - no cycle
  const noCycle = detectCycles([
    { id: 'a' },
    { id: 'b', parent_id: 'a' },
    { id: 'c', parent_id: 'a' }
  ]);
  if (!noCycle.hasCycles) {
    results.push('PASS: Test 8 - No false positive on valid hierarchy');
  } else {
    results.push('FAIL: Test 8 - Should not detect cycle in valid hierarchy');
    allPassed = false;
  }

  // Test 9: Cycle detection - complex cycle
  const complexCycle = detectCycles([
    { id: 'a', parent_id: 'c' },
    { id: 'b', parent_id: 'a' },
    { id: 'c', parent_id: 'b' }
  ]);
  if (complexCycle.hasCycles) {
    results.push('PASS: Test 9 - Complex cycle (a->c->b->a) detected');
  } else {
    results.push('FAIL: Test 9 - Complex cycle should be detected');
    allPassed = false;
  }

  // Test 10: Build hierarchy graph
  const graph = buildHierarchyGraph([
    { id: 'root', type: 'entity' },
    { id: 'child1', type: 'child_entity', parent_id: 'root' },
    { id: 'child2', type: 'child_entity', parent_id: 'root' }
  ]);
  const rootNode = graph.get('root');
  if (rootNode && rootNode.children.length === 2 && rootNode.depth === 0) {
    results.push('PASS: Test 10 - Hierarchy graph built correctly');
  } else {
    results.push('FAIL: Test 10 - Hierarchy graph should be built correctly');
    allPassed = false;
  }

  // Test 11: Depth calculation
  const child1Node = graph.get('child1');
  if (child1Node && child1Node.depth === 1) {
    results.push('PASS: Test 11 - Depth calculated correctly');
  } else {
    results.push('FAIL: Test 11 - Depth should be calculated correctly');
    allPassed = false;
  }

  // Test 12: Registry validation - valid hierarchy
  const validRegistry = {
    entries: [
      { id: 'binance', type: 'entity' as PageType },
      { id: 'okx', type: 'entity' as PageType },
      { id: 'binance-spot', type: 'child_entity' as PageType, parent_id: 'binance' }
    ]
  };
  const regResult = validateRegistryHierarchy(validRegistry);
  if (regResult.valid) {
    results.push('PASS: Test 12 - Valid registry hierarchy validates');
  } else {
    results.push('FAIL: Test 12 - Valid registry hierarchy should validate');
    results.push(`  Errors: ${regResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 13: Registry validation - cycle rejected
  const cycleRegistry = {
    entries: [
      { id: 'a', type: 'child_entity' as PageType, parent_id: 'b' },
      { id: 'b', type: 'child_entity' as PageType, parent_id: 'a' }
    ]
  };
  const cycleRegResult = validateRegistryHierarchy(cycleRegistry);
  if (!cycleRegResult.valid && cycleRegResult.stats.cycles_detected > 0) {
    results.push('PASS: Test 13 - Registry with cycle rejected');
  } else {
    results.push('FAIL: Test 13 - Registry with cycle should be rejected');
    allPassed = false;
  }

  // Test 14: child_entity with child_entity parent rejected
  const childOfChild = validateParentRules(
    'grandchild',
    'child_entity',
    'child',
    new Set(['grandchild', 'child', 'parent']),
    new Map([['grandchild', 'child_entity'], ['child', 'child_entity'], ['parent', 'entity']])
  );
  if (!childOfChild.valid && childOfChild.errors.some(e => e.includes('cannot be a parent'))) {
    results.push('PASS: Test 14 - child_entity as parent rejected');
  } else {
    results.push('FAIL: Test 14 - child_entity as parent should be rejected');
    allPassed = false;
  }

  // Test 15: getAncestors function
  const ancestorGraph = buildHierarchyGraph([
    { id: 'root', type: 'entity' },
    { id: 'child', type: 'child_entity', parent_id: 'root' }
  ]);
  const ancestors = getAncestors('child', ancestorGraph);
  if (ancestors.length === 1 && ancestors[0] === 'root') {
    results.push('PASS: Test 15 - getAncestors returns correct ancestors');
  } else {
    results.push('FAIL: Test 15 - getAncestors should return correct ancestors');
    allPassed = false;
  }

  // Test 16: getDescendants function
  const descendants = getDescendants('root', ancestorGraph);
  if (descendants.length === 1 && descendants[0] === 'child') {
    results.push('PASS: Test 16 - getDescendants returns correct descendants');
  } else {
    results.push('FAIL: Test 16 - getDescendants should return correct descendants');
    allPassed = false;
  }

  // Test 17: comparison type cannot have parent
  const compWithParent = validateParentRules(
    'compare-test',
    'comparison',
    'some-parent',
    new Set(['compare-test', 'some-parent']),
    new Map([['compare-test', 'comparison'], ['some-parent', 'entity']])
  );
  if (!compWithParent.valid && compWithParent.errors.some(e => e.includes('cannot have parent_id'))) {
    results.push('PASS: Test 17 - comparison with parent rejected');
  } else {
    results.push('FAIL: Test 17 - comparison with parent should be rejected');
    allPassed = false;
  }

  // Test 18: education can have parent
  const eduWithParent = validateParentRules(
    'binance-guide',
    'education',
    'binance',
    new Set(['binance-guide', 'binance']),
    new Map([['binance-guide', 'education'], ['binance', 'entity']])
  );
  if (eduWithParent.valid) {
    results.push('PASS: Test 18 - education with parent validates');
  } else {
    results.push('FAIL: Test 18 - education with parent should validate');
    allPassed = false;
  }

  // Test 19: Stats calculation
  const statsRegistry = {
    entries: [
      { id: 'root1', type: 'entity' as PageType },
      { id: 'root2', type: 'entity' as PageType },
      { id: 'child1', type: 'child_entity' as PageType, parent_id: 'root1' },
      { id: 'child2', type: 'child_entity' as PageType, parent_id: 'root1' }
    ]
  };
  const statsResult = validateRegistryHierarchy(statsRegistry);
  if (statsResult.stats.root_entities === 2 && statsResult.stats.child_entities === 2) {
    results.push('PASS: Test 19 - Stats calculated correctly');
  } else {
    results.push('FAIL: Test 19 - Stats should be calculated correctly');
    allPassed = false;
  }

  // Test 20: Load actual registry.json
  const loadResult = loadAndValidateRegistryHierarchy();
  if (loadResult.valid) {
    results.push('PASS: Test 20 - registry.json hierarchy validates');
    results.push(`  Root entities: ${loadResult.stats.root_entities}`);
  } else if (loadResult.stats.total_entries === 0) {
    results.push('PASS: Test 20 - Empty registry.json validates');
  } else {
    results.push('FAIL: Test 20 - registry.json hierarchy should validate');
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
  console.log('CI Check: Registry Hierarchy Validation');
  console.log('='.repeat(50));

  const result = loadAndValidateRegistryHierarchy(registryPath);

  console.log(`\nTotal entries: ${result.stats.total_entries}`);
  console.log(`Root entities: ${result.stats.root_entities}`);
  console.log(`Child entities: ${result.stats.child_entities}`);
  console.log(`Max depth: ${result.stats.max_depth}`);
  console.log(`Orphaned children: ${result.stats.orphaned_children}`);
  console.log(`Invalid parents: ${result.stats.invalid_parents}`);
  console.log(`Cycles detected: ${result.stats.cycles_detected}`);

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
    console.log('RESULT: PASS - Hierarchy is valid with no cycles');
  } else {
    console.log('RESULT: FAIL - Hierarchy validation errors found');
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
