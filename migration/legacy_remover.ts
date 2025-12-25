#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Legacy Machine Layer Remover
 *
 * Removes conflicting machine-readable formats from entity pages.
 * CR remains the sole machine contract.
 *
 * Removes:
 * - schema.org JSON-LD (<script type="application/ld+json">)
 * - ai+json (<script type="application/vnd.ai+json">)
 * - Related comments
 *
 * Reference: /schema/plan2.md Step 9
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

interface RemovalResult {
  entity: string;
  pagePath: string;
  success: boolean;
  removedLayers: string[];
  errors: string[];
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
// LEGACY LAYER DETECTION
// ============================================

function detectLegacyLayers(content: string): {
  hasJsonLd: boolean;
  hasAiJson: boolean;
  hasSchemaOrg: boolean;
} {
  return {
    hasJsonLd: content.includes('application/ld+json'),
    hasAiJson: content.includes('application/vnd.ai+json') || content.includes('ai+json'),
    hasSchemaOrg: content.includes('schema.org') || content.includes('@context')
  };
}

// ============================================
// LEGACY LAYER REMOVAL
// ============================================

function removeJsonLdBlocks(content: string): { content: string; removed: boolean } {
  let removed = false;

  // Pattern 1: JSX script with dangerouslySetInnerHTML for JSON-LD (type on same line)
  const jsonLdPattern1 = /\s*<script\s+type="application\/ld\+json"\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(\{[\s\S]*?\}\)\s*,?\s*\}\}\s*\/>/g;

  if (jsonLdPattern1.test(content)) {
    content = content.replace(jsonLdPattern1, '');
    removed = true;
  }
  jsonLdPattern1.lastIndex = 0;

  // Pattern 2: JSX script with type on separate line (multiline format)
  const jsonLdPattern2 = /\s*<script\s*\n\s*type="application\/ld\+json"\s*\n\s*dangerouslySetInnerHTML=\{\{\s*\n?\s*__html:\s*JSON\.stringify\(\{[\s\S]*?\}\),?\s*\n?\s*\}\}\s*\n?\s*\/>/g;

  if (jsonLdPattern2.test(content)) {
    content = content.replace(jsonLdPattern2, '');
    removed = true;
  }
  jsonLdPattern2.lastIndex = 0;

  // Pattern 3: Any remaining JSX self-closing script with ld+json
  const jsonLdPattern3 = /\s*<script[\s\S]*?type=["']application\/ld\+json["'][\s\S]*?\/>/g;

  if (jsonLdPattern3.test(content)) {
    content = content.replace(jsonLdPattern3, '');
    removed = true;
  }
  jsonLdPattern3.lastIndex = 0;

  // Pattern 4: Simpler JSON-LD script tags with closing tag
  const simpleJsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  if (simpleJsonLdPattern.test(content)) {
    content = content.replace(simpleJsonLdPattern, '');
    removed = true;
  }

  return { content, removed };
}

function removeAiJsonBlocks(content: string): { content: string; removed: boolean } {
  let removed = false;

  // Pattern 1: JSX script with dangerouslySetInnerHTML for ai+json
  const aiJsonPattern = /\s*<script\s+type="application\/vnd\.ai\+json"\s+dangerouslySetInnerHTML=\{\{[\s\S]*?\}\}\s*\/>/g;

  if (aiJsonPattern.test(content)) {
    content = content.replace(aiJsonPattern, '');
    removed = true;
  }

  // Reset regex state
  aiJsonPattern.lastIndex = 0;

  // Pattern 2: Multiline version with newlines
  const aiJsonPattern2 = /\s*<script\s*\n?\s*type="application\/vnd\.ai\+json"\s*\n?\s*dangerouslySetInnerHTML=\{\{\s*\n?\s*__html:\s*JSON\.stringify\(\{[\s\S]*?\}\)\s*\n?\s*\}\}\s*\n?\s*\/>/g;

  if (aiJsonPattern2.test(content)) {
    content = content.replace(aiJsonPattern2, '');
    removed = true;
  }

  return { content, removed };
}

function removeLegacyComments(content: string): { content: string; removed: boolean } {
  let removed = false;

  // Remove comments about legacy schemas
  const commentPatterns = [
    /\s*\{\/\*\s*Enhanced Schema\.org JSON-LD[^*]*\*\/\}\s*/g,
    /\s*\{\/\*\s*Comprehensive Custom AI Schema[^*]*\*\/\}\s*/g,
    /\s*\{\/\*\s*Custom AI Schema[^*]*\*\/\}\s*/g,
    /\s*\{\/\*\s*AI-friendly structured data[^*]*\*\/\}\s*/g,
    /\s*\{\/\*\s*Schema\.org[^*]*\*\/\}\s*/g,
    /\s*\{\/\*\s*JSON-LD[^*]*\*\/\}\s*/g,
  ];

  for (const pattern of commentPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, '\n');
      removed = true;
    }
  }

  return { content, removed };
}

function removeLegacyLayers(content: string): {
  content: string;
  removedLayers: string[];
  success: boolean;
} {
  const removedLayers: string[] = [];

  // Step 1: Remove JSON-LD blocks
  const jsonLdResult = removeJsonLdBlocks(content);
  if (jsonLdResult.removed) {
    removedLayers.push('JSON-LD (schema.org)');
    content = jsonLdResult.content;
  }

  // Step 2: Remove ai+json blocks
  const aiJsonResult = removeAiJsonBlocks(content);
  if (aiJsonResult.removed) {
    removedLayers.push('ai+json');
    content = aiJsonResult.content;
  }

  // Step 3: Remove legacy comments
  const commentsResult = removeLegacyComments(content);
  if (commentsResult.removed) {
    removedLayers.push('Legacy comments');
    content = commentsResult.content;
  }

  // Step 4: Clean up excessive blank lines
  content = content.replace(/\n{4,}/g, '\n\n\n');

  return {
    content,
    removedLayers,
    success: true
  };
}

// ============================================
// VALIDATION
// ============================================

function validateCleanPage(content: string): { clean: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for remaining legacy layers
  if (content.includes('application/ld+json')) {
    issues.push('JSON-LD blocks still present');
  }

  if (content.includes('application/vnd.ai+json')) {
    issues.push('ai+json blocks still present');
  }

  // Check CR-BLOCK is preserved
  if (!content.includes('[CR-BLOCK]')) {
    issues.push('CR-BLOCK was accidentally removed!');
  }

  if (!content.includes('[CR/')) {
    issues.push('CR block content was accidentally removed!');
  }

  return {
    clean: issues.length === 0,
    issues
  };
}

// ============================================
// MAIN
// ============================================

function main() {
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');
  const basePath = path.resolve(__dirname, '..');

  console.log('CR-Markup Legacy Machine Layer Remover\n');
  console.log('='.repeat(65));

  // Load inventory
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const entityPages = inventory.pages.filter(p => p.entity_candidate === true);

  console.log(`\nProcessing ${entityPages.length} entity pages...\n`);
  console.log('Entity          Removed Layers                          Status');
  console.log('-'.repeat(65));

  const results: RemovalResult[] = [];

  for (const page of entityPages) {
    const entityName = page.entity_name || 'UNKNOWN';
    const pagePath = path.resolve(basePath, page.file_path);

    const result: RemovalResult = {
      entity: entityName,
      pagePath: page.file_path,
      success: false,
      removedLayers: [],
      errors: []
    };

    if (!fs.existsSync(pagePath)) {
      result.errors.push('Page file not found');
      results.push(result);
      console.log(`${entityName.padEnd(15)} Page not found                          FAILED`);
      continue;
    }

    // Read current content
    let content = fs.readFileSync(pagePath, 'utf-8');

    // Detect legacy layers before removal
    const beforeDetection = detectLegacyLayers(content);

    // Remove legacy layers
    const removalResult = removeLegacyLayers(content);
    content = removalResult.content;
    result.removedLayers = removalResult.removedLayers;

    // Validate clean page
    const validation = validateCleanPage(content);

    if (!validation.clean) {
      result.errors = validation.issues;
      results.push(result);
      const removedStr = result.removedLayers.join(', ') || 'None';
      console.log(`${entityName.padEnd(15)} ${removedStr.substring(0, 35).padEnd(35)} FAILED`);
      continue;
    }

    // Write cleaned content
    fs.writeFileSync(pagePath, content);

    result.success = true;
    results.push(result);

    const removedStr = result.removedLayers.join(', ') || 'Already clean';
    console.log(`${entityName.padEnd(15)} ${removedStr.substring(0, 35).padEnd(35)} OK`);
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('\nRemoval Summary:');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const withRemovals = results.filter(r => r.removedLayers.length > 0).length;

  console.log(`  Processed:           ${results.length}`);
  console.log(`  Successful:          ${successful}`);
  console.log(`  Failed:              ${failed}`);
  console.log(`  Had legacy layers:   ${withRemovals}`);

  // Layer breakdown
  const layerCounts: Record<string, number> = {};
  for (const result of results) {
    for (const layer of result.removedLayers) {
      layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    }
  }

  if (Object.keys(layerCounts).length > 0) {
    console.log('\nLayers Removed:');
    for (const [layer, count] of Object.entries(layerCounts)) {
      console.log(`  ${layer}: ${count} pages`);
    }
  }

  if (failed > 0) {
    console.log('\nFailed Pages:');
    for (const r of results.filter(r => !r.success)) {
      console.log(`  ${r.entity}:`);
      for (const error of r.errors) {
        console.log(`    ✗ ${error}`);
      }
    }
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(65));
  console.log('\nAcceptance Tests:');

  // Test 1: No alternative machine schemas remain
  let noAlternativeSchemas = true;
  for (const page of entityPages) {
    const pagePath = path.resolve(basePath, page.file_path);
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      const detection = detectLegacyLayers(content);
      if (detection.hasJsonLd || detection.hasAiJson) {
        noAlternativeSchemas = false;
        break;
      }
    }
  }
  console.log(`${noAlternativeSchemas ? 'PASS' : 'FAIL'}: No alternative machine schemas remain in HTML`);

  // Test 2: CR remains the sole contract
  let crRemains = true;
  for (const page of entityPages) {
    const pagePath = path.resolve(basePath, page.file_path);
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      if (!content.includes('[CR-BLOCK]') || !content.includes('[CR/')) {
        crRemains = false;
        break;
      }
    }
  }
  console.log(`${crRemains ? 'PASS' : 'FAIL'}: CR remains the sole contract`);

  // Test 3: All pages processed successfully
  const allSuccessful = failed === 0;
  console.log(`${allSuccessful ? 'PASS' : 'FAIL'}: All pages processed successfully`);

  const allPassed = noAlternativeSchemas && crRemains && allSuccessful;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('\n' + '='.repeat(65));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
