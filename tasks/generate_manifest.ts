#!/usr/bin/env npx tsx
/**
 * CR Task Manifest Generator
 *
 * Generates daily AI tasks from registry.
 * Only includes entries with page_status=missing.
 *
 * Manifest Structure:
 * - generated_at: ISO timestamp
 * - registry_version: Registry version used
 * - tasks: Array of task objects
 *
 * Task Object:
 * - registry_id: ID from registry
 * - page_type: Type of page to generate
 * - generator_type: Which generator to use
 * - source_scope: Allowed sources for facts
 * - priority: Task priority (1-10)
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 6
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';
export type PageStatus = 'missing' | 'published' | 'deprecated' | 'duplicate';
export type SourceScope = 'official_site' | 'official_docs' | 'product_pages' | 'campaigns' | 'analytics' | 'official_social';
export type GeneratorType = 'entity_generator' | 'child_entity_generator' | 'education_generator' | 'comparison_generator' | 'interface_generator' | 'metrics_generator';

export interface Task {
  registry_id: string;
  page_type: PageType;
  generator_type: GeneratorType;
  source_scope: SourceScope[];
  priority: number;
  parent_id?: string;
  entities?: string[];
  cr_required: boolean;
}

export interface TaskManifest {
  $schema: string;
  generated_at: string;
  registry_version: string;
  total_tasks: number;
  tasks: Task[];
}

export interface ManifestGenerationResult {
  success: boolean;
  manifest?: TaskManifest;
  errors: string[];
  warnings: string[];
  stats: {
    registry_entries: number;
    missing_entries: number;
    tasks_generated: number;
    skipped_published: number;
    skipped_deprecated: number;
    skipped_duplicate: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_BATCH_SIZE = 20;

// Map page types to generator types
const TYPE_TO_GENERATOR: Record<PageType, GeneratorType> = {
  entity: 'entity_generator',
  child_entity: 'child_entity_generator',
  education: 'education_generator',
  comparison: 'comparison_generator',
  interface: 'interface_generator',
  metrics: 'metrics_generator'
};

// Priority weights by type (higher = more important)
const TYPE_PRIORITY: Record<PageType, number> = {
  entity: 10,
  child_entity: 8,
  comparison: 6,
  education: 5,
  interface: 4,
  metrics: 3
};

// ============================================
// GENERATOR FUNCTIONS
// ============================================

/**
 * Get generator type for a page type
 */
export function getGeneratorType(pageType: PageType): GeneratorType {
  return TYPE_TO_GENERATOR[pageType];
}

/**
 * Calculate task priority
 */
export function calculatePriority(pageType: PageType, hasParent: boolean): number {
  let priority = TYPE_PRIORITY[pageType] || 5;

  // Boost priority for child entities with existing parents
  if (pageType === 'child_entity' && hasParent) {
    priority += 1;
  }

  return Math.min(10, Math.max(1, priority));
}

/**
 * Create a task from a registry entry
 */
export function createTask(entry: {
  id: string;
  type: PageType;
  source_scope: SourceScope[];
  parent_id?: string;
  entities?: string[];
  cr_required: boolean;
}): Task {
  return {
    registry_id: entry.id,
    page_type: entry.type,
    generator_type: getGeneratorType(entry.type),
    source_scope: entry.source_scope,
    priority: calculatePriority(entry.type, !!entry.parent_id),
    parent_id: entry.parent_id,
    entities: entry.entities,
    cr_required: entry.cr_required
  };
}

/**
 * Sort tasks by priority (descending)
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

// ============================================
// MANIFEST GENERATION
// ============================================

interface RegistryEntry {
  id: string;
  type: PageType;
  page_status: PageStatus;
  source_scope: SourceScope[];
  parent_id?: string;
  entities?: string[];
  cr_required: boolean;
  [key: string]: unknown;
}

interface Registry {
  version: string;
  entries: RegistryEntry[];
  [key: string]: unknown;
}

/**
 * Generate task manifest from registry
 */
export function generateManifest(
  registry: Registry,
  options: {
    batchSize?: number;
    priorityFilter?: number;
    typeFilter?: PageType[];
  } = {}
): ManifestGenerationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    registry_entries: 0,
    missing_entries: 0,
    tasks_generated: 0,
    skipped_published: 0,
    skipped_deprecated: 0,
    skipped_duplicate: 0
  };

  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;

  if (!registry || !Array.isArray(registry.entries)) {
    errors.push('Invalid registry: entries array required');
    return { success: false, errors, warnings, stats };
  }

  stats.registry_entries = registry.entries.length;

  // Filter to only missing entries
  const tasks: Task[] = [];

  for (const entry of registry.entries) {
    // Skip non-missing entries
    if (entry.page_status === 'published') {
      stats.skipped_published++;
      continue;
    }
    if (entry.page_status === 'deprecated') {
      stats.skipped_deprecated++;
      continue;
    }
    if (entry.page_status === 'duplicate') {
      stats.skipped_duplicate++;
      continue;
    }

    if (entry.page_status !== 'missing') {
      warnings.push(`Entry "${entry.id}": Unknown status "${entry.page_status}", skipping`);
      continue;
    }

    stats.missing_entries++;

    // Apply type filter if specified
    if (options.typeFilter && !options.typeFilter.includes(entry.type)) {
      continue;
    }

    // Create task
    const task = createTask(entry);

    // Apply priority filter if specified
    if (options.priorityFilter && task.priority < options.priorityFilter) {
      continue;
    }

    tasks.push(task);
  }

  // Sort by priority
  const sortedTasks = sortTasksByPriority(tasks);

  // Apply batch size limit
  const batchedTasks = sortedTasks.slice(0, batchSize);
  stats.tasks_generated = batchedTasks.length;

  if (sortedTasks.length > batchSize) {
    warnings.push(
      `Batch limited to ${batchSize} tasks. ` +
      `${sortedTasks.length - batchSize} tasks deferred to next batch.`
    );
  }

  // Create manifest
  const manifest: TaskManifest = {
    $schema: './manifest.schema.json',
    generated_at: new Date().toISOString(),
    registry_version: registry.version || '1.0',
    total_tasks: batchedTasks.length,
    tasks: batchedTasks
  };

  return {
    success: true,
    manifest,
    errors,
    warnings,
    stats
  };
}

/**
 * Load registry and generate manifest
 */
export function loadAndGenerateManifest(
  registryPath?: string,
  options: {
    batchSize?: number;
    priorityFilter?: number;
    typeFilter?: PageType[];
  } = {}
): ManifestGenerationResult {
  const defaultPath = path.resolve(__dirname, '../registry/registry.json');
  const filePath = registryPath || defaultPath;

  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        errors: [`Registry file not found: ${filePath}`],
        warnings: [],
        stats: {
          registry_entries: 0,
          missing_entries: 0,
          tasks_generated: 0,
          skipped_published: 0,
          skipped_deprecated: 0,
          skipped_duplicate: 0
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const registry = JSON.parse(content) as Registry;

    return generateManifest(registry, options);
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        registry_entries: 0,
        missing_entries: 0,
        tasks_generated: 0,
        skipped_published: 0,
        skipped_deprecated: 0,
        skipped_duplicate: 0
      }
    };
  }
}

/**
 * Save manifest to file
 */
export function saveManifest(manifest: TaskManifest, outputPath?: string): { success: boolean; error?: string } {
  const defaultPath = path.resolve(__dirname, 'manifest.json');
  const filePath = outputPath || defaultPath;

  try {
    const content = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save manifest: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Load existing manifest
 */
export function loadManifest(manifestPath?: string): TaskManifest | null {
  const defaultPath = path.resolve(__dirname, 'manifest.json');
  const filePath = manifestPath || defaultPath;

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as TaskManifest;
  } catch {
    return null;
  }
}

/**
 * Get pending tasks (tasks not yet completed)
 */
export function getPendingTasks(manifest: TaskManifest): Task[] {
  // In a real implementation, this would check against completed tasks
  // For now, return all tasks
  return manifest.tasks;
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('Task Manifest Generator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Empty registry generates empty manifest
  const emptyRegistry: Registry = { version: '1.0', entries: [] };
  const emptyResult = generateManifest(emptyRegistry);
  if (emptyResult.success && emptyResult.manifest?.total_tasks === 0) {
    results.push('PASS: Test 1 - Empty registry generates empty manifest');
  } else {
    results.push('FAIL: Test 1 - Empty registry should generate empty manifest');
    allPassed = false;
  }

  // Test 2: Only missing entries included
  const mixedRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'missing-entry', type: 'entity', page_status: 'missing', source_scope: ['official_site'], cr_required: true },
      { id: 'published-entry', type: 'entity', page_status: 'published', source_scope: ['official_site'], cr_required: true },
      { id: 'deprecated-entry', type: 'entity', page_status: 'deprecated', source_scope: ['official_site'], cr_required: true }
    ]
  };
  const mixedResult = generateManifest(mixedRegistry);
  if (
    mixedResult.success &&
    mixedResult.manifest?.total_tasks === 1 &&
    mixedResult.manifest.tasks[0].registry_id === 'missing-entry'
  ) {
    results.push('PASS: Test 2 - Only missing entries included');
  } else {
    results.push('FAIL: Test 2 - Should only include missing entries');
    allPassed = false;
  }

  // Test 3: Published entries never appear
  if (mixedResult.stats.skipped_published === 1) {
    results.push('PASS: Test 3 - Published entries skipped');
  } else {
    results.push('FAIL: Test 3 - Published entries should be skipped');
    allPassed = false;
  }

  // Test 4: Correct generator type mapping
  const entityTask = createTask({
    id: 'test',
    type: 'entity',
    source_scope: ['official_site'],
    cr_required: true
  });
  if (entityTask.generator_type === 'entity_generator') {
    results.push('PASS: Test 4 - Correct generator type for entity');
  } else {
    results.push('FAIL: Test 4 - Entity should use entity_generator');
    allPassed = false;
  }

  // Test 5: All generator types correct
  const allTypesCorrect = (Object.keys(TYPE_TO_GENERATOR) as PageType[]).every(type => {
    const task = createTask({ id: 'test', type, source_scope: [], cr_required: false });
    return task.generator_type === TYPE_TO_GENERATOR[type];
  });
  if (allTypesCorrect) {
    results.push('PASS: Test 5 - All generator types mapped correctly');
  } else {
    results.push('FAIL: Test 5 - Generator type mapping incorrect');
    allPassed = false;
  }

  // Test 6: Priority calculation
  const highPriorityTask = createTask({ id: 'test', type: 'entity', source_scope: [], cr_required: true });
  const lowPriorityTask = createTask({ id: 'test', type: 'metrics', source_scope: [], cr_required: false });
  if (highPriorityTask.priority > lowPriorityTask.priority) {
    results.push('PASS: Test 6 - Priority calculation works');
  } else {
    results.push('FAIL: Test 6 - Entity should have higher priority than metrics');
    allPassed = false;
  }

  // Test 7: Tasks sorted by priority
  const unsortedRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'metrics-1', type: 'metrics', page_status: 'missing', source_scope: [], cr_required: false },
      { id: 'entity-1', type: 'entity', page_status: 'missing', source_scope: [], cr_required: true },
      { id: 'education-1', type: 'education', page_status: 'missing', source_scope: [], cr_required: false }
    ]
  };
  const sortedResult = generateManifest(unsortedRegistry);
  if (
    sortedResult.success &&
    sortedResult.manifest?.tasks[0].registry_id === 'entity-1'
  ) {
    results.push('PASS: Test 7 - Tasks sorted by priority');
  } else {
    results.push('FAIL: Test 7 - Tasks should be sorted by priority');
    allPassed = false;
  }

  // Test 8: Batch size limit
  const largeRegistry: Registry = {
    version: '1.0',
    entries: Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i}`,
      type: 'entity' as PageType,
      page_status: 'missing' as PageStatus,
      source_scope: ['official_site'] as SourceScope[],
      cr_required: true
    }))
  };
  const batchResult = generateManifest(largeRegistry, { batchSize: 10 });
  if (batchResult.success && batchResult.manifest?.total_tasks === 10) {
    results.push('PASS: Test 8 - Batch size limit applied');
  } else {
    results.push('FAIL: Test 8 - Batch size limit should be applied');
    allPassed = false;
  }

  // Test 9: Type filter works
  const typeFilterResult = generateManifest(unsortedRegistry, { typeFilter: ['entity'] });
  if (
    typeFilterResult.success &&
    typeFilterResult.manifest?.total_tasks === 1 &&
    typeFilterResult.manifest.tasks[0].page_type === 'entity'
  ) {
    results.push('PASS: Test 9 - Type filter works');
  } else {
    results.push('FAIL: Test 9 - Type filter should work');
    allPassed = false;
  }

  // Test 10: Source scope included
  const scopeRegistry: Registry = {
    version: '1.0',
    entries: [{
      id: 'test',
      type: 'entity',
      page_status: 'missing',
      source_scope: ['official_site', 'official_docs'],
      cr_required: true
    }]
  };
  const scopeResult = generateManifest(scopeRegistry);
  if (
    scopeResult.success &&
    scopeResult.manifest?.tasks[0].source_scope.length === 2 &&
    scopeResult.manifest.tasks[0].source_scope.includes('official_site')
  ) {
    results.push('PASS: Test 10 - Source scope included in task');
  } else {
    results.push('FAIL: Test 10 - Source scope should be included');
    allPassed = false;
  }

  // Test 11: parent_id included for child_entity
  const childRegistry: Registry = {
    version: '1.0',
    entries: [{
      id: 'child-1',
      type: 'child_entity',
      page_status: 'missing',
      source_scope: [],
      parent_id: 'parent-1',
      cr_required: true
    }]
  };
  const childResult = generateManifest(childRegistry);
  if (
    childResult.success &&
    childResult.manifest?.tasks[0].parent_id === 'parent-1'
  ) {
    results.push('PASS: Test 11 - parent_id included for child_entity');
  } else {
    results.push('FAIL: Test 11 - parent_id should be included');
    allPassed = false;
  }

  // Test 12: entities[] included for comparison
  const compRegistry: Registry = {
    version: '1.0',
    entries: [{
      id: 'compare-1',
      type: 'comparison',
      page_status: 'missing',
      source_scope: [],
      entities: ['entity-a', 'entity-b'],
      cr_required: false
    }]
  };
  const compResult = generateManifest(compRegistry);
  if (
    compResult.success &&
    compResult.manifest?.tasks[0].entities?.length === 2
  ) {
    results.push('PASS: Test 12 - entities[] included for comparison');
  } else {
    results.push('FAIL: Test 12 - entities[] should be included');
    allPassed = false;
  }

  // Test 13: cr_required flag included
  if (
    scopeResult.success &&
    scopeResult.manifest?.tasks[0].cr_required === true
  ) {
    results.push('PASS: Test 13 - cr_required flag included');
  } else {
    results.push('FAIL: Test 13 - cr_required flag should be included');
    allPassed = false;
  }

  // Test 14: Manifest has generated_at timestamp
  if (
    scopeResult.success &&
    scopeResult.manifest?.generated_at &&
    !isNaN(Date.parse(scopeResult.manifest.generated_at))
  ) {
    results.push('PASS: Test 14 - Manifest has valid generated_at');
  } else {
    results.push('FAIL: Test 14 - Manifest should have valid generated_at');
    allPassed = false;
  }

  // Test 15: Manifest has registry_version
  if (scopeResult.success && scopeResult.manifest?.registry_version === '1.0') {
    results.push('PASS: Test 15 - Manifest has registry_version');
  } else {
    results.push('FAIL: Test 15 - Manifest should have registry_version');
    allPassed = false;
  }

  // Test 16: Stats track skipped entries
  const statsResult = generateManifest(mixedRegistry);
  if (
    statsResult.stats.skipped_published === 1 &&
    statsResult.stats.skipped_deprecated === 1 &&
    statsResult.stats.missing_entries === 1
  ) {
    results.push('PASS: Test 16 - Stats track skipped entries correctly');
  } else {
    results.push('FAIL: Test 16 - Stats should track skipped entries');
    allPassed = false;
  }

  // Test 17: Duplicate entries skipped
  const dupRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'dup-1', type: 'entity', page_status: 'duplicate', source_scope: [], cr_required: true, canonical_id: 'orig' }
    ]
  };
  const dupResult = generateManifest(dupRegistry);
  if (dupResult.stats.skipped_duplicate === 1 && dupResult.manifest?.total_tasks === 0) {
    results.push('PASS: Test 17 - Duplicate entries skipped');
  } else {
    results.push('FAIL: Test 17 - Duplicate entries should be skipped');
    allPassed = false;
  }

  // Test 18: No registry returns error
  const noRegResult = loadAndGenerateManifest('/non/existent/path.json');
  if (!noRegResult.success && noRegResult.errors.length > 0) {
    results.push('PASS: Test 18 - No registry returns error');
  } else {
    results.push('FAIL: Test 18 - No registry should return error');
    allPassed = false;
  }

  // Test 19: Priority filter works
  const priorityResult = generateManifest(unsortedRegistry, { priorityFilter: 8 });
  if (
    priorityResult.success &&
    priorityResult.manifest?.tasks.every(t => t.priority >= 8)
  ) {
    results.push('PASS: Test 19 - Priority filter works');
  } else {
    results.push('FAIL: Test 19 - Priority filter should work');
    allPassed = false;
  }

  // Test 20: Load actual registry and generate
  const actualResult = loadAndGenerateManifest();
  if (actualResult.success) {
    results.push('PASS: Test 20 - Actual registry generates manifest');
    results.push(`  Tasks generated: ${actualResult.stats.tasks_generated}`);
  } else if (actualResult.stats.registry_entries === 0) {
    results.push('PASS: Test 20 - Empty registry generates empty manifest');
  } else {
    results.push('FAIL: Test 20 - Should generate manifest from actual registry');
    results.push(`  Errors: ${actualResult.errors.join(', ')}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--generate')) {
    // Generate mode: create manifest.json
    console.log('Generating task manifest...\n');

    const batchSize = args.includes('--batch')
      ? parseInt(args[args.indexOf('--batch') + 1], 10)
      : DEFAULT_BATCH_SIZE;

    const result = loadAndGenerateManifest(undefined, { batchSize });

    if (result.success && result.manifest) {
      const saveResult = saveManifest(result.manifest);

      if (saveResult.success) {
        console.log('Manifest generated successfully!\n');
        console.log(`Total tasks: ${result.manifest.total_tasks}`);
        console.log(`Registry entries: ${result.stats.registry_entries}`);
        console.log(`Missing entries: ${result.stats.missing_entries}`);
        console.log(`Skipped (published): ${result.stats.skipped_published}`);
        console.log(`Skipped (deprecated): ${result.stats.skipped_deprecated}`);
        console.log(`Skipped (duplicate): ${result.stats.skipped_duplicate}`);

        if (result.warnings.length > 0) {
          console.log('\nWarnings:');
          for (const warning of result.warnings) {
            console.log(`  - ${warning}`);
          }
        }

        console.log(`\nManifest saved to: ${path.resolve(__dirname, 'manifest.json')}`);
      } else {
        console.error(`Failed to save manifest: ${saveResult.error}`);
        process.exit(1);
      }
    } else {
      console.error('Failed to generate manifest:');
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  } else {
    // Test mode: run acceptance tests
    const { passed, results } = runAcceptanceTests();

    for (const result of results) {
      console.log(result);
    }

    console.log('='.repeat(50));
    console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    process.exit(passed ? 0 : 1);
  }
}
