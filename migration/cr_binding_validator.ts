#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - CR Binding Validator
 *
 * Validates CR binding for entity pages.
 * Used in build pipeline to enforce:
 * - One CR = one page
 * - No entity page without CR
 * - Two CR blocks on one page → hard fail
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failed (deployment blocked)
 *
 * Reference: /schema/plan2.md Step 8
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateCR } from '../schema/validate_cr';

// ============================================
// TYPES
// ============================================

interface ValidationResult {
  entity: string;
  pagePath: string;
  valid: boolean;
  crPresent: boolean;
  crCount: number;
  crValid: boolean;
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

  // Remove indentation
  const lines = crSection.split('\n');
  return lines.map(line => line.replace(/^  /, '')).join('\n');
}

function countCRBlocks(pageContent: string): number {
  const matches = pageContent.match(/\[CR-BLOCK\]/g) || [];
  return matches.length;
}

function countRawCRBlocks(pageContent: string): number {
  // Also check for raw CR blocks that might be improperly embedded
  const matches = pageContent.match(/\[CR\/[A-Z][A-Z0-9_-]*\]/g) || [];
  return matches.length;
}

// ============================================
// VALIDATION
// ============================================

function validateEntityPage(page: LegacyPage, basePath: string): ValidationResult {
  const result: ValidationResult = {
    entity: page.entity_name || 'UNKNOWN',
    pagePath: page.file_path,
    valid: false,
    crPresent: false,
    crCount: 0,
    crValid: false,
    errors: []
  };

  // Read page content
  const pagePath = path.resolve(basePath, page.file_path);

  if (!fs.existsSync(pagePath)) {
    result.errors.push('Page file not found');
    return result;
  }

  const content = fs.readFileSync(pagePath, 'utf-8');

  // Count CR blocks
  const crBlockCount = countCRBlocks(content);
  const rawCRCount = countRawCRBlocks(content);
  result.crCount = crBlockCount;

  // Check: No CR block
  if (crBlockCount === 0) {
    result.errors.push('Entity page has no CR block - deployment blocked');
    return result;
  }

  result.crPresent = true;

  // Check: Multiple CR blocks
  if (crBlockCount > 1) {
    result.errors.push(`Multiple CR blocks detected (${crBlockCount}) - hard fail`);
    return result;
  }

  // Check: Multiple raw CR blocks (improperly embedded)
  if (rawCRCount > 1) {
    result.errors.push(`Multiple raw CR blocks detected (${rawCRCount}) - potential embedding error`);
    return result;
  }

  // Extract and validate CR content
  const crContent = extractEmbeddedCR(content);

  if (!crContent) {
    result.errors.push('Could not extract CR content from block');
    return result;
  }

  // Validate CR content
  const crValidation = validateCR(crContent);

  if (!crValidation.valid) {
    result.errors.push(`Invalid CR content: ${crValidation.errors[0]?.message || 'Unknown error'}`);
    return result;
  }

  result.crValid = true;

  // Check: CR token matches entity name
  const tokenMatch = crContent.match(/\[CR\/([A-Z][A-Z0-9_-]*)\]/);
  if (tokenMatch) {
    const crToken = tokenMatch[1];
    if (crToken !== page.entity_name) {
      result.errors.push(`CR token mismatch: expected ${page.entity_name}, found ${crToken}`);
      return result;
    }
  }

  // All checks passed
  result.valid = true;
  return result;
}

// ============================================
// MAIN
// ============================================

function main() {
  const inventoryPath = path.resolve(__dirname, 'legacy_inventory.json');
  const basePath = path.resolve(__dirname, '..');

  console.log('CR-Markup CR Binding Validator\n');
  console.log('='.repeat(65));

  // Load inventory
  const inventory: LegacyInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
  const entityPages = inventory.pages.filter(p => p.entity_candidate === true);

  console.log(`\nValidating ${entityPages.length} entity pages...\n`);
  console.log('Entity          CR    Valid  Errors');
  console.log('-'.repeat(65));

  const results: ValidationResult[] = [];

  for (const page of entityPages) {
    const result = validateEntityPage(page, basePath);
    results.push(result);

    const crIcon = result.crPresent ? '✓' : '✗';
    const validIcon = result.valid ? '✓' : '✗';
    const errorStr = result.errors.length > 0 ? result.errors[0].substring(0, 30) : '';

    console.log(
      `${result.entity.padEnd(15)} ${crIcon.padStart(3)}    ${validIcon.padStart(5)}  ${errorStr}`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('\nValidation Summary:');

  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;
  const noCR = results.filter(r => !r.crPresent).length;
  const multipleCR = results.filter(r => r.crCount > 1).length;

  console.log(`  Valid pages:        ${valid}`);
  console.log(`  Invalid pages:      ${invalid}`);
  console.log(`  Missing CR:         ${noCR}`);
  console.log(`  Multiple CR blocks: ${multipleCR}`);

  if (invalid > 0) {
    console.log('\nInvalid Pages:');
    for (const r of results.filter(r => !r.valid)) {
      console.log(`  ${r.entity}:`);
      for (const error of r.errors) {
        console.log(`    ✗ ${error}`);
      }
    }
  }

  // Deployment decision
  console.log('\n' + '='.repeat(65));

  const canDeploy = invalid === 0;

  if (canDeploy) {
    console.log('\n✅ DEPLOYMENT ALLOWED');
    console.log('   All entity pages have valid CR blocks');
  } else {
    console.log('\n❌ DEPLOYMENT BLOCKED');
    console.log('   Entity pages must have exactly one valid CR block');
    console.log('\n   To fix:');
    if (noCR > 0) {
      console.log('   - Run: npx tsx migration/cr_binder.ts');
    }
    if (multipleCR > 0) {
      console.log('   - Remove duplicate CR blocks from pages');
    }
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(65));
  console.log('\nAcceptance Tests:');

  // Test 1: Page without CR does not deploy
  const test1Pass = noCR === 0 || !canDeploy;
  console.log(`${test1Pass ? 'PASS' : 'FAIL'}: Page without CR does not deploy`);

  // Test 2: Two CR blocks on one page → hard fail
  const test2Pass = multipleCR === 0 || !canDeploy;
  console.log(`${test2Pass ? 'PASS' : 'FAIL'}: Two CR blocks on one page → hard fail`);

  // Test 3: All CRs are valid
  const invalidCR = results.filter(r => r.crPresent && !r.crValid).length;
  const test3Pass = invalidCR === 0;
  console.log(`${test3Pass ? 'PASS' : 'FAIL'}: All embedded CRs are valid`);

  const allPassed = test1Pass && test2Pass && test3Pass;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('\n' + '='.repeat(65));

  return canDeploy;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
