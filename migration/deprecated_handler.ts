#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Deprecated Entity Handler
 *
 * Handles deprecated/dead/closed entities.
 * Preserves history without canonical noise.
 *
 * Operations:
 * - Scan for deprecated entities
 * - Mark entities as deprecated
 * - Add replacement references
 * - Validate deprecated CRs
 *
 * Reference: /schema/plan2.md Step 10
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { validateCR } from '../schema/validate_cr';

// ============================================
// TYPES
// ============================================

interface DeprecationInfo {
  entity: string;
  status: 'active' | 'deprecated' | 'beta' | 'inactive';
  deprecation_reason?: string;
  deprecated_since?: string;
  replaced_by?: string | string[];
  replaced_by_hash?: string;
  migrated_to?: string;
  end_of_life?: string;
  deprecation_notes?: string;
}

interface DeprecationResult {
  entity: string;
  success: boolean;
  action: 'deprecated' | 'validated' | 'skipped' | 'failed';
  errors: string[];
  warnings: string[];
}

interface DuplicateMap {
  entities: Array<{
    token: string;
    status: string;
    duplicate_of?: string;
  }>;
  duplicate_groups: Array<{
    canonical: string;
    duplicates: string[];
  }>;
}

// ============================================
// CR PARSING
// ============================================

function parseCR(content: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Extract token
  const tokenMatch = content.match(/\[CR\/([A-Z][A-Z0-9_-]*)\]/);
  if (tokenMatch) {
    fields._token = tokenMatch[1];
  }

  // Extract fields
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^([a-z_][a-z0-9_]*)=(.+)$/);
    if (match) {
      fields[match[1]] = match[2];
    }
  }

  return fields;
}

function serializeCR(fields: Record<string, string | string[] | undefined>): string {
  const token = fields._token;
  const lines: string[] = [`[CR/${token}]`];

  // Field order for consistency
  const fieldOrder = [
    'schema', 'version', 'canonical_hash', 'type', 'subtype',
    'network', 'name', 'status',
    // Deprecation fields
    'deprecated_since', 'deprecation_reason', 'replaced_by', 'replaced_by_hash',
    'deprecated_by', 'migrated_to', 'end_of_life', 'deprecation_notes',
    // Other fields
    'url', 'founded', 'kyc_required', 'trading_fee_maker', 'trading_fee_taker',
    'leverage_max', 'coins', 'daily_volume', 'parent_id', 'tags'
  ];

  // Add ordered fields
  for (const key of fieldOrder) {
    if (key !== '_token' && fields[key] !== undefined) {
      const value = fields[key];
      if (Array.isArray(value)) {
        lines.push(`${key}=${value.join(',')}`);
      } else {
        lines.push(`${key}=${value}`);
      }
    }
  }

  // Add extension fields (x_*)
  for (const key of Object.keys(fields).sort()) {
    if (key.startsWith('x_') && fields[key] !== undefined) {
      lines.push(`${key}=${fields[key]}`);
    }
  }

  lines.push('[/CR]');
  return lines.join('\n');
}

// ============================================
// CANONICAL HASH
// ============================================

function computeCanonicalHash(content: string): string {
  // Parse and re-serialize for deterministic ordering
  const fields = parseCR(content);

  // Remove hash for computation
  delete fields.canonical_hash;

  // Build canonical string
  const token = fields._token;
  const sortedKeys = Object.keys(fields)
    .filter(k => k !== '_token')
    .sort();

  const canonicalLines = [`[CR/${token}]`];
  for (const key of sortedKeys) {
    canonicalLines.push(`${key}=${fields[key]}`);
  }
  canonicalLines.push('[/CR]');

  const canonical = canonicalLines.join('\n');
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');

  return `sha256:${hash}`;
}

// ============================================
// DEPRECATION LOGIC
// ============================================

function deprecateEntity(
  crContent: string,
  deprecationInfo: Partial<DeprecationInfo>
): { content: string; success: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields = parseCR(crContent);

  // Validate entity exists
  if (!fields._token) {
    return { content: crContent, success: false, errors: ['No token found in CR'] };
  }

  // Set status to deprecated
  fields.status = 'deprecated';

  // Add deprecation info
  if (deprecationInfo.deprecation_reason) {
    fields.deprecation_reason = deprecationInfo.deprecation_reason;
  }

  if (deprecationInfo.deprecated_since) {
    fields.deprecated_since = deprecationInfo.deprecated_since;
  }

  if (deprecationInfo.replaced_by) {
    if (Array.isArray(deprecationInfo.replaced_by)) {
      fields.replaced_by = deprecationInfo.replaced_by.join(',');
    } else {
      fields.replaced_by = deprecationInfo.replaced_by;
    }
  }

  if (deprecationInfo.replaced_by_hash) {
    fields.replaced_by_hash = deprecationInfo.replaced_by_hash;
  }

  if (deprecationInfo.migrated_to) {
    fields.migrated_to = deprecationInfo.migrated_to;
  }

  if (deprecationInfo.end_of_life) {
    fields.end_of_life = deprecationInfo.end_of_life;
  }

  if (deprecationInfo.deprecation_notes) {
    fields.deprecation_notes = deprecationInfo.deprecation_notes;
  }

  // Serialize without hash
  const contentWithoutHash = serializeCR({ ...fields, canonical_hash: undefined });

  // Compute new hash
  const newHash = computeCanonicalHash(contentWithoutHash);
  fields.canonical_hash = newHash;

  // Final serialization
  const newContent = serializeCR(fields);

  return { content: newContent, success: true, errors };
}

function isDeprecated(crContent: string): boolean {
  const fields = parseCR(crContent);
  return fields.status === 'deprecated';
}

function isDuplicate(entity: string, duplicateMap: DuplicateMap | null): boolean {
  if (!duplicateMap) return false;

  // Check if entity is marked as duplicate in entities array
  const entityEntry = duplicateMap.entities.find(e => e.token === entity);
  if (entityEntry && entityEntry.status === 'duplicate') {
    return true;
  }

  // Check if entity appears in any duplicate group as a duplicate
  for (const group of duplicateMap.duplicate_groups) {
    if (group.duplicates.includes(entity)) {
      return true;
    }
  }

  return false;
}

// ============================================
// VALIDATION
// ============================================

function validateDeprecatedCR(crContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fields = parseCR(crContent);

  // Must have deprecated status
  if (fields.status !== 'deprecated') {
    errors.push('Status must be "deprecated"');
  }

  // Run standard validation
  const validation = validateCR(crContent);
  if (!validation.valid) {
    errors.push(...validation.errors.map(e => e.message));
  }

  // Recommended fields for deprecated entities
  if (!fields.deprecation_reason && !fields.deprecation_notes) {
    // Warning, not error
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// MAIN
// ============================================

function main() {
  const crEntitiesDir = path.resolve(__dirname, 'cr_entities');
  const duplicateMapPath = path.resolve(__dirname, 'duplicate_map.json');

  console.log('CR-Markup Deprecated Entity Handler\n');
  console.log('='.repeat(65));

  // Load duplicate map if exists
  let duplicateMap: DuplicateMap | null = null;
  if (fs.existsSync(duplicateMapPath)) {
    duplicateMap = JSON.parse(fs.readFileSync(duplicateMapPath, 'utf-8'));
  }

  // Get all CR files
  const crFiles = fs.readdirSync(crEntitiesDir)
    .filter(f => f.endsWith('.cr'))
    .map(f => path.join(crEntitiesDir, f));

  console.log(`\nScanning ${crFiles.length} CR entities...\n`);
  console.log('Entity          Status       Deprecated  Duplicate  Valid');
  console.log('-'.repeat(65));

  const results: DeprecationResult[] = [];
  const deprecatedEntities: string[] = [];
  const activeEntities: string[] = [];

  for (const crFile of crFiles) {
    const content = fs.readFileSync(crFile, 'utf-8');
    const fields = parseCR(content);
    const entity = fields._token || 'UNKNOWN';

    const deprecated = isDeprecated(content);
    const duplicate = isDuplicate(entity, duplicateMap);

    let valid = true;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate
    if (deprecated) {
      const validation = validateDeprecatedCR(content);
      valid = validation.valid;
      errors.push(...validation.errors);

      // Deprecated must not be duplicate
      if (duplicate) {
        errors.push('Deprecated entity cannot also be a duplicate');
        valid = false;
      }

      deprecatedEntities.push(entity);
    } else {
      // Standard validation for active entities
      const validation = validateCR(content);
      valid = validation.valid;
      errors.push(...validation.errors.map(e => e.message));

      activeEntities.push(entity);
    }

    const result: DeprecationResult = {
      entity,
      success: valid,
      action: deprecated ? 'validated' : 'skipped',
      errors,
      warnings
    };
    results.push(result);

    const statusStr = (fields.status || 'active').padEnd(12);
    const deprecatedStr = deprecated ? 'YES' : 'NO';
    const duplicateStr = duplicate ? 'YES' : 'NO';
    const validStr = valid ? 'OK' : 'FAIL';

    console.log(
      `${entity.padEnd(15)} ${statusStr} ${deprecatedStr.padEnd(11)} ${duplicateStr.padEnd(10)} ${validStr}`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('\nDeprecation Summary:');

  console.log(`  Total entities:     ${results.length}`);
  console.log(`  Active:             ${activeEntities.length}`);
  console.log(`  Deprecated:         ${deprecatedEntities.length}`);

  const valid = results.filter(r => r.success).length;
  const invalid = results.filter(r => !r.success).length;

  console.log(`  Valid:              ${valid}`);
  console.log(`  Invalid:            ${invalid}`);

  if (invalid > 0) {
    console.log('\nInvalid Entities:');
    for (const r of results.filter(r => !r.success)) {
      console.log(`  ${r.entity}:`);
      for (const error of r.errors) {
        console.log(`    - ${error}`);
      }
    }
  }

  if (deprecatedEntities.length > 0) {
    console.log('\nDeprecated Entities:');
    for (const entity of deprecatedEntities) {
      const crPath = path.join(crEntitiesDir, `${entity.toLowerCase()}.cr`);
      const content = fs.readFileSync(crPath, 'utf-8');
      const fields = parseCR(content);

      console.log(`  ${entity}:`);
      if (fields.deprecation_reason) {
        console.log(`    Reason: ${fields.deprecation_reason}`);
      }
      if (fields.deprecated_since) {
        console.log(`    Since: ${fields.deprecated_since}`);
      }
      if (fields.replaced_by) {
        console.log(`    Replaced by: ${fields.replaced_by}`);
      }
    }
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(65));
  console.log('\nAcceptance Tests:');

  // Test 1: All deprecated CRs are valid
  const deprecatedValid = deprecatedEntities.every(entity => {
    const r = results.find(r => r.entity === entity);
    return r?.success;
  });
  console.log(`${deprecatedValid ? 'PASS' : 'FAIL'}: All deprecated CRs are valid`);

  // Test 2: Deprecated ≠ duplicate
  const noDeprecatedDuplicates = !deprecatedEntities.some(entity =>
    isDuplicate(entity, duplicateMap)
  );
  console.log(`${noDeprecatedDuplicates ? 'PASS' : 'FAIL'}: Deprecated ≠ duplicate`);

  // Test 3: All entities have valid status
  const allValidStatus = results.every(r => r.success);
  console.log(`${allValidStatus ? 'PASS' : 'FAIL'}: All entities have valid status`);

  const allPassed = deprecatedValid && noDeprecatedDuplicates && allValidStatus;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('\n' + '='.repeat(65));

  return allPassed;
}

// ============================================
// CLI COMMANDS
// ============================================

function deprecateCommand(entityName: string, reason: string, replacedBy?: string) {
  const crEntitiesDir = path.resolve(__dirname, 'cr_entities');
  const crPath = path.join(crEntitiesDir, `${entityName.toLowerCase()}.cr`);

  if (!fs.existsSync(crPath)) {
    console.error(`Error: CR file not found for ${entityName}`);
    process.exit(1);
  }

  const content = fs.readFileSync(crPath, 'utf-8');

  const deprecationInfo: Partial<DeprecationInfo> = {
    deprecation_reason: reason,
    deprecated_since: new Date().toISOString().slice(0, 7), // YYYY-MM
  };

  if (replacedBy) {
    deprecationInfo.replaced_by = replacedBy;
  }

  const result = deprecateEntity(content, deprecationInfo);

  if (!result.success) {
    console.error('Deprecation failed:');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Validate before saving
  const validation = validateDeprecatedCR(result.content);
  if (!validation.valid) {
    console.error('Validation failed:');
    for (const error of validation.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  fs.writeFileSync(crPath, result.content);
  console.log(`Successfully deprecated ${entityName}`);
  console.log(`  Reason: ${reason}`);
  if (replacedBy) {
    console.log(`  Replaced by: ${replacedBy}`);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args[0] === 'deprecate') {
  const entity = args[1];
  const reason = args[2];
  const replacedBy = args[3];

  if (!entity || !reason) {
    console.error('Usage: deprecated_handler.ts deprecate <ENTITY> <reason> [replacedBy]');
    process.exit(1);
  }

  deprecateCommand(entity, reason, replacedBy);
} else {
  // Default: run scan
  const success = main();
  process.exit(success ? 0 : 1);
}
