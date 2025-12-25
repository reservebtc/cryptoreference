/**
 * Regression & Replay Tests
 *
 * Guarantees reproducibility:
 * - Re-run same registry + manifest produces identical output
 * - Zero diff between runs
 * - Zero new pages created on replay
 * - Any drift = hard fail
 *
 * Reference: plan3.md Step 13
 */

import * as crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface RegistryEntry {
  id: string;
  type: string;
  page_status: 'missing' | 'published' | 'deprecated' | 'duplicate';
  cr_required: boolean;
  parent_id?: string;
  entities?: string[];
  source_scope?: string[];
  published_at?: string;
  published_hash?: string;
}

export interface Registry {
  version: string;
  entries: RegistryEntry[];
  last_updated?: string;
}

export interface ManifestTask {
  registry_id: string;
  page_type: string;
  generator_type: string;
  source_scope: string[];
  priority: number;
  cr_required: boolean;
}

export interface Manifest {
  generated_at: string;
  registry_version: string;
  total_tasks: number;
  tasks: ManifestTask[];
}

export interface GeneratedPage {
  registry_id: string;
  content: string;
  content_hash: string;
  generated_at: string;
}

export interface ReplayResult {
  deterministic: boolean;
  diffs: DiffEntry[];
  new_pages: string[];
  missing_pages: string[];
  stats: {
    total_pages: number;
    identical_pages: number;
    different_pages: number;
    drift_percentage: number;
  };
}

export interface DiffEntry {
  registry_id: string;
  type: 'content_changed' | 'hash_mismatch' | 'new_page' | 'missing_page';
  original_hash?: string;
  replay_hash?: string;
  details?: string;
}

export interface RegressionTestResult {
  passed: boolean;
  tests_run: number;
  tests_passed: number;
  tests_failed: number;
  failures: string[];
}

export interface Snapshot {
  registry_hash: string;
  manifest_hash: string;
  pages: Map<string, string>;  // registry_id -> content_hash
  created_at: string;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Calculate deterministic hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate hash of registry for comparison
 */
export function hashRegistry(registry: Registry): string {
  const normalized = JSON.stringify({
    version: registry.version,
    entries: registry.entries
      .map(e => ({ id: e.id, type: e.type, page_status: e.page_status, cr_required: e.cr_required }))
      .sort((a, b) => a.id.localeCompare(b.id))
  });
  return hashContent(normalized);
}

/**
 * Calculate hash of manifest for comparison
 */
export function hashManifest(manifest: Manifest): string {
  const normalized = JSON.stringify({
    registry_version: manifest.registry_version,
    tasks: manifest.tasks
      .map(t => ({ registry_id: t.registry_id, page_type: t.page_type, generator_type: t.generator_type }))
      .sort((a, b) => a.registry_id.localeCompare(b.registry_id))
  });
  return hashContent(normalized);
}

/**
 * Create a snapshot of current state
 */
export function createSnapshot(
  registry: Registry,
  manifest: Manifest,
  pages: GeneratedPage[]
): Snapshot {
  const pagesMap = new Map<string, string>();
  for (const page of pages) {
    pagesMap.set(page.registry_id, page.content_hash);
  }

  return {
    registry_hash: hashRegistry(registry),
    manifest_hash: hashManifest(manifest),
    pages: pagesMap,
    created_at: new Date().toISOString()
  };
}

/**
 * Compare two snapshots for differences
 */
export function compareSnapshots(original: Snapshot, replay: Snapshot): ReplayResult {
  const diffs: DiffEntry[] = [];
  const newPages: string[] = [];
  const missingPages: string[] = [];

  // Check registry hash
  if (original.registry_hash !== replay.registry_hash) {
    diffs.push({
      registry_id: '_registry',
      type: 'hash_mismatch',
      original_hash: original.registry_hash,
      replay_hash: replay.registry_hash,
      details: 'Registry content changed between runs'
    });
  }

  // Check manifest hash
  if (original.manifest_hash !== replay.manifest_hash) {
    diffs.push({
      registry_id: '_manifest',
      type: 'hash_mismatch',
      original_hash: original.manifest_hash,
      replay_hash: replay.manifest_hash,
      details: 'Manifest content changed between runs'
    });
  }

  // Check for new pages in replay
  for (const [id, hash] of Array.from(replay.pages.entries())) {
    if (!original.pages.has(id)) {
      newPages.push(id);
      diffs.push({
        registry_id: id,
        type: 'new_page',
        replay_hash: hash,
        details: 'Page was created in replay but not in original'
      });
    }
  }

  // Check for missing pages in replay
  for (const [id, hash] of Array.from(original.pages.entries())) {
    if (!replay.pages.has(id)) {
      missingPages.push(id);
      diffs.push({
        registry_id: id,
        type: 'missing_page',
        original_hash: hash,
        details: 'Page exists in original but missing in replay'
      });
    }
  }

  // Check for content changes
  let identicalPages = 0;
  let differentPages = 0;

  for (const [id, originalHash] of Array.from(original.pages.entries())) {
    const replayHash = replay.pages.get(id);
    if (replayHash) {
      if (originalHash === replayHash) {
        identicalPages++;
      } else {
        differentPages++;
        diffs.push({
          registry_id: id,
          type: 'content_changed',
          original_hash: originalHash,
          replay_hash: replayHash,
          details: 'Page content differs between runs'
        });
      }
    }
  }

  const totalPages = original.pages.size;
  const driftPercentage = totalPages > 0 ? (differentPages / totalPages) * 100 : 0;

  return {
    deterministic: diffs.length === 0,
    diffs,
    new_pages: newPages,
    missing_pages: missingPages,
    stats: {
      total_pages: totalPages,
      identical_pages: identicalPages,
      different_pages: differentPages,
      drift_percentage: Math.round(driftPercentage * 100) / 100
    }
  };
}

/**
 * Simulate page generation for testing
 * In real usage, this would call the actual generators
 */
export function simulateGeneration(
  registry: Registry,
  manifest: Manifest,
  deterministicSeed?: string
): GeneratedPage[] {
  const pages: GeneratedPage[] = [];

  for (const task of manifest.tasks) {
    const entry = registry.entries.find(e => e.id === task.registry_id);
    if (!entry || entry.page_status !== 'missing') continue;

    // Generate deterministic content based on task + seed
    const contentBase = JSON.stringify({
      registry_id: task.registry_id,
      page_type: task.page_type,
      generator_type: task.generator_type,
      seed: deterministicSeed || 'default'
    });

    const content = `# ${task.registry_id}\n\nGenerated content for ${task.page_type}.\n\nHash: ${hashContent(contentBase).substring(0, 8)}`;

    pages.push({
      registry_id: task.registry_id,
      content,
      content_hash: hashContent(content),
      generated_at: new Date().toISOString()
    });
  }

  return pages;
}

/**
 * Run replay test: generate pages and compare with expected
 */
export function runReplayTest(
  registry: Registry,
  manifest: Manifest,
  expectedSnapshot: Snapshot,
  seed?: string
): ReplayResult {
  // Generate pages
  const pages = simulateGeneration(registry, manifest, seed);

  // Create replay snapshot
  const replaySnapshot = createSnapshot(registry, manifest, pages);

  // Compare
  return compareSnapshots(expectedSnapshot, replaySnapshot);
}

/**
 * Assert zero drift between runs
 */
export function assertZeroDrift(result: ReplayResult): { passed: boolean; message: string } {
  if (result.deterministic) {
    return {
      passed: true,
      message: `Deterministic: ${result.stats.identical_pages}/${result.stats.total_pages} pages identical`
    };
  }

  const issues: string[] = [];

  if (result.new_pages.length > 0) {
    issues.push(`${result.new_pages.length} new pages created`);
  }

  if (result.missing_pages.length > 0) {
    issues.push(`${result.missing_pages.length} pages missing`);
  }

  if (result.stats.different_pages > 0) {
    issues.push(`${result.stats.different_pages} pages with content drift`);
  }

  return {
    passed: false,
    message: `DRIFT DETECTED: ${issues.join(', ')}`
  };
}

/**
 * Assert zero new pages
 */
export function assertZeroNewPages(result: ReplayResult): { passed: boolean; message: string } {
  if (result.new_pages.length === 0) {
    return {
      passed: true,
      message: 'No new pages created during replay'
    };
  }

  return {
    passed: false,
    message: `NEW PAGES DETECTED: ${result.new_pages.join(', ')}`
  };
}

/**
 * Format replay result as report
 */
export function formatReplayReport(result: ReplayResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('  REGRESSION & REPLAY TEST REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  if (result.deterministic) {
    lines.push('Status: DETERMINISTIC (PASS)');
  } else {
    lines.push('Status: DRIFT DETECTED (FAIL)');
  }

  lines.push('');
  lines.push('Statistics:');
  lines.push(`  Total pages: ${result.stats.total_pages}`);
  lines.push(`  Identical: ${result.stats.identical_pages}`);
  lines.push(`  Different: ${result.stats.different_pages}`);
  lines.push(`  Drift: ${result.stats.drift_percentage}%`);

  if (result.new_pages.length > 0) {
    lines.push('');
    lines.push('New pages (should not exist):');
    for (const id of result.new_pages) {
      lines.push(`  - ${id}`);
    }
  }

  if (result.missing_pages.length > 0) {
    lines.push('');
    lines.push('Missing pages:');
    for (const id of result.missing_pages) {
      lines.push(`  - ${id}`);
    }
  }

  if (result.diffs.length > 0 && result.stats.different_pages > 0) {
    lines.push('');
    lines.push('Content diffs:');
    for (const diff of result.diffs.filter(d => d.type === 'content_changed')) {
      lines.push(`  - ${diff.registry_id}: ${diff.original_hash?.substring(0, 8)} → ${diff.replay_hash?.substring(0, 8)}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Run full regression test suite
 */
export function runRegressionSuite(
  registry: Registry,
  manifest: Manifest
): RegressionTestResult {
  const failures: string[] = [];
  let testsRun = 0;
  let testsPassed = 0;

  // Test 1: Same seed produces identical output
  testsRun++;
  const pages1 = simulateGeneration(registry, manifest, 'seed-1');
  const pages2 = simulateGeneration(registry, manifest, 'seed-1');
  const snapshot1 = createSnapshot(registry, manifest, pages1);
  const snapshot2 = createSnapshot(registry, manifest, pages2);
  const result1 = compareSnapshots(snapshot1, snapshot2);

  if (result1.deterministic) {
    testsPassed++;
  } else {
    failures.push('Same seed produced different output');
  }

  // Test 2: No new pages on re-run
  testsRun++;
  if (result1.new_pages.length === 0) {
    testsPassed++;
  } else {
    failures.push(`Re-run created ${result1.new_pages.length} new pages`);
  }

  // Test 3: Registry hash is stable
  testsRun++;
  const hash1 = hashRegistry(registry);
  const hash2 = hashRegistry(registry);
  if (hash1 === hash2) {
    testsPassed++;
  } else {
    failures.push('Registry hash is not stable');
  }

  // Test 4: Manifest hash is stable
  testsRun++;
  const mhash1 = hashManifest(manifest);
  const mhash2 = hashManifest(manifest);
  if (mhash1 === mhash2) {
    testsPassed++;
  } else {
    failures.push('Manifest hash is not stable');
  }

  // Test 5: Published entries are not regenerated
  testsRun++;
  const publishedIds = registry.entries
    .filter(e => e.page_status === 'published')
    .map(e => e.id);
  const generatedIds = pages1.map(p => p.registry_id);
  const regenerated = publishedIds.filter(id => generatedIds.includes(id));
  if (regenerated.length === 0) {
    testsPassed++;
  } else {
    failures.push(`Published entries regenerated: ${regenerated.join(', ')}`);
  }

  return {
    passed: failures.length === 0,
    tests_run: testsRun,
    tests_passed: testsPassed,
    tests_failed: failures.length,
    failures
  };
}

/**
 * Verify idempotency: multiple runs produce same result
 */
export function verifyIdempotency(
  registry: Registry,
  manifest: Manifest,
  runs: number = 3
): { idempotent: boolean; hashes: string[] } {
  const hashes: string[] = [];

  for (let i = 0; i < runs; i++) {
    const pages = simulateGeneration(registry, manifest, 'fixed-seed');
    const snapshot = createSnapshot(registry, manifest, pages);

    // Create combined hash of all page hashes
    const pageHashes = Array.from(snapshot.pages.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, hash]) => `${id}:${hash}`)
      .join('|');

    hashes.push(hashContent(pageHashes));
  }

  const allSame = hashes.every(h => h === hashes[0]);

  return {
    idempotent: allSame,
    hashes
  };
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('Regression & Replay Tests - Acceptance Tests\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean): void {
    try {
      if (fn()) {
        console.log(`PASS: ${name}`);
        passed++;
      } else {
        console.log(`FAIL: ${name}`);
        failed++;
      }
    } catch (e) {
      console.log(`FAIL: ${name} - ${e}`);
      failed++;
    }
  }

  // Sample data
  const registry: Registry = {
    version: '1.0',
    entries: [
      { id: 'exchange-a', type: 'entity', page_status: 'missing', cr_required: true },
      { id: 'exchange-b', type: 'entity', page_status: 'published', cr_required: true },
      { id: 'guide-1', type: 'education', page_status: 'missing', cr_required: false }
    ]
  };

  const manifest: Manifest = {
    generated_at: new Date().toISOString(),
    registry_version: '1.0',
    total_tasks: 2,
    tasks: [
      { registry_id: 'exchange-a', page_type: 'entity', generator_type: 'entity_generator', source_scope: ['official_site'], priority: 10, cr_required: true },
      { registry_id: 'guide-1', page_type: 'education', generator_type: 'education_generator', source_scope: ['official_docs'], priority: 5, cr_required: false }
    ]
  };

  // Test 1: Hash content is deterministic
  test('Test 1 - Hash content is deterministic', () => {
    const h1 = hashContent('test content');
    const h2 = hashContent('test content');
    return h1 === h2;
  });

  // Test 2: Different content has different hash
  test('Test 2 - Different content different hash', () => {
    const h1 = hashContent('content 1');
    const h2 = hashContent('content 2');
    return h1 !== h2;
  });

  // Test 3: Registry hash is deterministic
  test('Test 3 - Registry hash is deterministic', () => {
    const h1 = hashRegistry(registry);
    const h2 = hashRegistry(registry);
    return h1 === h2;
  });

  // Test 4: Manifest hash is deterministic
  test('Test 4 - Manifest hash is deterministic', () => {
    const h1 = hashManifest(manifest);
    const h2 = hashManifest(manifest);
    return h1 === h2;
  });

  // Test 5: Snapshot creation works
  test('Test 5 - Snapshot creation works', () => {
    const pages = simulateGeneration(registry, manifest, 'seed');
    const snapshot = createSnapshot(registry, manifest, pages);
    return snapshot.pages.size === 2 && snapshot.registry_hash.length === 64;
  });

  // Test 6: Same seed produces identical snapshots
  test('Test 6 - Same seed identical snapshots', () => {
    const pages1 = simulateGeneration(registry, manifest, 'same-seed');
    const pages2 = simulateGeneration(registry, manifest, 'same-seed');
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    return result.deterministic;
  });

  // Test 7: Different seed produces different content
  test('Test 7 - Different seed different content', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed-1');
    const pages2 = simulateGeneration(registry, manifest, 'seed-2');
    return pages1[0].content_hash !== pages2[0].content_hash;
  });

  // Test 8: Zero drift on replay
  test('Test 8 - Zero drift on replay', () => {
    const pages = simulateGeneration(registry, manifest, 'fixed');
    const original = createSnapshot(registry, manifest, pages);
    const result = runReplayTest(registry, manifest, original, 'fixed');
    return result.deterministic && result.stats.drift_percentage === 0;
  });

  // Test 9: Zero new pages on replay
  test('Test 9 - Zero new pages on replay', () => {
    const pages = simulateGeneration(registry, manifest, 'fixed');
    const original = createSnapshot(registry, manifest, pages);
    const result = runReplayTest(registry, manifest, original, 'fixed');
    const assertion = assertZeroNewPages(result);
    return assertion.passed;
  });

  // Test 10: Published entries not regenerated
  test('Test 10 - Published entries not regenerated', () => {
    const pages = simulateGeneration(registry, manifest, 'seed');
    const ids = pages.map(p => p.registry_id);
    return !ids.includes('exchange-b');  // exchange-b is published
  });

  // Test 11: Compare snapshots detects new pages
  test('Test 11 - Detects new pages', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed');
    const pages2 = [...pages1, { registry_id: 'new-page', content: 'new', content_hash: 'abc', generated_at: '' }];
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    return result.new_pages.includes('new-page');
  });

  // Test 12: Compare snapshots detects missing pages
  test('Test 12 - Detects missing pages', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed');
    const pages2 = pages1.slice(1);  // Remove first page
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    return result.missing_pages.length === 1;
  });

  // Test 13: Compare snapshots detects content changes
  test('Test 13 - Detects content changes', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed-1');
    const pages2 = simulateGeneration(registry, manifest, 'seed-2');
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    return result.stats.different_pages > 0;
  });

  // Test 14: assertZeroDrift fails on drift
  test('Test 14 - assertZeroDrift fails on drift', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed-1');
    const pages2 = simulateGeneration(registry, manifest, 'seed-2');
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    const assertion = assertZeroDrift(result);
    return !assertion.passed;
  });

  // Test 15: Report format includes status
  test('Test 15 - Report format works', () => {
    const pages = simulateGeneration(registry, manifest, 'seed');
    const snapshot = createSnapshot(registry, manifest, pages);
    const result = runReplayTest(registry, manifest, snapshot, 'seed');
    const report = formatReplayReport(result);
    return report.includes('DETERMINISTIC') && report.includes('PASS');
  });

  // Test 16: Regression suite runs
  test('Test 16 - Regression suite runs', () => {
    const result = runRegressionSuite(registry, manifest);
    return result.tests_run === 5;
  });

  // Test 17: Regression suite passes for valid input
  test('Test 17 - Regression suite passes', () => {
    const result = runRegressionSuite(registry, manifest);
    return result.passed && result.tests_passed === 5;
  });

  // Test 18: Idempotency verification works
  test('Test 18 - Idempotency verification works', () => {
    const result = verifyIdempotency(registry, manifest, 3);
    return result.idempotent && result.hashes.length === 3;
  });

  // Test 19: Drift percentage calculated correctly
  test('Test 19 - Drift percentage correct', () => {
    const pages1 = simulateGeneration(registry, manifest, 'seed-1');
    const pages2 = simulateGeneration(registry, manifest, 'seed-2');
    const s1 = createSnapshot(registry, manifest, pages1);
    const s2 = createSnapshot(registry, manifest, pages2);
    const result = compareSnapshots(s1, s2);
    return result.stats.drift_percentage === 100;  // All pages different
  });

  // Test 20: Empty manifest produces zero pages
  test('Test 20 - Empty manifest zero pages', () => {
    const emptyManifest: Manifest = { ...manifest, tasks: [], total_tasks: 0 };
    const pages = simulateGeneration(registry, emptyManifest, 'seed');
    return pages.length === 0;
  });

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed === 20 ? 'ALL TESTS PASSED' : `${failed} FAILED`}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAcceptanceTests();
}
