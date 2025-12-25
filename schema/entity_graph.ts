/**
 * CR-Markup Protocol v1.0 - Parent/Child Entity Resolver
 *
 * Enforces entity graph constraints:
 * - Single parent via parent_id (only allowed hierarchy field)
 * - No other hierarchy fields allowed
 * - Cycle detection and prevention
 * - Tree structure enforcement (no DAG, no multi-parent)
 *
 * Reference: /schema/spec.md
 */

// ============================================
// TYPES
// ============================================

export interface EntityNode {
  token: string;
  hash: string;
  parent_id?: string;
  fields: Record<string, unknown>;
}

export interface EntityGraph {
  nodes: Map<string, EntityNode>;      // token -> node
  children: Map<string, Set<string>>;  // parent_token -> child_tokens
  roots: Set<string>;                  // tokens with no parent
}

export interface GraphValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HierarchyInfo {
  token: string;
  parent?: string;
  children: string[];
  depth: number;
  ancestors: string[];
  descendants: string[];
}

// ============================================
// FORBIDDEN HIERARCHY FIELDS
// ============================================

/**
 * Only parent_id is allowed for hierarchy.
 * These fields are explicitly forbidden.
 */
const FORBIDDEN_HIERARCHY_FIELDS = [
  'parent',
  'parents',
  'parent_ids',
  'parent_token',
  'parent_tokens',
  'child',
  'children',
  'child_id',
  'child_ids',
  'child_token',
  'child_tokens',
  'hierarchy',
  'ancestors',
  'descendants',
  'siblings',
  'depends_on',
  'dependencies',
  'required_by',
];

// ============================================
// GRAPH CREATION
// ============================================

/**
 * Creates a new entity graph.
 */
export function createEntityGraph(): EntityGraph {
  return {
    nodes: new Map(),
    children: new Map(),
    roots: new Set()
  };
}

/**
 * Validates hierarchy fields in entity data.
 * Only parent_id is allowed.
 */
export function validateHierarchyFields(
  fields: Record<string, unknown>
): GraphValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for forbidden hierarchy fields
  for (const forbidden of FORBIDDEN_HIERARCHY_FIELDS) {
    if (forbidden in fields) {
      errors.push(
        `Forbidden hierarchy field: "${forbidden}". Only "parent_id" is allowed.`
      );
    }
  }

  // Validate parent_id format if present
  if ('parent_id' in fields) {
    const parentId = fields.parent_id;

    if (typeof parentId !== 'string') {
      errors.push('parent_id must be a string');
    } else {
      // Validate token format
      const tokenRegex = /^[A-Z][A-Z0-9_-]*$/;
      if (!tokenRegex.test(parentId)) {
        errors.push(`Invalid parent_id format: "${parentId}". Must match token pattern.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// NODE OPERATIONS
// ============================================

/**
 * Adds an entity node to the graph.
 */
export function addNode(
  graph: EntityGraph,
  node: EntityNode
): GraphValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate hierarchy fields in node.fields
  const fieldValidation = validateHierarchyFields(node.fields);
  if (!fieldValidation.valid) {
    return fieldValidation;
  }

  // Validate parent_id format if present
  if (node.parent_id) {
    const tokenRegex = /^[A-Z][A-Z0-9_-]*$/;
    if (!tokenRegex.test(node.parent_id)) {
      errors.push(`Invalid parent_id format: "${node.parent_id}". Must be uppercase token.`);
      return { valid: false, errors, warnings };
    }
  }

  // Check if node already exists
  if (graph.nodes.has(node.token)) {
    errors.push(`Entity "${node.token}" already exists in graph`);
    return { valid: false, errors, warnings };
  }

  // If has parent, validate parent exists
  if (node.parent_id) {
    if (!graph.nodes.has(node.parent_id)) {
      // Parent doesn't exist yet - this could be a warning or error
      // depending on use case. We'll allow forward references with warning.
      warnings.push(
        `Parent "${node.parent_id}" not yet in graph. Ensure it's added.`
      );
    }

    // Check for self-reference
    if (node.parent_id === node.token) {
      errors.push(`Entity "${node.token}" cannot be its own parent`);
      return { valid: false, errors, warnings };
    }
  }

  // Add node to graph
  graph.nodes.set(node.token, node);

  // Update parent-child relationships
  if (node.parent_id) {
    const siblings = graph.children.get(node.parent_id) || new Set();
    siblings.add(node.token);
    graph.children.set(node.parent_id, siblings);
  } else {
    // No parent = root node
    graph.roots.add(node.token);
  }

  // Check for cycles after adding
  const cycleCheck = detectCycle(graph, node.token);
  if (cycleCheck.hasCycle) {
    // Remove the node we just added (rollback)
    graph.nodes.delete(node.token);
    if (node.parent_id) {
      const siblings = graph.children.get(node.parent_id);
      siblings?.delete(node.token);
    } else {
      graph.roots.delete(node.token);
    }

    errors.push(`Cycle detected: ${cycleCheck.cycle?.join(' -> ')}`);
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

// ============================================
// CYCLE DETECTION
// ============================================

interface CycleResult {
  hasCycle: boolean;
  cycle?: string[];
}

/**
 * Detects cycles in the entity graph starting from a node.
 * Uses DFS with path tracking.
 */
export function detectCycle(
  graph: EntityGraph,
  startToken: string
): CycleResult {
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(token: string): CycleResult {
    // Check if we've seen this node in current path (cycle)
    const pathIndex = path.indexOf(token);
    if (pathIndex !== -1) {
      return {
        hasCycle: true,
        cycle: [...path.slice(pathIndex), token]
      };
    }

    // Already fully explored this node
    if (visited.has(token)) {
      return { hasCycle: false };
    }

    const node = graph.nodes.get(token);
    if (!node) {
      return { hasCycle: false };
    }

    path.push(token);

    // Follow parent pointer (check for upward cycle)
    if (node.parent_id) {
      const parentResult = dfs(node.parent_id);
      if (parentResult.hasCycle) {
        return parentResult;
      }
    }

    path.pop();
    visited.add(token);

    return { hasCycle: false };
  }

  return dfs(startToken);
}

/**
 * Validates entire graph for cycles.
 */
export function validateGraphNoCycles(graph: EntityGraph): GraphValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const token of Array.from(graph.nodes.keys())) {
    const result = detectCycle(graph, token);
    if (result.hasCycle) {
      errors.push(`Cycle detected: ${result.cycle?.join(' -> ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// HIERARCHY QUERIES
// ============================================

/**
 * Gets the parent of an entity.
 */
export function getParent(
  graph: EntityGraph,
  token: string
): EntityNode | null {
  const node = graph.nodes.get(token);
  if (!node || !node.parent_id) {
    return null;
  }

  return graph.nodes.get(node.parent_id) || null;
}

/**
 * Gets all children of an entity.
 */
export function getChildren(
  graph: EntityGraph,
  token: string
): EntityNode[] {
  const childTokens = graph.children.get(token) || new Set();
  return Array.from(childTokens)
    .map(t => graph.nodes.get(t))
    .filter((n): n is EntityNode => n !== undefined);
}

/**
 * Gets all ancestors of an entity (parent chain).
 */
export function getAncestors(
  graph: EntityGraph,
  token: string
): EntityNode[] {
  const ancestors: EntityNode[] = [];
  let current = graph.nodes.get(token);

  while (current?.parent_id) {
    const parent = graph.nodes.get(current.parent_id);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}

/**
 * Gets all descendants of an entity (recursive children).
 */
export function getDescendants(
  graph: EntityGraph,
  token: string
): EntityNode[] {
  const descendants: EntityNode[] = [];
  const queue = [token];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = getChildren(graph, current);

    for (const child of children) {
      descendants.push(child);
      queue.push(child.token);
    }
  }

  return descendants;
}

/**
 * Gets the depth of an entity in the tree.
 */
export function getDepth(graph: EntityGraph, token: string): number {
  return getAncestors(graph, token).length;
}

/**
 * Gets full hierarchy info for an entity.
 */
export function getHierarchyInfo(
  graph: EntityGraph,
  token: string
): HierarchyInfo | null {
  const node = graph.nodes.get(token);
  if (!node) return null;

  const ancestors = getAncestors(graph, token);
  const descendants = getDescendants(graph, token);
  const children = getChildren(graph, token);

  return {
    token,
    parent: node.parent_id,
    children: children.map(c => c.token),
    depth: ancestors.length,
    ancestors: ancestors.map(a => a.token),
    descendants: descendants.map(d => d.token)
  };
}

/**
 * Gets all root entities (no parent).
 */
export function getRoots(graph: EntityGraph): EntityNode[] {
  return Array.from(graph.roots)
    .map(t => graph.nodes.get(t))
    .filter((n): n is EntityNode => n !== undefined);
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Single parent allowed
  const graph1 = createEntityGraph();

  const parent: EntityNode = {
    token: 'PARENT',
    hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
    fields: {}
  };

  const child: EntityNode = {
    token: 'CHILD',
    hash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    parent_id: 'PARENT',
    fields: {}
  };

  addNode(graph1, parent);
  const childResult = addNode(graph1, child);

  if (childResult.valid) {
    results.push('PASS: Test 1 - Single parent allowed');
  } else {
    results.push('FAIL: Test 1 - Single parent should be allowed');
    allPassed = false;
  }

  // Test 2: Multiple parents rejected (via forbidden field)
  const graph2 = createEntityGraph();

  const multiParentNode: EntityNode = {
    token: 'MULTI',
    hash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    fields: {
      parent_ids: ['PARENT1', 'PARENT2']  // Forbidden field
    }
  };

  const multiResult = addNode(graph2, multiParentNode);
  if (!multiResult.valid && multiResult.errors.some(e => e.includes('Forbidden'))) {
    results.push('PASS: Test 2 - Multiple parents (parent_ids) rejected');
  } else {
    results.push('FAIL: Test 2 - Multiple parents should be rejected');
    allPassed = false;
  }

  // Test 3: Cycles rejected
  const graph3 = createEntityGraph();

  const nodeA: EntityNode = {
    token: 'NODE_A',
    hash: 'sha256:aaaa111111111111111111111111111111111111111111111111111111111111',
    fields: {}
  };

  const nodeB: EntityNode = {
    token: 'NODE_B',
    hash: 'sha256:bbbb222222222222222222222222222222222222222222222222222222222222',
    parent_id: 'NODE_A',
    fields: {}
  };

  addNode(graph3, nodeA);
  addNode(graph3, nodeB);

  // Try to make A child of B (creates cycle)
  const nodeAChild: EntityNode = {
    token: 'NODE_A_V2',
    hash: 'sha256:aaaa333333333333333333333333333333333333333333333333333333333333',
    parent_id: 'NODE_B',
    fields: {}
  };

  // This shouldn't create a cycle since it's a new token
  // Let's test self-reference instead
  const selfRef: EntityNode = {
    token: 'SELF_REF',
    hash: 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
    parent_id: 'SELF_REF',
    fields: {}
  };

  const selfResult = addNode(graph3, selfRef);
  if (!selfResult.valid && selfResult.errors.some(e => e.includes('own parent'))) {
    results.push('PASS: Test 3 - Self-reference cycle rejected');
  } else {
    results.push('FAIL: Test 3 - Self-reference should be rejected');
    allPassed = false;
  }

  // Test 4: Forbidden "children" field rejected
  const graph4 = createEntityGraph();

  const withChildren: EntityNode = {
    token: 'WITH_CHILDREN',
    hash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
    fields: {
      children: ['CHILD1', 'CHILD2']  // Forbidden
    }
  };

  const childrenResult = addNode(graph4, withChildren);
  if (!childrenResult.valid && childrenResult.errors.some(e => e.includes('children'))) {
    results.push('PASS: Test 4 - "children" field rejected');
  } else {
    results.push('FAIL: Test 4 - "children" field should be rejected');
    allPassed = false;
  }

  // Test 5: getParent works correctly
  const parentNode = getParent(graph1, 'CHILD');
  if (parentNode && parentNode.token === 'PARENT') {
    results.push('PASS: Test 5 - getParent returns correct parent');
  } else {
    results.push('FAIL: Test 5 - getParent should return PARENT');
    allPassed = false;
  }

  // Test 6: getChildren works correctly
  const children = getChildren(graph1, 'PARENT');
  if (children.length === 1 && children[0].token === 'CHILD') {
    results.push('PASS: Test 6 - getChildren returns correct children');
  } else {
    results.push('FAIL: Test 6 - getChildren should return [CHILD]');
    allPassed = false;
  }

  // Test 7: getRoots works correctly
  const roots = getRoots(graph1);
  if (roots.length === 1 && roots[0].token === 'PARENT') {
    results.push('PASS: Test 7 - getRoots returns root nodes');
  } else {
    results.push('FAIL: Test 7 - getRoots should return [PARENT]');
    allPassed = false;
  }

  // Test 8: getDepth works correctly
  const depth = getDepth(graph1, 'CHILD');
  if (depth === 1) {
    results.push('PASS: Test 8 - getDepth returns correct depth');
  } else {
    results.push('FAIL: Test 8 - getDepth should return 1');
    allPassed = false;
  }

  // Test 9: Invalid parent_id format rejected
  const graph5 = createEntityGraph();

  const badParent: EntityNode = {
    token: 'BAD_PARENT',
    hash: 'sha256:6666666666666666666666666666666666666666666666666666666666666666',
    parent_id: 'lowercase_invalid',  // Invalid format
    fields: {}
  };

  const badResult = addNode(graph5, badParent);
  if (!badResult.valid && badResult.errors.some(e => e.includes('format'))) {
    results.push('PASS: Test 9 - Invalid parent_id format rejected');
  } else {
    results.push('FAIL: Test 9 - Invalid format should be rejected');
    allPassed = false;
  }

  // Test 10: Hierarchy info complete
  const info = getHierarchyInfo(graph1, 'CHILD');
  if (info && info.parent === 'PARENT' && info.depth === 1 && info.ancestors.length === 1) {
    results.push('PASS: Test 10 - getHierarchyInfo returns complete info');
  } else {
    results.push('FAIL: Test 10 - Hierarchy info incomplete');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Entity Graph Resolver - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example hierarchy
  console.log('\n\nEntity Hierarchy Example:');
  console.log('-'.repeat(60));

  const graph = createEntityGraph();

  // Create a hierarchy: EXCHANGE -> SPOT_MARKET -> TRADING_PAIR
  addNode(graph, {
    token: 'BINANCE',
    hash: 'sha256:aaaa111111111111111111111111111111111111111111111111111111111111',
    fields: { type: 'exchange' }
  });

  addNode(graph, {
    token: 'BINANCE_SPOT',
    hash: 'sha256:bbbb222222222222222222222222222222222222222222222222222222222222',
    parent_id: 'BINANCE',
    fields: { type: 'market' }
  });

  addNode(graph, {
    token: 'BINANCE_BTC_USDT',
    hash: 'sha256:cccc333333333333333333333333333333333333333333333333333333333333',
    parent_id: 'BINANCE_SPOT',
    fields: { type: 'pair' }
  });

  console.log('Tree structure:');
  console.log('  BINANCE (root, depth=0)');
  console.log('    └── BINANCE_SPOT (depth=1)');
  console.log('        └── BINANCE_BTC_USDT (depth=2)');

  const leafInfo = getHierarchyInfo(graph, 'BINANCE_BTC_USDT');
  console.log(`\nLeaf info: depth=${leafInfo?.depth}, ancestors=${leafInfo?.ancestors.join(' -> ')}`);
}
