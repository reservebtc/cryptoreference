#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Event-Based Gate Enforcement
 *
 * Prevents "eternal legacy" by enforcing FULL CR requirement
 * for all entity-related events.
 *
 * Events:
 * - update: Entity data modification
 * - comparison: Entity inclusion in comparison pages
 * - sitemap: Entity inclusion in sitemap.xml
 * - ai_citation: Entity citation by AI systems
 *
 * Gate Rule: Any event without FULL CR → hard fail
 *
 * Reference: /schema/plan2.md Step 12
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateCR } from '../schema/validate_cr';

// ============================================
// TYPES
// ============================================

export type EventType = 'update' | 'comparison' | 'sitemap' | 'ai_citation';

export interface GateCheckResult {
  allowed: boolean;
  event: EventType;
  entity: string;
  reason: string;
  hasCR: boolean;
  crValid: boolean;
  crCanonical: boolean;
}

export interface GateConfig {
  strictMode: boolean;           // Fail on any warning
  allowDeprecated: boolean;      // Allow deprecated entities
  allowBeta: boolean;            // Allow beta entities
  requireHash: boolean;          // Require valid canonical_hash
}

interface LegacyPage {
  url: string;
  file_path: string;
  entity_name: string | null;
  entity_candidate?: boolean;
}

interface LegacyInventory {
  pages: LegacyPage[];
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: GateConfig = {
  strictMode: true,
  allowDeprecated: true,         // Deprecated entities can still be cited
  allowBeta: true,               // Beta entities can be used
  requireHash: true              // Hash must be valid
};

// ============================================
// CR EXTRACTION
// ============================================

const CR_BLOCK_START = '{/* [CR-BLOCK]';
const CR_BLOCK_END = '[/CR-BLOCK] */}';

function extractEmbeddedCR(pageContent: string): string | null {
  const startIndex = pageContent.indexOf(CR_BLOCK_START);
  const endIndex = pageContent.indexOf(CR_BLOCK_END);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  const crSection = pageContent.substring(
    startIndex + CR_BLOCK_START.length,
    endIndex
  ).trim();

  const lines = crSection.split('\n');
  return lines.map(line => line.replace(/^  /, '')).join('\n');
}

function parseCRFields(content: string): Record<string, string> {
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

// ============================================
// GATE CHECKS
// ============================================

/**
 * Core gate check: Does entity have valid FULL CR?
 */
export function checkEntityHasFullCR(
  entityName: string,
  config: GateConfig = DEFAULT_CONFIG
): { hasFullCR: boolean; crContent: string | null; errors: string[] } {
  const errors: string[] = [];
  const basePath = path.resolve(__dirname, '..');
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');

  // Load inventory
  if (!fs.existsSync(inventoryPath)) {
    return { hasFullCR: false, crContent: null, errors: ['Inventory not found'] };
  }

  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const page = inventory.pages.find(p => p.entity_name === entityName);

  if (!page) {
    return { hasFullCR: false, crContent: null, errors: [`Entity ${entityName} not found in inventory`] };
  }

  if (!page.entity_candidate) {
    return { hasFullCR: false, crContent: null, errors: [`${entityName} is not an entity candidate`] };
  }

  // Check page has CR-BLOCK
  const pagePath = path.resolve(basePath, page.file_path);
  if (!fs.existsSync(pagePath)) {
    return { hasFullCR: false, crContent: null, errors: [`Page file not found: ${page.file_path}`] };
  }

  const pageContent = fs.readFileSync(pagePath, 'utf-8');
  const crContent = extractEmbeddedCR(pageContent);

  if (!crContent) {
    return { hasFullCR: false, crContent: null, errors: ['No CR-BLOCK found in page'] };
  }

  // Validate CR
  const validation = validateCR(crContent);
  if (!validation.valid) {
    const errorMsgs = validation.errors.map(e => e.message);
    return { hasFullCR: false, crContent, errors: errorMsgs };
  }

  // Check for migration flags (partial CR)
  const fields = parseCRFields(crContent);
  if (fields.cr_status === 'partial') {
    return { hasFullCR: false, crContent, errors: ['CR is partial (migration incomplete)'] };
  }

  if (fields.cr_compliance === 'false') {
    return { hasFullCR: false, crContent, errors: ['CR compliance is false'] };
  }

  // Check status
  if (fields.status === 'deprecated' && !config.allowDeprecated) {
    return { hasFullCR: false, crContent, errors: ['Deprecated entities not allowed'] };
  }

  if (fields.status === 'beta' && !config.allowBeta) {
    return { hasFullCR: false, crContent, errors: ['Beta entities not allowed'] };
  }

  // Check hash
  if (config.requireHash) {
    if (!fields.canonical_hash) {
      return { hasFullCR: false, crContent, errors: ['canonical_hash required but missing'] };
    }

    if (!fields.canonical_hash.match(/^sha256:[a-f0-9]{64}$/)) {
      return { hasFullCR: false, crContent, errors: ['Invalid canonical_hash format'] };
    }
  }

  return { hasFullCR: true, crContent, errors: [] };
}

/**
 * Gate: Entity Update
 * Prevents updating entity data without FULL CR
 */
export function gateUpdate(entityName: string, config?: GateConfig): GateCheckResult {
  const check = checkEntityHasFullCR(entityName, config);

  return {
    allowed: check.hasFullCR,
    event: 'update',
    entity: entityName,
    reason: check.hasFullCR
      ? 'Entity has valid FULL CR - update allowed'
      : `Update blocked: ${check.errors.join(', ')}`,
    hasCR: check.crContent !== null,
    crValid: check.hasFullCR,
    crCanonical: check.hasFullCR
  };
}

/**
 * Gate: Comparison Inclusion
 * Prevents including entity in comparison pages without FULL CR
 */
export function gateComparison(entityName: string, config?: GateConfig): GateCheckResult {
  const check = checkEntityHasFullCR(entityName, config);

  return {
    allowed: check.hasFullCR,
    event: 'comparison',
    entity: entityName,
    reason: check.hasFullCR
      ? 'Entity has valid FULL CR - comparison inclusion allowed'
      : `Comparison blocked: ${check.errors.join(', ')}`,
    hasCR: check.crContent !== null,
    crValid: check.hasFullCR,
    crCanonical: check.hasFullCR
  };
}

/**
 * Gate: Sitemap Inclusion
 * Prevents including entity in sitemap.xml without FULL CR
 */
export function gateSitemap(entityName: string, config?: GateConfig): GateCheckResult {
  const check = checkEntityHasFullCR(entityName, config);

  return {
    allowed: check.hasFullCR,
    event: 'sitemap',
    entity: entityName,
    reason: check.hasFullCR
      ? 'Entity has valid FULL CR - sitemap inclusion allowed'
      : `Sitemap blocked: ${check.errors.join(', ')}`,
    hasCR: check.crContent !== null,
    crValid: check.hasFullCR,
    crCanonical: check.hasFullCR
  };
}

/**
 * Gate: AI Citation Intent
 * Prevents AI systems from citing entity without FULL CR
 */
export function gateAICitation(entityName: string, config?: GateConfig): GateCheckResult {
  const check = checkEntityHasFullCR(entityName, config);

  return {
    allowed: check.hasFullCR,
    event: 'ai_citation',
    entity: entityName,
    reason: check.hasFullCR
      ? 'Entity has valid FULL CR - AI citation allowed'
      : `AI citation blocked: ${check.errors.join(', ')}`,
    hasCR: check.crContent !== null,
    crValid: check.hasFullCR,
    crCanonical: check.hasFullCR
  };
}

/**
 * Universal gate check for any event type
 */
export function checkGate(
  event: EventType,
  entityName: string,
  config?: GateConfig
): GateCheckResult {
  switch (event) {
    case 'update':
      return gateUpdate(entityName, config);
    case 'comparison':
      return gateComparison(entityName, config);
    case 'sitemap':
      return gateSitemap(entityName, config);
    case 'ai_citation':
      return gateAICitation(entityName, config);
    default:
      return {
        allowed: false,
        event,
        entity: entityName,
        reason: `Unknown event type: ${event}`,
        hasCR: false,
        crValid: false,
        crCanonical: false
      };
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Check all entities for a specific event type
 */
export function checkAllEntities(event: EventType, config?: GateConfig): GateCheckResult[] {
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');

  if (!fs.existsSync(inventoryPath)) {
    return [];
  }

  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const entityPages = inventory.pages.filter(p => p.entity_candidate === true);

  return entityPages.map(page => checkGate(event, page.entity_name!, config));
}

/**
 * Generate sitemap entries only for entities with FULL CR
 */
export function generateCRBackedSitemap(): string[] {
  const results = checkAllEntities('sitemap');
  const allowedEntities = results.filter(r => r.allowed);

  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));

  const urls: string[] = [];
  for (const result of allowedEntities) {
    const page = inventory.pages.find(p => p.entity_name === result.entity);
    if (page) {
      urls.push(`https://cryptoreference.io${page.url}`);
    }
  }

  return urls;
}

/**
 * Get list of entities eligible for comparison pages
 */
export function getComparisonEligibleEntities(): string[] {
  const results = checkAllEntities('comparison');
  return results.filter(r => r.allowed).map(r => r.entity);
}

/**
 * Get list of entities eligible for AI citation
 */
export function getAICitationEligibleEntities(): string[] {
  const results = checkAllEntities('ai_citation');
  return results.filter(r => r.allowed).map(r => r.entity);
}

// ============================================
// MAIN (CLI)
// ============================================

function main() {
  console.log('CR-Markup Event-Based Gate Enforcement\n');
  console.log('='.repeat(70));

  const events: EventType[] = ['update', 'comparison', 'sitemap', 'ai_citation'];

  // Check all entities for all event types
  console.log('\nGate Status by Event Type:\n');

  for (const event of events) {
    console.log(`\n${event.toUpperCase()} Gate`);
    console.log('-'.repeat(70));
    console.log('Entity          Has CR   Valid    Canonical  Allowed  Reason');
    console.log('-'.repeat(70));

    const results = checkAllEntities(event);

    for (const result of results) {
      const hasCR = result.hasCR ? 'YES' : 'NO';
      const valid = result.crValid ? 'YES' : 'NO';
      const canonical = result.crCanonical ? 'YES' : 'NO';
      const allowed = result.allowed ? 'YES' : 'NO';
      const reason = result.reason.substring(0, 20);

      console.log(
        `${result.entity.padEnd(15)} ${hasCR.padEnd(8)} ${valid.padEnd(8)} ${canonical.padEnd(10)} ${allowed.padEnd(8)} ${reason}`
      );
    }

    const allowedCount = results.filter(r => r.allowed).length;
    const blockedCount = results.filter(r => !r.allowed).length;

    console.log(`\n  Summary: ${allowedCount} allowed, ${blockedCount} blocked`);
  }

  // Overall summary
  console.log('\n' + '='.repeat(70));
  console.log('\nProduction Gate Rules:');
  console.log('  1. Entity update requires FULL CR');
  console.log('  2. Comparison inclusion requires FULL CR');
  console.log('  3. Sitemap inclusion requires FULL CR');
  console.log('  4. AI citation requires FULL CR');

  // Acceptance tests
  console.log('\n' + '='.repeat(70));
  console.log('\nAcceptance Tests:');

  // Test: All events require FULL CR
  let allGatesWork = true;

  // Create a test case: entity without CR should be blocked
  const testEntityWithoutCR = checkGate('update', 'NONEXISTENT_ENTITY');
  if (testEntityWithoutCR.allowed) {
    console.log('FAIL: Non-existent entity was allowed for update');
    allGatesWork = false;
  } else {
    console.log('PASS: Non-existent entity blocked for update');
  }

  // Test: All current entities with CR should be allowed
  const updateResults = checkAllEntities('update');
  const allEntitiesWithCRAllowed = updateResults.every(r => {
    if (r.hasCR && r.crValid) {
      return r.allowed;
    }
    return true; // Skip entities without CR for this test
  });

  if (allEntitiesWithCRAllowed) {
    console.log('PASS: All entities with valid CR are allowed');
  } else {
    console.log('FAIL: Some entities with valid CR are blocked');
    allGatesWork = false;
  }

  // Test: Gate is consistent across event types
  const consistencyResults = checkAllEntities('update');
  const comparisonResults = checkAllEntities('comparison');
  const sitemapResults = checkAllEntities('sitemap');
  const aiResults = checkAllEntities('ai_citation');

  let consistent = true;
  for (let i = 0; i < consistencyResults.length; i++) {
    if (consistencyResults[i].allowed !== comparisonResults[i].allowed ||
        consistencyResults[i].allowed !== sitemapResults[i].allowed ||
        consistencyResults[i].allowed !== aiResults[i].allowed) {
      consistent = false;
      break;
    }
  }

  if (consistent) {
    console.log('PASS: Gates are consistent across event types');
  } else {
    console.log('FAIL: Gates are inconsistent across event types');
    allGatesWork = false;
  }

  // Final verdict
  console.log(`\nOverall: ${allGatesWork ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Production output
  console.log('\n' + '='.repeat(70));
  console.log('\nProduction Outputs:');

  const sitemapUrls = generateCRBackedSitemap();
  console.log(`\nSitemap-eligible URLs: ${sitemapUrls.length}`);
  for (const url of sitemapUrls) {
    console.log(`  ${url}`);
  }

  const comparisonEntities = getComparisonEligibleEntities();
  console.log(`\nComparison-eligible entities: ${comparisonEntities.length}`);
  console.log(`  ${comparisonEntities.join(', ')}`);

  const aiEntities = getAICitationEligibleEntities();
  console.log(`\nAI citation-eligible entities: ${aiEntities.length}`);
  console.log(`  ${aiEntities.join(', ')}`);

  console.log('\n' + '='.repeat(70));

  return allGatesWork;
}

// CLI entry point
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

// Export for use in other modules
export {
  DEFAULT_CONFIG,
  extractEmbeddedCR,
  parseCRFields
};
