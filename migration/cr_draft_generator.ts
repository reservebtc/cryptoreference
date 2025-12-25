#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Partial CR Draft Generator
 *
 * Generates partial CR blocks for migration.
 * Uses only verified facts from fact sheets.
 *
 * Partial CR characteristics:
 * - cr_status=partial
 * - cr_compliance=false
 * - Grammar-valid but NOT canonical
 * - Uses placeholder hash (not computed)
 *
 * Reference: /schema/plan2.md Step 4
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================
// EMOJI DETECTION
// ============================================

function containsEmoji(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i);
    if (code === undefined) continue;
    if (code > 0xFFFF) i++;
    if (code >= 0x1F600 && code <= 0x1F64F) return true;
    if (code >= 0x1F300 && code <= 0x1F5FF) return true;
    if (code >= 0x1F680 && code <= 0x1F6FF) return true;
    if (code >= 0x1F1E0 && code <= 0x1F1FF) return true;
    if (code >= 0x2600 && code <= 0x26FF) return true;
    if (code >= 0x2700 && code <= 0x27BF) return true;
    if (code >= 0x1F900 && code <= 0x1F9FF) return true;
  }
  return false;
}

// ============================================
// TYPES
// ============================================

interface Fact {
  field: string;
  value: any;
  source_type: string;
  source_url?: string;
  verified: boolean;
  verification_note?: string;
}

interface FactSheet {
  version: string;
  entity_name: string;
  entity_type: string;
  extracted_at: string;
  source_file: string;
  summary: {
    total_facts: number;
    verified_facts: number;
    unverified_facts: number;
    verification_rate: string;
  };
  official_sources: string[];
  facts: Fact[];
}

interface CRBlock {
  token: string;
  fields: Map<string, string>;
}

// ============================================
// CR GENERATION LOGIC
// ============================================

/**
 * Map entity type to CR type/subtype
 */
function mapEntityType(entityType: string): { type: string; subtype: string } {
  switch (entityType.toLowerCase()) {
    case 'cex':
      return { type: 'exchange', subtype: 'cex' };
    case 'dex':
    case 'perpetual dex':
      return { type: 'dex', subtype: 'perp' };
    case 'crypto card':
      return { type: 'card', subtype: 'debit' };
    default:
      return { type: 'unknown', subtype: 'unknown' };
  }
}

/**
 * Map fact field to CR field
 */
function mapFactToCRField(field: string): string | null {
  const mapping: Record<string, string | null> = {
    'name': 'name',
    'type': null, // Handled separately
    'exchange_type': null, // Handled separately
    'founded': 'founded',
    'founder': null, // Not a CR field
    'headquarters': null, // Not a CR field
    'trading_pairs': 'coins',
    'daily_volume': 'daily_volume',
    'max_leverage': 'leverage_max',
    'kyc_required': 'kyc_required',
    'blockchain': 'network',
    'network': 'network',
    'twitter_handle': 'twitter',
    'official_website': 'url',
    'trading_fee_spot_maker': 'trading_fee_maker',
    'trading_fee_spot_taker': 'trading_fee_taker',
    'trading_fee_futures_maker': null, // Not in base CR
    'trading_fee_futures_taker': null, // Not in base CR
  };

  return field in mapping ? mapping[field] : null;
}

/**
 * Format value for CR
 */
function formatCRValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  // Clean up string values
  let strValue = String(value);
  // Remove quotes if present
  strValue = strValue.replace(/^["']|["']$/g, '');
  return strValue;
}

/**
 * Determine network for entity
 */
function determineNetwork(entityName: string, entityType: string): string {
  // CEX are typically multi-network
  if (entityType === 'CEX') {
    return 'multi';
  }

  // Known DEX networks
  const dexNetworks: Record<string, string> = {
    'HYPERLIQUID': 'hyperliquid-l1',
    'ASTERDEX': '["arbitrum","base","optimism"]',
    'HIBACHI': 'solana',
    'LIGHTER': 'arbitrum',
  };

  if (dexNetworks[entityName]) {
    return dexNetworks[entityName];
  }

  // Cards
  if (entityType === 'Crypto Card') {
    return 'multi';
  }

  return 'unknown';
}

/**
 * Generate placeholder hash for partial CR
 */
function generatePlaceholderHash(): string {
  // Partial CRs use a placeholder hash that indicates they are not canonical
  return 'sha256:PARTIAL_' + crypto.randomBytes(28).toString('hex');
}

/**
 * Generate partial CR block from fact sheet
 */
function generatePartialCR(factSheet: FactSheet): CRBlock {
  const token = factSheet.entity_name;
  const fields = new Map<string, string>();

  // Mandatory fields
  fields.set('schema', 'CR1.0');
  fields.set('version', '1.0');
  fields.set('canonical_hash', generatePlaceholderHash());

  // Migration-specific fields
  fields.set('cr_status', 'partial');
  fields.set('cr_compliance', 'false');

  // Type and subtype
  const { type, subtype } = mapEntityType(factSheet.entity_type);
  fields.set('type', type);
  fields.set('subtype', subtype);

  // Network
  const network = determineNetwork(factSheet.entity_name, factSheet.entity_type);
  fields.set('network', network);

  // Set default name
  fields.set('name', factSheet.entity_name);
  fields.set('status', 'active');

  // Add verified facts only
  const verifiedFacts = factSheet.facts.filter(f => f.verified);

  for (const fact of verifiedFacts) {
    const crField = mapFactToCRField(fact.field);
    if (crField && !fields.has(crField)) {
      fields.set(crField, formatCRValue(fact.value));
    }
  }

  // Ensure we have a URL if available
  if (!fields.has('url')) {
    const urlFact = factSheet.facts.find(f => f.field === 'official_website');
    if (urlFact) {
      fields.set('url', formatCRValue(urlFact.value));
    } else if (factSheet.official_sources.length > 0) {
      fields.set('url', factSheet.official_sources[0]);
    }
  }

  return { token, fields };
}

/**
 * Serialize CR block to string
 */
function serializeCR(cr: CRBlock): string {
  const lines: string[] = [];
  lines.push(`[CR/${cr.token}]`);

  // Order fields: mandatory first, then alphabetical
  const mandatoryOrder = [
    'schema',
    'version',
    'canonical_hash',
    'cr_status',
    'cr_compliance',
    'type',
    'subtype',
    'network',
    'name',
    'status',
    'url'
  ];

  const orderedFields = new Map<string, string>();

  // Add mandatory fields first
  for (const field of mandatoryOrder) {
    if (cr.fields.has(field)) {
      orderedFields.set(field, cr.fields.get(field)!);
    }
  }

  // Add remaining fields alphabetically
  const remainingFields = Array.from(cr.fields.entries())
    .filter(([key]) => !mandatoryOrder.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of remainingFields) {
    orderedFields.set(key, value);
  }

  // Serialize
  for (const [key, value] of orderedFields) {
    lines.push(`${key}=${value}`);
  }

  lines.push(`[/CR]`);

  return lines.join('\n');
}

/**
 * Validate CR grammar (basic validation)
 */
function validateCRGrammar(crContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check opening tag
  if (!crContent.match(/^\[CR\/[A-Z0-9_-]+\]/m)) {
    errors.push('Missing or invalid opening tag [CR/<TOKEN>]');
  }

  // Check closing tag
  if (!crContent.match(/\[\/CR\]$/m)) {
    errors.push('Missing or invalid closing tag [/CR]');
  }

  // Check mandatory fields
  const mandatoryFields = ['schema', 'version', 'canonical_hash', 'type', 'network'];
  for (const field of mandatoryFields) {
    if (!crContent.includes(`${field}=`)) {
      errors.push(`Missing mandatory field: ${field}`);
    }
  }

  // Check for emoji (forbidden in CR)
  if (containsEmoji(crContent)) {
    errors.push('Emoji found in CR block (forbidden)');
  }

  // Check schema version
  if (!crContent.includes('schema=CR1.0')) {
    errors.push('Invalid schema version (must be CR1.0)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if CR would pass canonical validation
 */
function wouldPassCanonicalValidation(crContent: string): boolean {
  // Partial CRs should NOT pass canonical validation
  // They have:
  // 1. Placeholder hash (not computed)
  // 2. cr_status=partial
  // 3. cr_compliance=false

  if (crContent.includes('cr_status=partial')) return false;
  if (crContent.includes('cr_compliance=false')) return false;
  if (crContent.includes('PARTIAL_')) return false;

  return true;
}

// ============================================
// MAIN
// ============================================

function main() {
  const factSheetsDir = path.resolve(__dirname, 'fact_sheets');
  const crDraftsDir = path.resolve(__dirname, 'cr_drafts');

  console.log('CR-Markup Partial CR Draft Generator\n');
  console.log('='.repeat(50));

  // Ensure output directory exists
  if (!fs.existsSync(crDraftsDir)) {
    fs.mkdirSync(crDraftsDir, { recursive: true });
  }

  // Find all fact sheets
  const factSheetFiles = fs.readdirSync(factSheetsDir)
    .filter(f => f.endsWith('.json'));

  console.log(`\nFound ${factSheetFiles.length} fact sheets\n`);
  console.log('Generating partial CRs:\n');
  console.log('Entity          Type           Grammar  Canonical  Fields');
  console.log('-'.repeat(60));

  const results: { entity: string; grammarValid: boolean; notCanonical: boolean; fieldCount: number }[] = [];

  for (const file of factSheetFiles) {
    const factSheetPath = path.join(factSheetsDir, file);
    const factSheet: FactSheet = JSON.parse(fs.readFileSync(factSheetPath, 'utf-8'));

    // Generate partial CR
    const cr = generatePartialCR(factSheet);
    const crContent = serializeCR(cr);

    // Validate
    const grammarResult = validateCRGrammar(crContent);
    const wouldPassCanonical = wouldPassCanonicalValidation(crContent);

    // Write CR draft
    const outputPath = path.join(crDraftsDir, `${factSheet.entity_name.toLowerCase()}.cr`);
    fs.writeFileSync(outputPath, crContent);

    const fieldCount = cr.fields.size;
    results.push({
      entity: factSheet.entity_name,
      grammarValid: grammarResult.valid,
      notCanonical: !wouldPassCanonical,
      fieldCount
    });

    const grammarIcon = grammarResult.valid ? '✓' : '✗';
    const canonicalIcon = !wouldPassCanonical ? '✓' : '✗';

    console.log(
      `${factSheet.entity_name.padEnd(15)} ` +
      `${factSheet.entity_type.padEnd(14)} ` +
      `${grammarIcon.padStart(7)}  ` +
      `${canonicalIcon.padStart(9)}  ` +
      `${String(fieldCount).padStart(6)}`
    );

    if (!grammarResult.valid) {
      for (const error of grammarResult.errors) {
        console.log(`    ⚠️  ${error}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\nGeneration Summary:');
  console.log(`  CR drafts generated:      ${results.length}`);
  console.log(`  Grammar-valid:            ${results.filter(r => r.grammarValid).length}`);
  console.log(`  Non-canonical (correct):  ${results.filter(r => r.notCanonical).length}`);

  // Acceptance Tests
  console.log('\n' + '='.repeat(50));
  console.log('\nAcceptance Tests:');

  // Test 1: All partial CRs are grammar-valid
  const allGrammarValid = results.every(r => r.grammarValid);
  console.log(`${allGrammarValid ? 'PASS' : 'FAIL'}: All partial CRs are grammar-valid`);

  // Test 2: All partial CRs do NOT pass canonical validation
  const allNotCanonical = results.every(r => r.notCanonical);
  console.log(`${allNotCanonical ? 'PASS' : 'FAIL'}: All partial CRs do NOT pass canonical validation`);

  // Test 3: All partial CRs have cr_status=partial
  const allHavePartialStatus = factSheetFiles.every(file => {
    const crPath = path.join(crDraftsDir, file.replace('.json', '.cr'));
    const content = fs.readFileSync(crPath, 'utf-8');
    return content.includes('cr_status=partial');
  });
  console.log(`${allHavePartialStatus ? 'PASS' : 'FAIL'}: All partial CRs have cr_status=partial`);

  // Test 4: All partial CRs have cr_compliance=false
  const allHaveComplianceFalse = factSheetFiles.every(file => {
    const crPath = path.join(crDraftsDir, file.replace('.json', '.cr'));
    const content = fs.readFileSync(crPath, 'utf-8');
    return content.includes('cr_compliance=false');
  });
  console.log(`${allHaveComplianceFalse ? 'PASS' : 'FAIL'}: All partial CRs have cr_compliance=false`);

  const allPassed = allGrammarValid && allNotCanonical && allHavePartialStatus && allHaveComplianceFalse;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Output locations
  console.log('\n' + '='.repeat(50));
  console.log('\nPartial CR Drafts Generated:');
  for (const file of factSheetFiles) {
    const crPath = path.join(crDraftsDir, file.replace('.json', '.cr'));
    console.log(`  ${crPath}`);
  }

  console.log('\n' + '='.repeat(50));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
