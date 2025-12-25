#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Legacy Page Lock
 *
 * Marks entity candidates without CR as locked (read-only).
 * Generates enforcement rules for the build pipeline.
 *
 * Reference: /schema/plan2.md Step 2
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

type PageType = 'entity' | 'index' | 'comparison' | 'article' | 'tool' | 'misc';
type PageStatus = 'legacy' | 'non-entity';

interface LegacyPage {
  url: string;
  file_path: string;
  entity_name: string | null;
  page_type: PageType;
  cr_presence: boolean;
  status: PageStatus;
  legacy_formats: {
    schema_org: boolean;
    json_ld: boolean;
    ai_json: boolean;
  };
  metadata: {
    has_affiliate_links: boolean;
    has_marketing_language: boolean;
    last_scanned: string;
  };
  entity_candidate: boolean;
  // Step 2 additions
  cr_compliance?: boolean;
  locked?: boolean;
  lock_reason?: string;
}

interface LegacyInventory {
  version: string;
  generated_at: string;
  summary: {
    total_pages: number;
    entity_pages: number;
    non_entity_pages: number;
    pages_with_cr: number;
    pages_without_cr: number;
    pages_with_legacy_formats: number;
    entity_candidates: number;
    non_entity_candidates: number;
    // Step 2 additions
    locked_pages?: number;
    compliant_pages?: number;
  };
  pages: LegacyPage[];
}

interface EnforcementRules {
  version: string;
  generated_at: string;
  rules: {
    locked_files: string[];
    blocked_from_comparison: string[];
    blocked_from_sitemap: string[];
  };
  validation: {
    require_cr_for_entity_update: boolean;
    fail_build_on_legacy_publish: boolean;
  };
}

// ============================================
// LOCK LOGIC
// ============================================

function lockLegacyPages(inventory: LegacyInventory): void {
  for (const page of inventory.pages) {
    // Entity candidates without CR are locked
    if (page.entity_candidate && !page.cr_presence) {
      page.cr_compliance = false;
      page.locked = true;
      page.lock_reason = 'Entity page without CR-Markup';
    } else if (page.entity_candidate && page.cr_presence) {
      // Entity with CR is compliant
      page.cr_compliance = true;
      page.locked = false;
    } else {
      // Non-entity pages don't require CR compliance
      page.cr_compliance = null as any; // N/A for non-entities
      page.locked = false;
    }
  }
}

function generateEnforcementRules(inventory: LegacyInventory): EnforcementRules {
  const lockedPages = inventory.pages.filter(p => p.locked);

  return {
    version: '1.0',
    generated_at: new Date().toISOString(),
    rules: {
      // Files that cannot be edited without adding CR first
      locked_files: lockedPages.map(p => p.file_path),
      // Entity pages that cannot be used in comparisons
      blocked_from_comparison: lockedPages
        .filter(p => p.entity_candidate)
        .map(p => p.entity_name!)
        .filter(Boolean),
      // Entity pages excluded from sitemap as entities
      blocked_from_sitemap: lockedPages
        .filter(p => p.entity_candidate)
        .map(p => p.url)
    },
    validation: {
      require_cr_for_entity_update: true,
      fail_build_on_legacy_publish: true
    }
  };
}

// ============================================
// MAIN
// ============================================

function main() {
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');
  const rulesPath = path.resolve(__dirname, 'enforcement_rules.json');

  console.log('CR-Markup Legacy Page Lock\n');
  console.log('='.repeat(50));

  // Load inventory
  console.log('\nLoading inventory...');
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  console.log(`Loaded ${inventory.pages.length} pages\n`);

  // Lock legacy pages
  console.log('Locking legacy entity pages:\n');
  console.log('Lock  CR    URL                            Entity');
  console.log('-'.repeat(65));

  lockLegacyPages(inventory);

  let lockedCount = 0;
  let compliantCount = 0;

  for (const page of inventory.pages) {
    if (page.entity_candidate) {
      const lockIcon = page.locked ? '🔒' : '🔓';
      const crIcon = page.cr_compliance ? '✓' : '✗';
      console.log(`${lockIcon}    ${crIcon}     ${page.url.padEnd(30)} ${page.entity_name}`);

      if (page.locked) lockedCount++;
      if (page.cr_compliance) compliantCount++;
    }
  }

  // Update summary
  inventory.summary.locked_pages = lockedCount;
  inventory.summary.compliant_pages = compliantCount;
  inventory.generated_at = new Date().toISOString();

  // Generate enforcement rules
  const rules = generateEnforcementRules(inventory);

  // Write outputs
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\nLock Summary:');
  console.log(`  Locked pages:      ${lockedCount}`);
  console.log(`  Compliant pages:   ${compliantCount}`);
  console.log(`  Total entities:    ${inventory.summary.entity_candidates}`);

  console.log('\nEnforcement Rules Generated:');
  console.log(`  Locked files:              ${rules.rules.locked_files.length}`);
  console.log(`  Blocked from comparison:   ${rules.rules.blocked_from_comparison.length}`);
  console.log(`  Blocked from sitemap:      ${rules.rules.blocked_from_sitemap.length}`);

  // Acceptance Tests
  console.log('\n' + '='.repeat(50));
  console.log('\nAcceptance Tests:');

  // Test 1: All entity candidates without CR are locked
  const entitiesWithoutCR = inventory.pages.filter(p => p.entity_candidate && !p.cr_presence);
  const allLocked = entitiesWithoutCR.every(p => p.locked === true);
  console.log(`${allLocked ? 'PASS' : 'FAIL'}: All entity candidates without CR are locked`);

  // Test 2: All locked pages have cr_compliance=false
  const lockedPages = inventory.pages.filter(p => p.locked);
  const allNonCompliant = lockedPages.every(p => p.cr_compliance === false);
  console.log(`${allNonCompliant ? 'PASS' : 'FAIL'}: All locked pages have cr_compliance=false`);

  // Test 3: Enforcement rules file exists and has entries
  const rulesExist = fs.existsSync(rulesPath);
  const rulesHaveEntries = rules.rules.locked_files.length > 0;
  console.log(`${rulesExist && rulesHaveEntries ? 'PASS' : 'FAIL'}: Enforcement rules generated with entries`);

  // Test 4: Build gate is enabled
  const buildGateEnabled = rules.validation.fail_build_on_legacy_publish === true;
  console.log(`${buildGateEnabled ? 'PASS' : 'FAIL'}: Build gate enabled (fail_build_on_legacy_publish=true)`);

  const allPassed = allLocked && allNonCompliant && rulesExist && rulesHaveEntries && buildGateEnabled;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Locked files list
  console.log('\n' + '='.repeat(50));
  console.log('\nLocked Files (Read-Only):');
  for (const file of rules.rules.locked_files) {
    console.log(`  🔒 ${file}`);
  }

  console.log(`\nOutputs:`);
  console.log(`  ${inventoryPath}`);
  console.log(`  ${rulesPath}`);
  console.log('\n' + '='.repeat(50));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
