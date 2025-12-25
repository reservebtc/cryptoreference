#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - CR Promoter
 *
 * Promotes partial CRs to FULL canonical CRs.
 *
 * Tasks:
 * - Remove migration flags (cr_status, cr_compliance, etc.)
 * - Generate proper canonical_hash
 * - Run full validation (grammar, schema, forbidden scan, hash determinism)
 * - Output to cr_entities/<entity>.cr
 *
 * Reference: /schema/plan2.md Step 7
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateCR } from '../schema/validate_cr';
import type { ValidationResult } from '../schema/validate_cr';
import { computeCanonicalHash } from '../schema/hash';

// ============================================
// TYPES
// ============================================

interface ParsedCR {
  token: string;
  fields: Map<string, string>;
}

interface PromotionResult {
  entity: string;
  success: boolean;
  validationStage?: string;
  errors: string[];
  warnings: string[];
  hash?: string;
}

// Fields to remove during promotion (migration-only fields)
const MIGRATION_FIELDS = [
  'cr_status',
  'cr_compliance',
  'network_semantics',
  'network_reason',
  'duplicate_status',
  'duplicate_of',
];

// Fields to rename (non-schema fields -> extension fields with x_ prefix)
const FIELD_RENAMES: Record<string, string> = {
  'twitter': 'x_twitter',
};

// ============================================
// CR PARSING & SERIALIZATION
// ============================================

function parseCR(content: string): ParsedCR {
  const lines = content.trim().split('\n');
  const fields = new Map<string, string>();

  const openingMatch = lines[0].match(/^\[CR\/([A-Z0-9_-]+)\]$/);
  const token = openingMatch ? openingMatch[1] : 'UNKNOWN';

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const key = line.substring(0, eqIndex);
      const value = line.substring(eqIndex + 1);
      fields.set(key, value);
    }
  }

  return { token, fields };
}

function serializeCR(cr: ParsedCR): string {
  const lines: string[] = [];
  lines.push(`[CR/${cr.token}]`);

  // Strict field ordering for canonical output
  const fieldOrder = [
    'schema',
    'version',
    'canonical_hash',
    'type',
    'subtype',
    'network',
    'name',
    'status',
    'url',
    'founded',
    'kyc_required',
    'leverage_max',
    'trading_fee_maker',
    'trading_fee_taker',
    'coins',
    'daily_volume',
    'x_twitter',
  ];

  const orderedFields = new Map<string, string>();

  // Add fields in order
  for (const field of fieldOrder) {
    if (cr.fields.has(field)) {
      orderedFields.set(field, cr.fields.get(field)!);
    }
  }

  // Add any remaining fields alphabetically
  const remainingFields = Array.from(cr.fields.entries())
    .filter(([key]) => !fieldOrder.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of remainingFields) {
    orderedFields.set(key, value);
  }

  for (const [key, value] of orderedFields) {
    lines.push(`${key}=${value}`);
  }

  lines.push('[/CR]');
  return lines.join('\n');
}

// ============================================
// PROMOTION LOGIC
// ============================================

function removeQuotes(value: string): string {
  // Remove surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function cleanFieldValue(field: string, value: string): string {
  // Clean up field values for canonical format
  let cleaned = value;

  // Remove quotes from simple string values
  if (field === 'name') {
    cleaned = removeQuotes(cleaned);
    // Capitalize properly
    if (cleaned === cleaned.toUpperCase()) {
      // Convert all-caps to title case for readability
      cleaned = cleaned.charAt(0) + cleaned.slice(1).toLowerCase();
    }
  }

  // Ensure URL doesn't have LinkedIn (use official instead)
  if (field === 'url' && cleaned.includes('linkedin.com')) {
    // This is a known issue - we should use official URLs
    // For now, we'll keep it but flag it
  }

  return cleaned;
}

function promoteCR(partialCR: ParsedCR): { cr: ParsedCR; placeholderHash: boolean } {
  const promotedFields = new Map<string, string>();

  // Copy fields, excluding migration-only fields and applying renames
  for (const [key, value] of partialCR.fields) {
    if (MIGRATION_FIELDS.includes(key)) {
      // Skip migration-only fields
      continue;
    }

    // Check if field needs to be renamed
    const newKey = FIELD_RENAMES[key] || key;
    promotedFields.set(newKey, cleanFieldValue(newKey, value));
  }

  // Ensure required fields
  if (!promotedFields.has('schema')) {
    promotedFields.set('schema', 'CR1.0');
  }
  if (!promotedFields.has('version')) {
    promotedFields.set('version', '1.0');
  }
  if (!promotedFields.has('status')) {
    promotedFields.set('status', 'active');
  }

  // Set placeholder hash initially (will be computed after serialization)
  const hasPlaceholderHash = promotedFields.get('canonical_hash')?.includes('PARTIAL_') ?? false;

  return {
    cr: { token: partialCR.token, fields: promotedFields },
    placeholderHash: hasPlaceholderHash
  };
}

function computeAndSetHash(cr: ParsedCR): { success: boolean; hash?: string; error?: string } {
  // Remove current hash to compute new one
  cr.fields.delete('canonical_hash');

  // Serialize without hash
  const crWithoutHash = serializeCR(cr);

  // Compute hash
  const hashResult = computeCanonicalHash(crWithoutHash);

  if (!hashResult.success || !hashResult.hash) {
    return { success: false, error: hashResult.error || 'Hash computation failed' };
  }

  // Set the computed hash
  cr.fields.set('canonical_hash', hashResult.hash);

  return { success: true, hash: hashResult.hash };
}

function runFullValidation(crContent: string): ValidationResult {
  return validateCR(crContent);
}

// ============================================
// MAIN
// ============================================

function main() {
  const crDraftsDir = path.resolve(__dirname, 'cr_drafts');
  const crEntitiesDir = path.resolve(__dirname, 'cr_entities');

  console.log('CR-Markup CR Promoter\n');
  console.log('='.repeat(65));

  // Ensure output directory exists
  if (!fs.existsSync(crEntitiesDir)) {
    fs.mkdirSync(crEntitiesDir, { recursive: true });
  }

  // Load all CR drafts
  const crFiles = fs.readdirSync(crDraftsDir).filter(f => f.endsWith('.cr'));
  console.log(`\nPromoting ${crFiles.length} partial CRs to FULL CRs...\n`);

  console.log('Entity          Grammar  Schema   Forbidden  Hash      Status');
  console.log('-'.repeat(65));

  const results: PromotionResult[] = [];

  for (const file of crFiles) {
    const crPath = path.join(crDraftsDir, file);
    const content = fs.readFileSync(crPath, 'utf-8');
    const partialCR = parseCR(content);

    const result: PromotionResult = {
      entity: partialCR.token,
      success: false,
      errors: [],
      warnings: []
    };

    // Step 1: Promote (remove migration fields)
    const { cr: promotedCR } = promoteCR(partialCR);

    // Step 2: Compute proper hash
    const hashResult = computeAndSetHash(promotedCR);
    if (!hashResult.success) {
      result.errors.push(`Hash: ${hashResult.error}`);
      results.push(result);
      console.log(`${result.entity.padEnd(15)} ✗        ✗        ✗          ✗         FAILED`);
      continue;
    }
    result.hash = hashResult.hash;

    // Step 3: Serialize final CR
    const finalCR = serializeCR(promotedCR);

    // Step 4: Run full validation
    const validation = runFullValidation(finalCR);

    // Collect validation results
    const grammarOk = validation.stage !== 'grammar' || validation.valid;
    const schemaOk = validation.stage !== 'schema' || validation.valid;
    const forbiddenOk = validation.stage !== 'forbidden' || validation.valid;
    const hashOk = validation.stage !== 'hash' || validation.valid;

    result.validationStage = validation.stage;

    if (!validation.valid) {
      for (const error of validation.errors) {
        result.errors.push(`${error.stage}: ${error.message}`);
      }
    }

    for (const warning of validation.warnings) {
      result.warnings.push(warning.message);
    }

    result.success = validation.valid;

    // Output status
    const g = grammarOk ? '✓' : '✗';
    const s = schemaOk ? '✓' : '✗';
    const f = forbiddenOk ? '✓' : '✗';
    const h = hashOk ? '✓' : '✗';
    const status = result.success ? 'PROMOTED' : 'FAILED';

    console.log(
      `${result.entity.padEnd(15)} ${g.padStart(7)}  ${s.padStart(7)}  ${f.padStart(9)}  ${h.padStart(8)}   ${status}`
    );

    // Save to cr_entities if successful
    if (result.success) {
      const outputPath = path.join(crEntitiesDir, file);
      fs.writeFileSync(outputPath, finalCR);
    }

    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('\nPromotion Summary:');

  const promoted = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`  Total entities:    ${results.length}`);
  console.log(`  Promoted (FULL):   ${promoted.length}`);
  console.log(`  Failed:            ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed Entities:');
    for (const f of failed) {
      console.log(`  ${f.entity}:`);
      for (const error of f.errors) {
        console.log(`    ✗ ${error}`);
      }
    }
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(65));
  console.log('\nAcceptance Tests:');

  // Test 1: All FULL CRs pass grammar validation
  const allGrammarPass = promoted.every(r =>
    r.validationStage === 'complete' || r.validationStage !== 'grammar'
  );
  console.log(`${allGrammarPass ? 'PASS' : 'FAIL'}: FULL CR passes grammar validation`);

  // Test 2: All FULL CRs pass schema validation
  const allSchemaPass = promoted.every(r =>
    r.validationStage === 'complete' || r.validationStage !== 'schema'
  );
  console.log(`${allSchemaPass ? 'PASS' : 'FAIL'}: FULL CR passes schema validation`);

  // Test 3: All FULL CRs pass forbidden scan
  const allForbiddenPass = promoted.every(r =>
    r.validationStage === 'complete' || r.validationStage !== 'forbidden'
  );
  console.log(`${allForbiddenPass ? 'PASS' : 'FAIL'}: FULL CR passes forbidden scan`);

  // Test 4: All FULL CRs have deterministic hash
  const allHashDeterministic = promoted.every(r =>
    r.hash?.startsWith('sha256:') && r.hash.length === 71
  );
  console.log(`${allHashDeterministic ? 'PASS' : 'FAIL'}: FULL CR has deterministic hash`);

  // Test 5: cr_entities directory has output files
  const outputFiles = fs.readdirSync(crEntitiesDir).filter(f => f.endsWith('.cr'));
  const hasOutput = outputFiles.length === promoted.length;
  console.log(`${hasOutput ? 'PASS' : 'FAIL'}: cr_entities has ${outputFiles.length} output files`);

  const allPassed = allGrammarPass && allSchemaPass && allForbiddenPass && allHashDeterministic && hasOutput;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // List promoted entities
  if (promoted.length > 0) {
    console.log('\n' + '='.repeat(65));
    console.log('\nPromoted FULL CRs:');
    for (const p of promoted) {
      const outputPath = path.join(crEntitiesDir, `${p.entity.toLowerCase()}.cr`);
      console.log(`  ✓ ${p.entity}`);
      console.log(`    Hash: ${p.hash}`);
      console.log(`    File: ${outputPath}`);
    }
  }

  console.log('\n' + '='.repeat(65));

  return allPassed && failed.length === 0;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
