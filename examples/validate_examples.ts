#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Example Validator
 *
 * Validates all example CR files in /examples/ directory.
 * Ensures valid examples pass and documents invalid patterns.
 *
 * Reference: /schema/plan.md Step 14
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateCR } from '../schema/validate_cr';
import { analyzeDeprecation } from '../schema/deprecation';

// ============================================
// TYPES
// ============================================

interface ExampleResult {
  file: string;
  valid: boolean;
  token?: string;
  hash?: string;
  status?: string;
  deprecated?: boolean;
  supersedes?: string;
  errors?: string[];
}

// ============================================
// VALIDATION
// ============================================

function validateExample(filePath: string): ExampleResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = validateCR(content);
  const fileName = path.basename(filePath);

  if (!result.valid) {
    return {
      file: fileName,
      valid: false,
      errors: result.errors.map(e => `[${e.stage}] ${e.message}`)
    };
  }

  const deprecation = analyzeDeprecation(content);
  const fields = result.data!.fields;

  return {
    file: fileName,
    valid: true,
    token: result.data!.token,
    hash: result.data!.computedHash,
    status: fields.status as string || 'active',
    deprecated: deprecation.deprecation.is_deprecated,
    supersedes: fields.supersedes as string | undefined
  };
}

// ============================================
// MAIN
// ============================================

function main(): void {
  const examplesDir = path.dirname(new URL(import.meta.url).pathname);
  const crFiles = fs.readdirSync(examplesDir).filter(f => f.endsWith('.cr'));

  console.log('\n' + '═'.repeat(60));
  console.log('  CR-Markup Example Validator');
  console.log('═'.repeat(60) + '\n');

  const results: ExampleResult[] = [];
  let validCount = 0;
  let invalidCount = 0;

  // Validate each .cr file
  for (const file of crFiles) {
    const filePath = path.join(examplesDir, file);
    const result = validateExample(filePath);
    results.push(result);

    if (result.valid) {
      validCount++;
      console.log(`✓ ${result.file}`);
      console.log(`  Token: ${result.token}`);
      console.log(`  Status: ${result.status}${result.deprecated ? ' (DEPRECATED)' : ''}`);
      if (result.supersedes) {
        console.log(`  Supersedes: ${result.supersedes}`);
      }
      console.log(`  Hash: ${result.hash?.slice(0, 20)}...`);
    } else {
      invalidCount++;
      console.log(`✗ ${result.file}`);
      for (const error of result.errors || []) {
        console.log(`  Error: ${error}`);
      }
    }
    console.log();
  }

  // Summary
  console.log('─'.repeat(60));
  console.log(`\nSummary:`);
  console.log(`  Valid:   ${validCount}`);
  console.log(`  Invalid: ${invalidCount}`);
  console.log(`  Total:   ${crFiles.length}`);

  // Acceptance test results
  console.log('\n' + '═'.repeat(60));
  console.log('  Acceptance Tests');
  console.log('═'.repeat(60) + '\n');

  // Test 1: All valid examples should pass
  const validFiles = ['valid_exchange.cr', 'valid_dex.cr', 'valid_token.cr',
                      'deprecated_exchange.cr', 'superseded_old.cr', 'superseded_new.cr'];
  const allValidPass = validFiles.every(f => {
    const r = results.find(r => r.file === f);
    return r?.valid === true;
  });

  if (allValidPass) {
    console.log('PASS: All valid examples pass validation');
  } else {
    console.log('FAIL: Some valid examples failed validation');
    for (const f of validFiles) {
      const r = results.find(r => r.file === f);
      if (!r?.valid) {
        console.log(`      - ${f}: INVALID`);
      }
    }
  }

  // Test 2: Deprecated example is marked correctly
  const deprecatedResult = results.find(r => r.file === 'deprecated_exchange.cr');
  if (deprecatedResult?.deprecated) {
    console.log('PASS: Deprecated example is marked as deprecated');
  } else {
    console.log('FAIL: Deprecated example should be marked as deprecated');
  }

  // Test 3: Superseded example has supersedes field
  const supersededResult = results.find(r => r.file === 'superseded_new.cr');
  if (supersededResult?.supersedes === 'PROTOCOLV1') {
    console.log('PASS: Superseded example has correct supersedes reference');
  } else {
    console.log('FAIL: Superseded example should reference PROTOCOLV1');
  }

  // Test 4: Token extraction works
  const exchangeResult = results.find(r => r.file === 'valid_exchange.cr');
  if (exchangeResult?.token === 'BINANCE') {
    console.log('PASS: Token extraction works correctly');
  } else {
    console.log('FAIL: Token should be BINANCE');
  }

  // Test 5: Hash is computed for all valid examples
  const allHaveHash = results
    .filter(r => r.valid)
    .every(r => r.hash?.startsWith('sha256:'));
  if (allHaveHash) {
    console.log('PASS: All valid examples have computed hash');
  } else {
    console.log('FAIL: Some valid examples missing hash');
  }

  console.log('\n' + '═'.repeat(60));

  const allPassed = allValidPass && deprecatedResult?.deprecated &&
                    supersededResult?.supersedes === 'PROTOCOLV1' &&
                    exchangeResult?.token === 'BINANCE' && allHaveHash;

  if (allPassed) {
    console.log('  ✓ ALL ACCEPTANCE TESTS PASSED');
  } else {
    console.log('  ✗ SOME ACCEPTANCE TESTS FAILED');
  }

  console.log('═'.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main();
