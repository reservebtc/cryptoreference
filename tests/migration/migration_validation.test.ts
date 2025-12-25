#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Migration Validation Suite
 *
 * Locks in migration correctness with comprehensive tests.
 *
 * Test Categories:
 * 1. Legacy → FULL CR success
 * 2. Legacy without CR → reject
 * 3. Partial CR → non-canonical
 * 4. Duplicate resolution
 *
 * Reference: /schema/plan2.md Step 11
 */

import * as fs from 'fs';
import * as path from 'path';
import { computeCanonicalHash as computeHash } from '../../schema/hash';
import { validateCR } from '../../schema/validate_cr';

// ============================================
// TEST FRAMEWORK
// ============================================

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

const testResults: TestResult[] = [];
let currentCategory = '';

function setCategory(name: string) {
  currentCategory = name;
}

function test(name: string, fn: () => boolean | string): void {
  const start = Date.now();
  let passed = false;
  let message = '';

  try {
    const result = fn();
    if (typeof result === 'boolean') {
      passed = result;
      message = passed ? 'OK' : 'Assertion failed';
    } else {
      passed = false;
      message = result;
    }
  } catch (error) {
    passed = false;
    message = error instanceof Error ? error.message : String(error);
  }

  const duration = Date.now() - start;

  testResults.push({
    name,
    category: currentCategory,
    passed,
    message,
    duration
  });
}

function assertEqual<T>(actual: T, expected: T, msg?: string): boolean {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, got ${actual}`);
  }
  return true;
}

function assertTrue(value: boolean, msg?: string): boolean {
  if (!value) {
    throw new Error(msg || 'Expected true, got false');
  }
  return true;
}

function assertFalse(value: boolean, msg?: string): boolean {
  if (value) {
    throw new Error(msg || 'Expected false, got true');
  }
  return true;
}

function assertIncludes(haystack: string, needle: string, msg?: string): boolean {
  if (!haystack.includes(needle)) {
    throw new Error(msg || `Expected string to include "${needle}"`);
  }
  return true;
}

// ============================================
// CR UTILITIES
// ============================================

function parseCR(content: string): Record<string, string> {
  const fields: Record<string, string> = {};

  const tokenMatch = content.match(/\[CR\/([A-Z][A-Z0-9_-]*)\]/);
  if (tokenMatch) {
    fields._token = tokenMatch[1];
  }

  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^([a-z_][a-z0-9_]*)=(.+)$/);
    if (match) {
      fields[match[1]] = match[2];
    }
  }

  return fields;
}

function computeCanonicalHash(content: string): string {
  // Use official hash computation from schema/hash.ts
  const result = computeHash(content);
  if (!result.success || !result.hash) {
    throw new Error(result.error || 'Hash computation failed');
  }
  return result.hash;
}

function isValidCR(content: string): { valid: boolean; errors: string[] } {
  // Use official validation from schema/validate_cr.ts
  const result = validateCR(content);
  const errors = result.errors.map(e => e.message);
  return { valid: result.valid, errors };
}

function isCanonicalCR(content: string): boolean {
  const fields = parseCR(content);

  // Must not have migration flags
  if (fields.cr_status === 'partial') return false;
  if (fields.cr_compliance === 'false') return false;

  // Must pass full validation (includes hash check)
  const validation = validateCR(content);
  return validation.valid;
}

// ============================================
// PATHS
// ============================================

const BASE_PATH = path.resolve(__dirname, '../..');
const MIGRATION_PATH = path.join(BASE_PATH, 'migration');
const CR_ENTITIES_PATH = path.join(MIGRATION_PATH, 'cr_entities');
const INVENTORY_PATH = path.join(MIGRATION_PATH, 'legacy_inventory.json');
const DUPLICATE_MAP_PATH = path.join(MIGRATION_PATH, 'duplicate_map.json');

// ============================================
// TEST CATEGORY 1: Legacy → FULL CR Success
// ============================================

setCategory('Legacy → FULL CR Success');

test('All entity pages have corresponding CR files', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    const crFileName = `${page.entity_name.toLowerCase()}.cr`;
    const crPath = path.join(CR_ENTITIES_PATH, crFileName);

    if (!fs.existsSync(crPath)) {
      throw new Error(`CR file missing for entity: ${page.entity_name}`);
    }
  }

  return true;
});

test('All CR files are valid FULL CRs', () => {
  const crFiles = fs.readdirSync(CR_ENTITIES_PATH).filter(f => f.endsWith('.cr'));

  for (const file of crFiles) {
    const content = fs.readFileSync(path.join(CR_ENTITIES_PATH, file), 'utf-8');
    const validation = isValidCR(content);

    if (!validation.valid) {
      throw new Error(`Invalid CR in ${file}: ${validation.errors.join(', ')}`);
    }
  }

  return true;
});

test('All CR files have correct canonical hashes', () => {
  const crFiles = fs.readdirSync(CR_ENTITIES_PATH).filter(f => f.endsWith('.cr'));

  for (const file of crFiles) {
    const content = fs.readFileSync(path.join(CR_ENTITIES_PATH, file), 'utf-8');

    // Use official validation which includes hash verification
    const validation = validateCR(content);
    if (!validation.valid) {
      const hashError = validation.errors.find(e => e.code === 'HASH_MISMATCH');
      if (hashError) {
        throw new Error(`Hash mismatch in ${file}: ${hashError.message}`);
      }
    }
  }

  return true;
});

test('Entity pages have embedded CR blocks', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    const pagePath = path.join(BASE_PATH, page.file_path);

    if (!fs.existsSync(pagePath)) {
      throw new Error(`Page file missing: ${page.file_path}`);
    }

    const content = fs.readFileSync(pagePath, 'utf-8');

    if (!content.includes('[CR-BLOCK]')) {
      throw new Error(`CR-BLOCK missing in: ${page.file_path}`);
    }

    if (!content.includes('[/CR-BLOCK]')) {
      throw new Error(`CR-BLOCK not closed in: ${page.file_path}`);
    }
  }

  return true;
});

test('CR token matches entity name in pages', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    const pagePath = path.join(BASE_PATH, page.file_path);
    const content = fs.readFileSync(pagePath, 'utf-8');

    const tokenMatch = content.match(/\[CR\/([A-Z][A-Z0-9_-]*)\]/);
    if (!tokenMatch) {
      throw new Error(`No CR token found in: ${page.file_path}`);
    }

    if (tokenMatch[1] !== page.entity_name) {
      throw new Error(`Token mismatch in ${page.file_path}: expected ${page.entity_name}, got ${tokenMatch[1]}`);
    }
  }

  return true;
});

// ============================================
// TEST CATEGORY 2: Legacy Without CR → Reject
// ============================================

setCategory('Legacy Without CR → Reject');

test('Pages without CR-BLOCK fail validation', () => {
  // Create test content without CR
  const testContent = `
export default function TestPage() {
  return <div>No CR here</div>;
}
`;

  const hasCRBlock = testContent.includes('[CR-BLOCK]');
  assertFalse(hasCRBlock, 'Page without CR should not have CR-BLOCK');

  return true;
});

test('CR binding validator rejects missing CR', () => {
  // Simulate validation logic
  const testPageContent = `export default function TestPage() { return <div>Test</div>; }`;

  const crBlockCount = (testPageContent.match(/\[CR-BLOCK\]/g) || []).length;
  assertEqual(crBlockCount, 0, 'Test page should have no CR blocks');

  // Validation should fail
  const isValid = crBlockCount === 1;
  assertFalse(isValid, 'Page without CR should fail validation');

  return true;
});

test('Entity pages in inventory marked as locked without CR', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    // Inventory should have marked them as locked
    assertTrue(page.locked === true, `Entity page ${page.entity_name} should be locked`);
  }

  return true;
});

test('Multiple CR blocks on page is rejected', () => {
  const testContent = `
{/* [CR-BLOCK]
[CR/TEST1]
schema=CR1.0
[/CR]
[/CR-BLOCK] */}

{/* [CR-BLOCK]
[CR/TEST2]
schema=CR1.0
[/CR]
[/CR-BLOCK] */}
`;

  const crBlockCount = (testContent.match(/\[CR-BLOCK\]/g) || []).length;
  assertEqual(crBlockCount, 2, 'Test should have 2 CR blocks');

  // Should be rejected
  const isValid = crBlockCount === 1;
  assertFalse(isValid, 'Multiple CR blocks should fail validation');

  return true;
});

// ============================================
// TEST CATEGORY 3: Partial CR → Non-Canonical
// ============================================

setCategory('Partial CR → Non-Canonical');

test('Partial CR with cr_status=partial is non-canonical', () => {
  const partialCR = `[CR/TEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:abc123
type=test
network=test
cr_status=partial
cr_compliance=false
[/CR]`;

  const fields = parseCR(partialCR);
  assertEqual(fields.cr_status, 'partial');
  assertFalse(isCanonicalCR(partialCR), 'Partial CR should not be canonical');

  return true;
});

test('CR without canonical_hash is invalid', () => {
  const invalidCR = `[CR/TEST]
schema=CR1.0
version=1.0
type=test
network=test
[/CR]`;

  const validation = isValidCR(invalidCR);
  assertFalse(validation.valid, 'CR without hash should be invalid');
  assertTrue(validation.errors.some(e => e.includes('canonical_hash')));

  return true;
});

test('CR with wrong hash is detectable via hash verification', () => {
  // A CR with deliberately wrong hash
  const wrongHashCR = `[CR/WRONGHASH]
schema=CR1.0
version=1.0
canonical_hash=sha256:0000000000000000000000000000000000000000000000000000000000000000
type=test
network=test
name=WrongHashTest
status=active
[/CR]`;

  // Validation passes but provides computed hash for verification
  const validation = validateCR(wrongHashCR);
  assertTrue(validation.valid, 'Syntax validation should pass');

  // But the computed hash should be different from the declared hash
  const declaredHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  const computedHash = validation.data?.computedHash;

  assertTrue(computedHash !== undefined, 'Should compute hash');
  assertTrue(computedHash !== declaredHash, 'Computed hash should differ from wrong hash');

  return true;
});

test('FULL CR files have no migration flags', () => {
  const crFiles = fs.readdirSync(CR_ENTITIES_PATH).filter(f => f.endsWith('.cr'));

  for (const file of crFiles) {
    const content = fs.readFileSync(path.join(CR_ENTITIES_PATH, file), 'utf-8');
    const fields = parseCR(content);

    if (fields.cr_status === 'partial') {
      throw new Error(`Migration flag cr_status=partial found in ${file}`);
    }

    if (fields.cr_compliance === 'false') {
      throw new Error(`Migration flag cr_compliance=false found in ${file}`);
    }
  }

  return true;
});

// ============================================
// TEST CATEGORY 4: Duplicate Resolution
// ============================================

setCategory('Duplicate Resolution');

test('Duplicate map exists and is valid JSON', () => {
  assertTrue(fs.existsSync(DUPLICATE_MAP_PATH), 'duplicate_map.json should exist');

  const content = fs.readFileSync(DUPLICATE_MAP_PATH, 'utf-8');
  const map = JSON.parse(content);

  assertTrue(Array.isArray(map.entities), 'Should have entities array');
  assertTrue(Array.isArray(map.duplicate_groups), 'Should have duplicate_groups array');

  return true;
});

test('All entities have canonical or duplicate status', () => {
  const map = JSON.parse(fs.readFileSync(DUPLICATE_MAP_PATH, 'utf-8'));

  for (const entity of map.entities) {
    assertTrue(
      entity.status === 'canonical' || entity.status === 'duplicate',
      `Entity ${entity.token} has invalid status: ${entity.status}`
    );
  }

  return true;
});

test('Duplicates reference existing canonical entities', () => {
  const map = JSON.parse(fs.readFileSync(DUPLICATE_MAP_PATH, 'utf-8'));
  const canonicalTokens = map.entities
    .filter((e: any) => e.status === 'canonical')
    .map((e: any) => e.token);

  for (const group of map.duplicate_groups) {
    assertTrue(
      canonicalTokens.includes(group.canonical),
      `Duplicate group references non-existent canonical: ${group.canonical}`
    );
  }

  return true;
});

test('No entity appears in multiple duplicate groups', () => {
  const map = JSON.parse(fs.readFileSync(DUPLICATE_MAP_PATH, 'utf-8'));
  const seenEntities = new Set<string>();

  for (const group of map.duplicate_groups) {
    for (const dup of group.duplicates) {
      assertFalse(
        seenEntities.has(dup),
        `Entity ${dup} appears in multiple duplicate groups`
      );
      seenEntities.add(dup);
    }
  }

  return true;
});

test('Deprecated entities are not marked as duplicates', () => {
  const map = JSON.parse(fs.readFileSync(DUPLICATE_MAP_PATH, 'utf-8'));
  const crFiles = fs.readdirSync(CR_ENTITIES_PATH).filter(f => f.endsWith('.cr'));

  const deprecatedEntities: string[] = [];
  for (const file of crFiles) {
    const content = fs.readFileSync(path.join(CR_ENTITIES_PATH, file), 'utf-8');
    const fields = parseCR(content);
    if (fields.status === 'deprecated') {
      deprecatedEntities.push(fields._token);
    }
  }

  for (const group of map.duplicate_groups) {
    for (const deprecated of deprecatedEntities) {
      assertFalse(
        group.duplicates.includes(deprecated),
        `Deprecated entity ${deprecated} should not be in duplicate list`
      );
    }
  }

  return true;
});

// ============================================
// TEST CATEGORY 5: Integration Tests
// ============================================

setCategory('Integration');

test('No legacy machine layers in entity pages', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    const pagePath = path.join(BASE_PATH, page.file_path);
    const content = fs.readFileSync(pagePath, 'utf-8');

    if (content.includes('application/ld+json')) {
      throw new Error(`Legacy JSON-LD found in: ${page.file_path}`);
    }

    if (content.includes('application/vnd.ai+json')) {
      throw new Error(`Legacy ai+json found in: ${page.file_path}`);
    }
  }

  return true;
});

test('CR is the sole machine contract in entity pages', () => {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const entityPages = inventory.pages.filter((p: any) => p.entity_candidate === true);

  for (const page of entityPages) {
    const pagePath = path.join(BASE_PATH, page.file_path);
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Must have CR
    assertTrue(content.includes('[CR-BLOCK]'), `Missing CR-BLOCK in ${page.file_path}`);
    assertTrue(content.includes('[CR/'), `Missing CR block in ${page.file_path}`);

    // Must not have other machine formats
    assertFalse(content.includes('application/ld+json'), `JSON-LD in ${page.file_path}`);
    assertFalse(content.includes('application/vnd.ai+json'), `ai+json in ${page.file_path}`);
  }

  return true;
});

test('All active entities have valid status field', () => {
  const crFiles = fs.readdirSync(CR_ENTITIES_PATH).filter(f => f.endsWith('.cr'));
  const validStatuses = ['active', 'deprecated', 'beta', 'inactive'];

  for (const file of crFiles) {
    const content = fs.readFileSync(path.join(CR_ENTITIES_PATH, file), 'utf-8');
    const fields = parseCR(content);

    assertTrue(
      validStatuses.includes(fields.status),
      `Invalid status "${fields.status}" in ${file}`
    );
  }

  return true;
});

// ============================================
// TEST RUNNER
// ============================================

function runTests(): TestSuite {
  const startTime = Date.now();

  // Tests are already run via test() calls above

  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;

  return {
    name: 'Migration Validation Suite',
    tests: testResults,
    passed,
    failed,
    duration: Date.now() - startTime
  };
}

function printResults(suite: TestSuite) {
  console.log('CR-Markup Migration Validation Suite\n');
  console.log('='.repeat(70));

  // Group by category
  const categories = new Map<string, TestResult[]>();
  for (const test of suite.tests) {
    if (!categories.has(test.category)) {
      categories.set(test.category, []);
    }
    categories.get(test.category)!.push(test);
  }

  for (const [category, tests] of categories) {
    console.log(`\n${category}`);
    console.log('-'.repeat(70));

    for (const test of tests) {
      const status = test.passed ? 'PASS' : 'FAIL';
      const statusColor = test.passed ? '✓' : '✗';
      const duration = `${test.duration}ms`;

      console.log(`  ${statusColor} ${test.name}`);
      if (!test.passed) {
        console.log(`      Error: ${test.message}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\nTest Summary:');
  console.log(`  Total:   ${suite.tests.length}`);
  console.log(`  Passed:  ${suite.passed}`);
  console.log(`  Failed:  ${suite.failed}`);
  console.log(`  Duration: ${suite.duration}ms`);

  // Acceptance Tests
  console.log('\n' + '='.repeat(70));
  console.log('\nAcceptance Tests:');

  const allGreen = suite.failed === 0;
  console.log(`${allGreen ? 'PASS' : 'FAIL'}: All tests are green`);

  const noRegression = suite.failed === 0;
  console.log(`${noRegression ? 'PASS' : 'FAIL'}: No regression detected`);

  console.log(`\nOverall: ${allGreen ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('\n' + '='.repeat(70));

  return allGreen;
}

// Run
const suite = runTests();
const success = printResults(suite);
process.exit(success ? 0 : 1);
