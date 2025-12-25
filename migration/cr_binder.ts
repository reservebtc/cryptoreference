#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - CR Binder
 *
 * Embeds FULL CR blocks into entity pages.
 * Makes CR the source of truth for each entity.
 *
 * Embedding strategy:
 * - CR is embedded as a special comment block at the top of the component
 * - Format: {/* [CR-BLOCK] ... [/CR-BLOCK] *\/}
 * - This allows parsing by validators while being valid JSX
 *
 * Reference: /schema/plan2.md Step 8
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

interface BindingResult {
  entity: string;
  pagePath: string;
  success: boolean;
  action: 'embedded' | 'updated' | 'skipped' | 'failed';
  error?: string;
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
// CR EMBEDDING
// ============================================

const CR_BLOCK_START = '{/* [CR-BLOCK]';
const CR_BLOCK_END = '[/CR-BLOCK] */}';

function formatCRForEmbedding(crContent: string): string {
  // Wrap CR in JSX comment block
  const lines = crContent.trim().split('\n');
  const indentedCR = lines.map(line => `  ${line}`).join('\n');

  return `${CR_BLOCK_START}
${indentedCR}
${CR_BLOCK_END}`;
}

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

  // Remove indentation
  const lines = crSection.split('\n');
  return lines.map(line => line.replace(/^  /, '')).join('\n');
}

function hasCRBlock(pageContent: string): boolean {
  return pageContent.includes(CR_BLOCK_START) && pageContent.includes(CR_BLOCK_END);
}

function countCRBlocks(pageContent: string): number {
  const starts = (pageContent.match(/\[CR-BLOCK\]/g) || []).length;
  return starts;
}

function embedCRInPage(pageContent: string, crContent: string): string {
  const embeddedCR = formatCRForEmbedding(crContent);

  // If CR already exists, replace it
  if (hasCRBlock(pageContent)) {
    const startIndex = pageContent.indexOf(CR_BLOCK_START);
    const endIndex = pageContent.indexOf(CR_BLOCK_END) + CR_BLOCK_END.length;

    return pageContent.substring(0, startIndex) +
           embeddedCR +
           pageContent.substring(endIndex);
  }

  // Find the return statement in the component and insert CR before it
  const returnMatch = pageContent.match(/(\s*)(return\s*\(\s*\n?\s*<)/);

  if (returnMatch) {
    const insertIndex = pageContent.indexOf(returnMatch[0]);
    const indent = returnMatch[1];

    return pageContent.substring(0, insertIndex) +
           indent + embeddedCR + '\n\n' +
           pageContent.substring(insertIndex);
  }

  // Fallback: insert after the function declaration
  const funcMatch = pageContent.match(/(export default function \w+\(\)\s*\{)/);

  if (funcMatch) {
    const insertIndex = pageContent.indexOf(funcMatch[0]) + funcMatch[0].length;

    return pageContent.substring(0, insertIndex) +
           '\n  ' + embeddedCR + '\n' +
           pageContent.substring(insertIndex);
  }

  return pageContent;
}

// ============================================
// MAIN
// ============================================

function main() {
  const crEntitiesDir = path.resolve(__dirname, 'cr_entities');
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');
  const appDir = path.resolve(__dirname, '../app');

  console.log('CR-Markup CR Binder\n');
  console.log('='.repeat(60));

  // Load inventory to get entity page mappings
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const entityPages = inventory.pages.filter(p => p.entity_candidate === true);

  console.log(`\nBinding ${entityPages.length} entity pages to CR blocks...\n`);
  console.log('Entity          Page                           Action');
  console.log('-'.repeat(60));

  const results: BindingResult[] = [];

  for (const page of entityPages) {
    const entityName = page.entity_name;
    if (!entityName) {
      results.push({
        entity: 'UNKNOWN',
        pagePath: page.file_path,
        success: false,
        action: 'failed',
        error: 'No entity name'
      });
      continue;
    }

    // Find CR file
    const crFileName = `${entityName.toLowerCase()}.cr`;
    const crPath = path.join(crEntitiesDir, crFileName);

    if (!fs.existsSync(crPath)) {
      results.push({
        entity: entityName,
        pagePath: page.file_path,
        success: false,
        action: 'failed',
        error: 'CR file not found'
      });
      console.log(`${entityName.padEnd(15)} ${page.file_path.padEnd(30)} FAILED (no CR)`);
      continue;
    }

    // Read CR content
    const crContent = fs.readFileSync(crPath, 'utf-8');

    // Read page content
    const pagePath = path.resolve(__dirname, '..', page.file_path);
    if (!fs.existsSync(pagePath)) {
      results.push({
        entity: entityName,
        pagePath: page.file_path,
        success: false,
        action: 'failed',
        error: 'Page file not found'
      });
      console.log(`${entityName.padEnd(15)} ${page.file_path.padEnd(30)} FAILED (no page)`);
      continue;
    }

    const pageContent = fs.readFileSync(pagePath, 'utf-8');

    // Check if already has CR
    const hadCR = hasCRBlock(pageContent);
    const action = hadCR ? 'updated' : 'embedded';

    // Embed CR
    const updatedContent = embedCRInPage(pageContent, crContent);

    // Verify single CR block
    const crCount = countCRBlocks(updatedContent);
    if (crCount > 1) {
      results.push({
        entity: entityName,
        pagePath: page.file_path,
        success: false,
        action: 'failed',
        error: `Multiple CR blocks detected (${crCount})`
      });
      console.log(`${entityName.padEnd(15)} ${page.file_path.padEnd(30)} FAILED (multiple CR)`);
      continue;
    }

    // Write updated page
    fs.writeFileSync(pagePath, updatedContent);

    results.push({
      entity: entityName,
      pagePath: page.file_path,
      success: true,
      action
    });

    const actionStr = action === 'embedded' ? 'EMBEDDED' : 'UPDATED';
    console.log(`${entityName.padEnd(15)} ${page.file_path.padEnd(30)} ${actionStr}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\nBinding Summary:');

  const embedded = results.filter(r => r.action === 'embedded').length;
  const updated = results.filter(r => r.action === 'updated').length;
  const failed = results.filter(r => r.action === 'failed').length;

  console.log(`  Embedded (new):  ${embedded}`);
  console.log(`  Updated:         ${updated}`);
  console.log(`  Failed:          ${failed}`);
  console.log(`  Total:           ${results.length}`);

  if (failed > 0) {
    console.log('\nFailed Bindings:');
    for (const r of results.filter(r => !r.success)) {
      console.log(`  ${r.entity}: ${r.error}`);
    }
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(60));
  console.log('\nAcceptance Tests:');

  // Test 1: All entity pages have exactly one CR block
  const allHaveCR = results.filter(r => r.success).length === entityPages.length;
  console.log(`${allHaveCR ? 'PASS' : 'FAIL'}: All entity pages have CR block`);

  // Test 2: No page has multiple CR blocks
  const noMultipleCR = results.every(r => r.error !== 'Multiple CR blocks detected');
  console.log(`${noMultipleCR ? 'PASS' : 'FAIL'}: No page has multiple CR blocks`);

  // Test 3: CR can be extracted back from pages
  let canExtract = true;
  for (const r of results.filter(r => r.success)) {
    const pagePath = path.resolve(__dirname, '..', r.pagePath);
    const content = fs.readFileSync(pagePath, 'utf-8');
    const extracted = extractEmbeddedCR(content);
    if (!extracted || !extracted.includes('[CR/')) {
      canExtract = false;
      break;
    }
  }
  console.log(`${canExtract ? 'PASS' : 'FAIL'}: CR can be extracted from embedded pages`);

  const allPassed = allHaveCR && noMultipleCR && canExtract;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('\n' + '='.repeat(60));

  return allPassed && failed === 0;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
