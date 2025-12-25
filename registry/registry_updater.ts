/**
 * Registry Update After Publish
 *
 * Persists memory deterministically:
 * - Updates page_status from 'missing' to 'published' after successful publish
 * - Writes back to registry atomically
 * - Blocks manual edits to published entries
 * - Ensures registry is the single source of truth
 *
 * Reference: plan3.md Step 12
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export type PageStatus = 'missing' | 'published' | 'deprecated' | 'duplicate';

export interface RegistryEntry {
  id: string;
  type: string;
  page_status: PageStatus;
  cr_required: boolean;
  parent_id?: string;
  entities?: string[];
  source_scope?: string[];
  published_at?: string;
  published_hash?: string;
  last_modified?: string;
}

export interface Registry {
  $schema?: string;
  version: string;
  entries: RegistryEntry[];
  last_updated?: string;
}

export interface PublishResult {
  registry_id: string;
  content_hash: string;
  published_at: string;
}

export interface UpdateResult {
  success: boolean;
  updated_entries: string[];
  errors: string[];
  warnings: string[];
  registry_hash: string;
}

export interface RegistryDiff {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Valid status transitions
 */
export const VALID_TRANSITIONS: Record<PageStatus, PageStatus[]> = {
  'missing': ['published'],
  'published': ['deprecated'],
  'deprecated': [],  // Terminal state
  'duplicate': []    // Terminal state
};

/**
 * Immutable statuses - cannot be modified after set
 */
export const IMMUTABLE_STATUSES: PageStatus[] = ['published', 'deprecated', 'duplicate'];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Calculate hash of registry content for integrity checking
 */
export function calculateRegistryHash(registry: Registry): string {
  const content = JSON.stringify(registry.entries.map(e => ({
    id: e.id,
    type: e.type,
    page_status: e.page_status,
    cr_required: e.cr_required
  })).sort((a, b) => a.id.localeCompare(b.id)));

  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: PageStatus, to: PageStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Check if an entry can be modified
 */
export function canModifyEntry(entry: RegistryEntry): { allowed: boolean; reason?: string } {
  if (IMMUTABLE_STATUSES.includes(entry.page_status)) {
    return {
      allowed: false,
      reason: `Entry "${entry.id}" has status "${entry.page_status}" which is immutable`
    };
  }
  return { allowed: true };
}

/**
 * Update a single entry's status after successful publish
 */
export function updateEntryStatus(
  entry: RegistryEntry,
  publishResult: PublishResult
): { entry: RegistryEntry; error?: string } {
  // Verify IDs match
  if (entry.id !== publishResult.registry_id) {
    return {
      entry,
      error: `ID mismatch: entry "${entry.id}" != publish "${publishResult.registry_id}"`
    };
  }

  // Check if modification is allowed
  const canModify = canModifyEntry(entry);
  if (!canModify.allowed) {
    return { entry, error: canModify.reason };
  }

  // Check valid transition
  if (!isValidTransition(entry.page_status, 'published')) {
    return {
      entry,
      error: `Invalid transition: "${entry.page_status}" → "published" for "${entry.id}"`
    };
  }

  // Create updated entry
  const updatedEntry: RegistryEntry = {
    ...entry,
    page_status: 'published',
    published_at: publishResult.published_at,
    published_hash: publishResult.content_hash,
    last_modified: new Date().toISOString()
  };

  return { entry: updatedEntry };
}

/**
 * Update registry with multiple publish results
 */
export function updateRegistry(
  registry: Registry,
  publishResults: PublishResult[]
): UpdateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const updatedEntries: string[] = [];

  // Create a map for quick lookup
  const resultsMap = new Map(publishResults.map(r => [r.registry_id, r]));

  // Update entries
  const newEntries = registry.entries.map(entry => {
    const publishResult = resultsMap.get(entry.id);

    if (!publishResult) {
      // No update for this entry
      return entry;
    }

    const { entry: updatedEntry, error } = updateEntryStatus(entry, publishResult);

    if (error) {
      errors.push(error);
      return entry;  // Keep original on error
    }

    updatedEntries.push(entry.id);
    return updatedEntry;
  });

  // Check for publish results that don't match any entry
  for (const result of publishResults) {
    const exists = registry.entries.some(e => e.id === result.registry_id);
    if (!exists) {
      errors.push(`Publish result for unknown registry_id: "${result.registry_id}"`);
    }
  }

  // Create updated registry
  const updatedRegistry: Registry = {
    ...registry,
    entries: newEntries,
    last_updated: new Date().toISOString()
  };

  const registryHash = calculateRegistryHash(updatedRegistry);

  return {
    success: errors.length === 0,
    updated_entries: updatedEntries,
    errors,
    warnings,
    registry_hash: registryHash
  };
}

/**
 * Write registry to file atomically
 */
export function writeRegistry(registryPath: string, registry: Registry): { success: boolean; error?: string } {
  try {
    // Write to temp file first
    const tempPath = `${registryPath}.tmp`;
    const content = JSON.stringify(registry, null, 2) + '\n';

    fs.writeFileSync(tempPath, content, 'utf-8');

    // Atomic rename
    fs.renameSync(tempPath, registryPath);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write registry: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Load registry from file
 */
export function loadRegistry(registryPath: string): { registry?: Registry; error?: string } {
  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(content) as Registry;
    return { registry };
  } catch (error) {
    return {
      error: `Failed to load registry: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Compare two registries and return differences
 */
export function diffRegistries(oldRegistry: Registry, newRegistry: Registry): RegistryDiff {
  const oldIds = new Set(oldRegistry.entries.map(e => e.id));
  const newIds = new Set(newRegistry.entries.map(e => e.id));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];

  // Find added and modified
  for (const entry of newRegistry.entries) {
    if (!oldIds.has(entry.id)) {
      added.push(entry.id);
    } else {
      const oldEntry = oldRegistry.entries.find(e => e.id === entry.id);
      if (oldEntry && JSON.stringify(oldEntry) !== JSON.stringify(entry)) {
        modified.push(entry.id);
      } else {
        unchanged.push(entry.id);
      }
    }
  }

  // Find removed
  for (const entry of oldRegistry.entries) {
    if (!newIds.has(entry.id)) {
      removed.push(entry.id);
    }
  }

  return { added, removed, modified, unchanged };
}

/**
 * Validate that published entries haven't been manually modified
 */
export function validateNoManualEdits(
  originalRegistry: Registry,
  currentRegistry: Registry
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const currentEntry of currentRegistry.entries) {
    const originalEntry = originalRegistry.entries.find(e => e.id === currentEntry.id);

    if (!originalEntry) continue;

    // Check if a published entry was modified
    if (originalEntry.page_status === 'published') {
      // Only certain fields should change
      const allowedChanges = ['last_modified'];

      for (const key of Object.keys(currentEntry) as Array<keyof RegistryEntry>) {
        if (allowedChanges.includes(key)) continue;

        if (JSON.stringify(originalEntry[key]) !== JSON.stringify(currentEntry[key])) {
          errors.push(
            `Manual edit detected: "${currentEntry.id}" field "${key}" was modified (published entries are immutable)`
          );
        }
      }
    }

    // Check for invalid status changes
    if (originalEntry.page_status !== currentEntry.page_status) {
      if (!isValidTransition(originalEntry.page_status, currentEntry.page_status)) {
        errors.push(
          `Invalid status change: "${currentEntry.id}" from "${originalEntry.page_status}" to "${currentEntry.page_status}"`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get entries that are ready for publishing (status = missing)
 */
export function getPublishableEntries(registry: Registry): RegistryEntry[] {
  return registry.entries.filter(e => e.page_status === 'missing');
}

/**
 * Check if re-running publish would create new pages
 */
export function wouldCreateNewPages(
  registry: Registry,
  publishResults: PublishResult[]
): { wouldCreate: boolean; newPages: string[] } {
  const publishedIds = new Set(
    registry.entries
      .filter(e => e.page_status === 'published')
      .map(e => e.id)
  );

  const newPages = publishResults
    .filter(r => publishedIds.has(r.registry_id))
    .map(r => r.registry_id);

  return {
    wouldCreate: newPages.length > 0,
    newPages
  };
}

/**
 * Full publish workflow: update registry after successful publishes
 */
export function executePublishWorkflow(
  registryPath: string,
  publishResults: PublishResult[]
): UpdateResult {
  // Load current registry
  const loadResult = loadRegistry(registryPath);
  if (loadResult.error || !loadResult.registry) {
    return {
      success: false,
      updated_entries: [],
      errors: [loadResult.error || 'Failed to load registry'],
      warnings: [],
      registry_hash: ''
    };
  }

  const registry = loadResult.registry;

  // Check for duplicate publishes
  const duplicateCheck = wouldCreateNewPages(registry, publishResults);
  if (duplicateCheck.wouldCreate) {
    return {
      success: false,
      updated_entries: [],
      errors: [`Re-publish attempt for already published entries: ${duplicateCheck.newPages.join(', ')}`],
      warnings: [],
      registry_hash: calculateRegistryHash(registry)
    };
  }

  // Update registry
  const updateResult = updateRegistry(registry, publishResults);

  if (!updateResult.success) {
    return updateResult;
  }

  // Write updated registry
  const updatedRegistry: Registry = {
    ...registry,
    entries: registry.entries.map(entry => {
      const publishResult = publishResults.find(r => r.registry_id === entry.id);
      if (publishResult && entry.page_status === 'missing') {
        return {
          ...entry,
          page_status: 'published' as PageStatus,
          published_at: publishResult.published_at,
          published_hash: publishResult.content_hash,
          last_modified: new Date().toISOString()
        };
      }
      return entry;
    }),
    last_updated: new Date().toISOString()
  };

  const writeResult = writeRegistry(registryPath, updatedRegistry);

  if (!writeResult.success) {
    return {
      success: false,
      updated_entries: [],
      errors: [writeResult.error || 'Failed to write registry'],
      warnings: [],
      registry_hash: ''
    };
  }

  return {
    ...updateResult,
    registry_hash: calculateRegistryHash(updatedRegistry)
  };
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('Registry Update After Publish - Acceptance Tests\n');
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

  // Sample registry
  const sampleRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'exchange-a', type: 'entity', page_status: 'missing', cr_required: true },
      { id: 'exchange-b', type: 'entity', page_status: 'published', cr_required: true, published_at: '2024-01-01' },
      { id: 'guide-1', type: 'education', page_status: 'missing', cr_required: false }
    ]
  };

  // Sample publish result
  const publishResult: PublishResult = {
    registry_id: 'exchange-a',
    content_hash: 'abc123def456',
    published_at: new Date().toISOString()
  };

  // Test 1: Valid transition missing → published
  test('Test 1 - Valid transition missing to published', () => {
    return isValidTransition('missing', 'published') === true;
  });

  // Test 2: Invalid transition published → missing
  test('Test 2 - Invalid transition published to missing', () => {
    return isValidTransition('published', 'missing') === false;
  });

  // Test 3: Valid transition published → deprecated
  test('Test 3 - Valid transition published to deprecated', () => {
    return isValidTransition('published', 'deprecated') === true;
  });

  // Test 4: Deprecated is terminal
  test('Test 4 - Deprecated is terminal state', () => {
    return isValidTransition('deprecated', 'published') === false &&
           isValidTransition('deprecated', 'missing') === false;
  });

  // Test 5: Can modify missing entry
  test('Test 5 - Can modify missing entry', () => {
    const entry: RegistryEntry = { id: 'test', type: 'entity', page_status: 'missing', cr_required: true };
    return canModifyEntry(entry).allowed === true;
  });

  // Test 6: Cannot modify published entry
  test('Test 6 - Cannot modify published entry', () => {
    const entry: RegistryEntry = { id: 'test', type: 'entity', page_status: 'published', cr_required: true };
    return canModifyEntry(entry).allowed === false;
  });

  // Test 7: Update entry status works
  test('Test 7 - Update entry status works', () => {
    const entry: RegistryEntry = { id: 'exchange-a', type: 'entity', page_status: 'missing', cr_required: true };
    const result = updateEntryStatus(entry, publishResult);
    return result.entry.page_status === 'published' && result.error === undefined;
  });

  // Test 8: Update fails for already published
  test('Test 8 - Update fails for already published', () => {
    const entry: RegistryEntry = { id: 'exchange-a', type: 'entity', page_status: 'published', cr_required: true };
    const result = updateEntryStatus(entry, publishResult);
    return result.error !== undefined;
  });

  // Test 9: Update registry works
  test('Test 9 - Update registry works', () => {
    const result = updateRegistry(sampleRegistry, [publishResult]);
    return result.success && result.updated_entries.includes('exchange-a');
  });

  // Test 10: Update registry fails for unknown ID
  test('Test 10 - Unknown registry_id fails', () => {
    const badResult: PublishResult = { ...publishResult, registry_id: 'nonexistent' };
    const result = updateRegistry(sampleRegistry, [badResult]);
    return result.errors.some(e => e.includes('unknown registry_id'));
  });

  // Test 11: Registry hash is consistent
  test('Test 11 - Registry hash is consistent', () => {
    const hash1 = calculateRegistryHash(sampleRegistry);
    const hash2 = calculateRegistryHash(sampleRegistry);
    return hash1 === hash2 && hash1.length === 16;
  });

  // Test 12: Registry hash changes with content
  test('Test 12 - Registry hash changes with content', () => {
    const modifiedRegistry = {
      ...sampleRegistry,
      entries: [...sampleRegistry.entries, { id: 'new', type: 'entity', page_status: 'missing' as PageStatus, cr_required: true }]
    };
    const hash1 = calculateRegistryHash(sampleRegistry);
    const hash2 = calculateRegistryHash(modifiedRegistry);
    return hash1 !== hash2;
  });

  // Test 13: Diff detects added entries
  test('Test 13 - Diff detects added entries', () => {
    const newRegistry = {
      ...sampleRegistry,
      entries: [...sampleRegistry.entries, { id: 'new-entry', type: 'entity', page_status: 'missing' as PageStatus, cr_required: true }]
    };
    const diff = diffRegistries(sampleRegistry, newRegistry);
    return diff.added.includes('new-entry');
  });

  // Test 14: Diff detects removed entries
  test('Test 14 - Diff detects removed entries', () => {
    const newRegistry = {
      ...sampleRegistry,
      entries: sampleRegistry.entries.slice(1)
    };
    const diff = diffRegistries(sampleRegistry, newRegistry);
    return diff.removed.includes('exchange-a');
  });

  // Test 15: Diff detects modified entries
  test('Test 15 - Diff detects modified entries', () => {
    const newRegistry = {
      ...sampleRegistry,
      entries: sampleRegistry.entries.map(e =>
        e.id === 'exchange-a' ? { ...e, page_status: 'published' as PageStatus } : e
      )
    };
    const diff = diffRegistries(sampleRegistry, newRegistry);
    return diff.modified.includes('exchange-a');
  });

  // Test 16: Manual edit detection works
  test('Test 16 - Manual edit detection works', () => {
    const publishedRegistry: Registry = {
      version: '1.0',
      entries: [{ id: 'test', type: 'entity', page_status: 'published', cr_required: true }]
    };
    const tamperedRegistry: Registry = {
      version: '1.0',
      entries: [{ id: 'test', type: 'entity', page_status: 'published', cr_required: false }]  // Changed!
    };
    const result = validateNoManualEdits(publishedRegistry, tamperedRegistry);
    return !result.valid && result.errors.length > 0;
  });

  // Test 17: Get publishable entries works
  test('Test 17 - Get publishable entries works', () => {
    const entries = getPublishableEntries(sampleRegistry);
    return entries.length === 2 && entries.every(e => e.page_status === 'missing');
  });

  // Test 18: Re-publish detection works
  test('Test 18 - Re-publish detection works', () => {
    const result: PublishResult = { registry_id: 'exchange-b', content_hash: 'xyz', published_at: new Date().toISOString() };
    const check = wouldCreateNewPages(sampleRegistry, [result]);
    return check.wouldCreate && check.newPages.includes('exchange-b');
  });

  // Test 19: Multiple updates work
  test('Test 19 - Multiple updates work', () => {
    const results: PublishResult[] = [
      publishResult,
      { registry_id: 'guide-1', content_hash: 'def789', published_at: new Date().toISOString() }
    ];
    const result = updateRegistry(sampleRegistry, results);
    return result.updated_entries.length === 2;
  });

  // Test 20: ID mismatch detected
  test('Test 20 - ID mismatch detected', () => {
    const entry: RegistryEntry = { id: 'different-id', type: 'entity', page_status: 'missing', cr_required: true };
    const result = updateEntryStatus(entry, publishResult);
    return result.error !== undefined && result.error.includes('mismatch');
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
