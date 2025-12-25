#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Entity Classifier
 *
 * Classifies pages as entity candidates or non-entity.
 * Entity = describes a single concrete entity (exchange, DEX, token, etc.)
 *
 * Reference: /schema/plan2.md Step 1
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
  // Step 1 addition
  entity_candidate?: boolean;
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
    // Step 1 additions
    entity_candidates?: number;
    non_entity_candidates?: number;
  };
  pages: LegacyPage[];
}

// ============================================
// CLASSIFICATION LOGIC
// ============================================

/**
 * Determines if a page describes a single concrete entity.
 *
 * Entity candidates are pages that:
 * - Describe ONE specific exchange, DEX, protocol, token, or card
 * - Have a clear entity_name
 * - Are NOT aggregation/listing pages
 * - Are NOT comparison pages
 * - Are NOT article/news pages
 * - Are NOT tool pages
 */
function isEntityCandidate(page: LegacyPage): boolean {
  // Only 'entity' page_type qualifies as entity candidate
  if (page.page_type !== 'entity') {
    return false;
  }

  // Must have an entity name
  if (!page.entity_name) {
    return false;
  }

  // Entity pages with specific patterns
  const entityPatterns = [
    /^\/(dex|exchanges|cards|protocols|tokens)\/[^/]+$/,
  ];

  const isEntityUrl = entityPatterns.some(pattern => pattern.test(page.url));

  return isEntityUrl;
}

/**
 * Gets the reason why a page is not an entity candidate
 */
function getNonEntityReason(page: LegacyPage): string {
  if (page.page_type === 'index') return 'listing/index page';
  if (page.page_type === 'comparison') return 'comparison page';
  if (page.page_type === 'article') return 'article/news page';
  if (page.page_type === 'tool') return 'tool page';
  if (page.page_type === 'misc') return 'miscellaneous page';
  if (!page.entity_name) return 'no entity name';
  return 'unknown';
}

// ============================================
// MAIN
// ============================================

function main() {
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');

  console.log('CR-Markup Entity Classifier\n');
  console.log('='.repeat(50));

  // Load existing inventory
  console.log('\nLoading inventory...');
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  console.log(`Loaded ${inventory.pages.length} pages\n`);

  // Classify each page
  console.log('Classifying pages:\n');
  console.log('Status  URL                            Type         Entity');
  console.log('-'.repeat(70));

  let entityCandidates = 0;
  let nonEntityCandidates = 0;

  for (const page of inventory.pages) {
    const isCandidate = isEntityCandidate(page);
    page.entity_candidate = isCandidate;

    if (isCandidate) {
      entityCandidates++;
      console.log(`  ✓     ${page.url.padEnd(30)} ${page.page_type.padEnd(12)} ${page.entity_name}`);
    } else {
      nonEntityCandidates++;
      const reason = getNonEntityReason(page);
      console.log(`  ○     ${page.url.padEnd(30)} ${page.page_type.padEnd(12)} (${reason})`);
    }
  }

  // Update summary
  inventory.summary.entity_candidates = entityCandidates;
  inventory.summary.non_entity_candidates = nonEntityCandidates;
  inventory.generated_at = new Date().toISOString();

  // Write updated inventory
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\nClassification Summary:');
  console.log(`  Entity candidates:     ${entityCandidates}`);
  console.log(`  Non-entity pages:      ${nonEntityCandidates}`);
  console.log(`  Total:                 ${inventory.pages.length}`);

  // Acceptance Tests
  console.log('\n' + '='.repeat(50));
  console.log('\nAcceptance Tests:');

  // Test 1: No pages with undefined entity_candidate status
  const undefinedStatus = inventory.pages.filter(p => p.entity_candidate === undefined);
  const test1Pass = undefinedStatus.length === 0;
  console.log(`${test1Pass ? 'PASS' : 'FAIL'}: No pages with undefined status (${undefinedStatus.length} undefined)`);

  // Test 2: All comparison / blog / misc / index / tool → entity_candidate=false
  const nonEntityTypes: PageType[] = ['comparison', 'article', 'misc', 'index', 'tool'];
  const nonEntityPages = inventory.pages.filter(p => nonEntityTypes.includes(p.page_type));
  const allNonEntityFalse = nonEntityPages.every(p => p.entity_candidate === false);
  console.log(`${allNonEntityFalse ? 'PASS' : 'FAIL'}: All comparison/blog/misc/index/tool → entity_candidate=false`);

  // Test 3: All entity_candidate=true pages have entity_name
  const candidatesWithName = inventory.pages
    .filter(p => p.entity_candidate === true)
    .every(p => p.entity_name !== null);
  console.log(`${candidatesWithName ? 'PASS' : 'FAIL'}: All entity candidates have entity_name`);

  const allPassed = test1Pass && allNonEntityFalse && candidatesWithName;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Entity candidates list
  console.log('\n' + '='.repeat(50));
  console.log('\nEntity Candidates for Migration:');
  for (const page of inventory.pages.filter(p => p.entity_candidate)) {
    console.log(`  ${page.entity_name?.padEnd(15)} → ${page.url}`);
  }

  console.log(`\nOutput: ${inventoryPath}`);
  console.log('\n' + '='.repeat(50));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
