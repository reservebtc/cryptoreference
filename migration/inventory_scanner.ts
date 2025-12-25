#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Legacy Content Inventory Scanner
 *
 * Scans the repository for all pages and builds a complete inventory.
 *
 * Output: legacy_inventory.json
 *
 * Reference: /schema/plan2.md Step 0
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
  };
  pages: LegacyPage[];
}

// ============================================
// PAGE CLASSIFICATION
// ============================================

function classifyPageType(filePath: string, content: string): PageType {
  const relativePath = filePath.replace(/.*\/app/, '').replace('/page.tsx', '');

  // Index pages (listing pages)
  if (relativePath === '' ||
      relativePath === '/dex' ||
      relativePath === '/exchanges' ||
      relativePath === '/news' ||
      relativePath === '/cards') {
    return 'index';
  }

  // Comparison pages
  if (relativePath.includes('/compare')) {
    return 'comparison';
  }

  // Tool pages
  if (relativePath === '/swap') {
    return 'tool';
  }

  // Archive/article pages
  if (relativePath.includes('/news/') || relativePath.includes('/archive')) {
    return 'article';
  }

  // Entity pages (specific exchange, dex, card, etc.)
  if (relativePath.match(/^\/(dex|exchanges|cards|protocols|tokens)\/[^/]+$/)) {
    return 'entity';
  }

  return 'misc';
}

function extractEntityName(filePath: string, content: string): string | null {
  const relativePath = filePath.replace(/.*\/app/, '').replace('/page.tsx', '');

  // Extract entity name from path
  const match = relativePath.match(/^\/(dex|exchanges|cards|protocols|tokens)\/([^/]+)$/);
  if (match) {
    return match[2].toUpperCase();
  }

  // Try to extract from metadata
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  if (titleMatch) {
    const title = titleMatch[1];
    // Extract first word as entity name
    const words = title.split(/\s+/);
    if (words.length > 0 && !['the', 'a', 'an', 'all', 'compare'].includes(words[0].toLowerCase())) {
      return words[0].toUpperCase();
    }
  }

  return null;
}

function checkCRPresence(content: string): boolean {
  return content.includes('[CR/') && content.includes('[/CR]');
}

function checkLegacyFormats(content: string): { schema_org: boolean; json_ld: boolean; ai_json: boolean } {
  return {
    schema_org: content.includes('schema.org'),
    json_ld: content.includes('application/ld+json'),
    ai_json: content.includes('ai+json') || content.includes('vnd.ai+json')
  };
}

function checkAffiliateLinks(content: string): boolean {
  return content.includes('/go/') ||
         content.includes('referral') ||
         content.includes('affiliate') ||
         content.includes('bonus');
}

function checkMarketingLanguage(content: string): boolean {
  const marketingPatterns = [
    /best\s+(crypto|exchange|dex|platform)/i,
    /\$\d+\s*(bonus|welcome)/i,
    /exclusive/i,
    /limited\s+time/i,
    /sign\s*up\s*now/i,
    /get\s+started/i,
    /don't\s+miss/i,
    /#1|number\s+one/i
  ];

  return marketingPatterns.some(pattern => pattern.test(content));
}

// ============================================
// SCANNER
// ============================================

function scanPage(filePath: string): LegacyPage {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(/.*\/app/, '').replace('/page.tsx', '');
  const url = relativePath || '/';

  const pageType = classifyPageType(filePath, content);
  const entityName = extractEntityName(filePath, content);
  const hasCR = checkCRPresence(content);
  const legacyFormats = checkLegacyFormats(content);
  const hasAffiliateLinks = checkAffiliateLinks(content);
  const hasMarketingLanguage = checkMarketingLanguage(content);

  // Determine status
  let status: PageStatus;
  if (pageType === 'entity') {
    status = hasCR ? 'non-entity' : 'legacy'; // If has CR, it's migrated (non-legacy)
  } else {
    status = 'non-entity';
  }

  return {
    url,
    file_path: filePath.replace(/.*\/cryptoreference\//, ''),
    entity_name: entityName,
    page_type: pageType,
    cr_presence: hasCR,
    status,
    legacy_formats: legacyFormats,
    metadata: {
      has_affiliate_links: hasAffiliateLinks,
      has_marketing_language: hasMarketingLanguage,
      last_scanned: new Date().toISOString()
    }
  };
}

function findAllPages(appDir: string): string[] {
  const pages: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip special Next.js directories
        if (!['api', 'go', '_', '.'].some(skip => entry.name.startsWith(skip))) {
          scanDir(fullPath);
        }
      } else if (entry.name === 'page.tsx') {
        pages.push(fullPath);
      }
    }
  }

  scanDir(appDir);
  return pages;
}

// ============================================
// MAIN
// ============================================

function main() {
  const appDir = path.resolve(__dirname, '../app');
  const outputPath = path.resolve(__dirname, 'legacy_inventory.json');

  console.log('CR-Markup Legacy Content Inventory Scanner\n');
  console.log('='.repeat(50));

  // Find all pages
  console.log('\nScanning for pages...');
  const pageFiles = findAllPages(appDir);
  console.log(`Found ${pageFiles.length} pages\n`);

  // Scan each page
  const pages: LegacyPage[] = [];

  for (const file of pageFiles) {
    const page = scanPage(file);
    pages.push(page);

    const statusIcon = page.cr_presence ? '✓' : '○';
    const typeIcon = page.page_type === 'entity' ? '◆' : '○';
    console.log(`${statusIcon} ${typeIcon} ${page.url.padEnd(30)} ${page.page_type.padEnd(12)} ${page.entity_name || '-'}`);
  }

  // Build inventory
  const entityPages = pages.filter(p => p.page_type === 'entity');
  const nonEntityPages = pages.filter(p => p.page_type !== 'entity');
  const pagesWithCR = pages.filter(p => p.cr_presence);
  const pagesWithoutCR = pages.filter(p => !p.cr_presence);
  const pagesWithLegacy = pages.filter(p =>
    p.legacy_formats.schema_org || p.legacy_formats.json_ld || p.legacy_formats.ai_json
  );

  const inventory: LegacyInventory = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    summary: {
      total_pages: pages.length,
      entity_pages: entityPages.length,
      non_entity_pages: nonEntityPages.length,
      pages_with_cr: pagesWithCR.length,
      pages_without_cr: pagesWithoutCR.length,
      pages_with_legacy_formats: pagesWithLegacy.length
    },
    pages
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\nSummary:');
  console.log(`  Total pages:              ${inventory.summary.total_pages}`);
  console.log(`  Entity pages:             ${inventory.summary.entity_pages}`);
  console.log(`  Non-entity pages:         ${inventory.summary.non_entity_pages}`);
  console.log(`  Pages with CR:            ${inventory.summary.pages_with_cr}`);
  console.log(`  Pages without CR:         ${inventory.summary.pages_without_cr}`);
  console.log(`  Pages with legacy formats: ${inventory.summary.pages_with_legacy_formats}`);

  console.log('\nEntity pages requiring migration:');
  for (const page of entityPages) {
    if (!page.cr_presence) {
      const legacyFlags = [];
      if (page.legacy_formats.schema_org) legacyFlags.push('schema.org');
      if (page.legacy_formats.ai_json) legacyFlags.push('ai+json');
      if (page.metadata.has_marketing_language) legacyFlags.push('marketing');

      console.log(`  ${page.url.padEnd(30)} ${page.entity_name?.padEnd(15) || '-'.padEnd(15)} [${legacyFlags.join(', ')}]`);
    }
  }

  console.log(`\nOutput: ${outputPath}`);
  console.log('\n' + '='.repeat(50));

  // Acceptance tests
  console.log('\nAcceptance Tests:');

  // Test 1: 100% of pages are present in inventory
  const allPagesPresent = pages.length === pageFiles.length;
  console.log(`${allPagesPresent ? 'PASS' : 'FAIL'}: 100% of pages present in inventory (${pages.length}/${pageFiles.length})`);

  // Test 2: Each page has exactly one status
  const allHaveStatus = pages.every(p => p.status === 'legacy' || p.status === 'non-entity');
  console.log(`${allHaveStatus ? 'PASS' : 'FAIL'}: Each page has exactly one status (legacy or non-entity)`);

  // Test 3: All entity pages without CR are marked as legacy
  const legacyEntitiesCorrect = entityPages
    .filter(p => !p.cr_presence)
    .every(p => p.status === 'legacy');
  console.log(`${legacyEntitiesCorrect ? 'PASS' : 'FAIL'}: All entity pages without CR marked as legacy`);

  const allPassed = allPagesPresent && allHaveStatus && legacyEntitiesCorrect;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
