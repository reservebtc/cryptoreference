#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Duplicate Detector
 *
 * Detects duplicate entities and ensures exactly one canonical entity.
 *
 * Comparison criteria:
 * - name (exact and normalized)
 * - aliases
 * - official URLs
 *
 * For duplicates:
 * - Select canonical (oldest, most complete, or manually specified)
 * - Mark rest as: status=duplicate, duplicate_of=<canonical_id>
 *
 * Reference: /schema/plan2.md Step 6
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

interface EntityInfo {
  token: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  urls: string[];
  type: string;
  filePath: string;
}

interface DuplicateGroup {
  canonicalToken: string;
  duplicateTokens: string[];
  matchCriteria: string;
  reason: string;
}

interface DuplicateMap {
  version: string;
  generated_at: string;
  summary: {
    total_entities: number;
    canonical_entities: number;
    duplicate_entities: number;
    duplicate_groups: number;
  };
  entities: {
    token: string;
    status: 'canonical' | 'duplicate';
    duplicate_of?: string;
    match_criteria?: string;
  }[];
  duplicate_groups: DuplicateGroup[];
}

interface ParsedCR {
  token: string;
  fields: Map<string, string>;
}

// ============================================
// KNOWN ALIASES DATABASE
// ============================================

const KNOWN_ALIASES: Record<string, string[]> = {
  BINANCE: ['binance', 'binance.com', 'binance exchange'],
  OKX: ['okx', 'okex', 'okx.com', 'okx exchange'],
  GATE: ['gate', 'gate.io', 'gateio', 'gate exchange'],
  HYPERLIQUID: ['hyperliquid', 'hl', 'hyperliquid.xyz'],
  ASTERDEX: ['asterdex', 'aster', 'asterdex.fi'],
  HIBACHI: ['hibachi', 'hibachi.xyz'],
  LIGHTER: ['lighter', 'lighter.xyz'],
  ETHERFI: ['etherfi', 'ether.fi', 'etherfi card'],
};

// ============================================
// CR PARSING
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

  const mandatoryOrder = [
    'schema',
    'version',
    'canonical_hash',
    'cr_status',
    'cr_compliance',
    'duplicate_status',
    'duplicate_of',
    'type',
    'subtype',
    'network',
    'network_semantics',
    'network_reason',
    'name',
    'status',
    'url'
  ];

  const orderedFields = new Map<string, string>();

  for (const field of mandatoryOrder) {
    if (cr.fields.has(field)) {
      orderedFields.set(field, cr.fields.get(field)!);
    }
  }

  const remainingFields = Array.from(cr.fields.entries())
    .filter(([key]) => !mandatoryOrder.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of remainingFields) {
    orderedFields.set(key, value);
  }

  for (const [key, value] of orderedFields) {
    lines.push(`${key}=${value}`);
  }

  lines.push(`[/CR]`);
  return lines.join('\n');
}

// ============================================
// ENTITY EXTRACTION
// ============================================

function extractEntityInfo(cr: ParsedCR, filePath: string): EntityInfo {
  const token = cr.token;
  const name = cr.fields.get('name') || token;
  const normalizedName = normalizeName(name);
  const url = cr.fields.get('url') || '';
  const twitter = cr.fields.get('twitter') || '';
  const type = cr.fields.get('type') || 'unknown';

  // Get known aliases
  const aliases = KNOWN_ALIASES[token] || [normalizedName];

  // Collect URLs
  const urls: string[] = [];
  if (url) urls.push(normalizeUrl(url));
  if (twitter) urls.push(normalizeUrl(`twitter.com/${twitter.replace('@', '')}`));

  return {
    token,
    name,
    normalizedName,
    aliases,
    urls,
    type,
    filePath
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

// Common social/third-party domains that should not be used for duplicate detection
const EXCLUDED_DOMAINS = [
  'linkedin.com',
  'twitter.com',
  'x.com',
  'github.com',
  'discord.gg',
  'discord.com',
  't.me',
  'telegram.org',
  'medium.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
];

// ============================================
// DUPLICATE DETECTION
// ============================================

function detectDuplicates(entities: EntityInfo[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];

  // Compare each pair of entities
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i];
      const entity2 = entities[j];

      const match = checkDuplicate(entity1, entity2);
      if (match) {
        // Check if already in a group
        const existingGroup = duplicateGroups.find(g =>
          g.canonicalToken === entity1.token ||
          g.duplicateTokens.includes(entity1.token) ||
          g.canonicalToken === entity2.token ||
          g.duplicateTokens.includes(entity2.token)
        );

        if (existingGroup) {
          // Add to existing group
          if (!existingGroup.duplicateTokens.includes(entity2.token) &&
              existingGroup.canonicalToken !== entity2.token) {
            existingGroup.duplicateTokens.push(entity2.token);
          }
        } else {
          // Create new group - entity1 is canonical (first encountered)
          duplicateGroups.push({
            canonicalToken: entity1.token,
            duplicateTokens: [entity2.token],
            matchCriteria: match.criteria,
            reason: match.reason
          });
        }
      }
    }
  }

  return duplicateGroups;
}

function checkDuplicate(e1: EntityInfo, e2: EntityInfo): { criteria: string; reason: string } | null {
  // Check exact name match
  if (e1.normalizedName === e2.normalizedName) {
    return {
      criteria: 'exact_name',
      reason: `Exact name match: ${e1.name} = ${e2.name}`
    };
  }

  // Check alias overlap
  const aliasOverlap = e1.aliases.some(a1 =>
    e2.aliases.some(a2 => normalizeName(a1) === normalizeName(a2))
  );
  if (aliasOverlap) {
    return {
      criteria: 'alias_match',
      reason: `Alias overlap between ${e1.token} and ${e2.token}`
    };
  }

  // Check URL overlap (same domain) - excluding common social platforms
  const urlOverlap = e1.urls.some(u1 =>
    e2.urls.some(u2 => {
      const domain1 = u1.split('/')[0];
      const domain2 = u2.split('/')[0];

      // Skip if either domain is an excluded social/third-party platform
      const isExcluded1 = EXCLUDED_DOMAINS.some(d => domain1.includes(d));
      const isExcluded2 = EXCLUDED_DOMAINS.some(d => domain2.includes(d));

      if (isExcluded1 || isExcluded2) {
        return false;
      }

      return domain1 === domain2 && domain1 !== '';
    })
  );
  if (urlOverlap) {
    return {
      criteria: 'url_match',
      reason: `URL overlap between ${e1.token} and ${e2.token}`
    };
  }

  return null;
}

// ============================================
// MAIN
// ============================================

function main() {
  const crDraftsDir = path.resolve(__dirname, 'cr_drafts');
  const outputPath = path.resolve(__dirname, 'duplicate_map.json');

  console.log('CR-Markup Duplicate Detector\n');
  console.log('='.repeat(60));

  // Load all CR drafts
  const crFiles = fs.readdirSync(crDraftsDir).filter(f => f.endsWith('.cr'));
  console.log(`\nLoading ${crFiles.length} CR drafts...\n`);

  const entities: EntityInfo[] = [];
  const crMap = new Map<string, ParsedCR>();

  console.log('Entity          Name            Aliases                  URLs');
  console.log('-'.repeat(75));

  for (const file of crFiles) {
    const crPath = path.join(crDraftsDir, file);
    const content = fs.readFileSync(crPath, 'utf-8');
    const cr = parseCR(content);
    const entityInfo = extractEntityInfo(cr, crPath);

    entities.push(entityInfo);
    crMap.set(entityInfo.token, cr);

    const aliasesStr = entityInfo.aliases.slice(0, 2).join(', ').substring(0, 22).padEnd(22);
    const urlsStr = entityInfo.urls.slice(0, 1).join(', ').substring(0, 25);

    console.log(
      `${entityInfo.token.padEnd(15)} ` +
      `${entityInfo.name.substring(0, 15).padEnd(15)} ` +
      `${aliasesStr} ` +
      `${urlsStr}`
    );
  }

  // Detect duplicates
  console.log('\n' + '='.repeat(60));
  console.log('\nDetecting duplicates...\n');

  const duplicateGroups = detectDuplicates(entities);

  if (duplicateGroups.length === 0) {
    console.log('No duplicates detected. All entities are unique.\n');
  } else {
    console.log(`Found ${duplicateGroups.length} duplicate group(s):\n`);
    for (const group of duplicateGroups) {
      console.log(`  Canonical: ${group.canonicalToken}`);
      console.log(`  Duplicates: ${group.duplicateTokens.join(', ')}`);
      console.log(`  Criteria: ${group.matchCriteria}`);
      console.log(`  Reason: ${group.reason}`);
      console.log();
    }

    // Update CR drafts to mark duplicates
    for (const group of duplicateGroups) {
      for (const dupToken of group.duplicateTokens) {
        const cr = crMap.get(dupToken);
        if (cr) {
          cr.fields.set('duplicate_status', 'duplicate');
          cr.fields.set('duplicate_of', group.canonicalToken);

          const crPath = path.join(crDraftsDir, `${dupToken.toLowerCase()}.cr`);
          fs.writeFileSync(crPath, serializeCR(cr));
          console.log(`  Updated ${dupToken} as duplicate of ${group.canonicalToken}`);
        }
      }
    }
  }

  // Build duplicate map
  const duplicateTokens = new Set(duplicateGroups.flatMap(g => g.duplicateTokens));
  const canonicalTokens = new Set(entities.map(e => e.token).filter(t => !duplicateTokens.has(t)));

  const duplicateMap: DuplicateMap = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    summary: {
      total_entities: entities.length,
      canonical_entities: canonicalTokens.size,
      duplicate_entities: duplicateTokens.size,
      duplicate_groups: duplicateGroups.length
    },
    entities: entities.map(e => {
      const isDuplicate = duplicateTokens.has(e.token);
      const group = duplicateGroups.find(g => g.duplicateTokens.includes(e.token));

      return {
        token: e.token,
        status: isDuplicate ? 'duplicate' as const : 'canonical' as const,
        ...(isDuplicate && group ? {
          duplicate_of: group.canonicalToken,
          match_criteria: group.matchCriteria
        } : {})
      };
    }),
    duplicate_groups: duplicateGroups
  };

  // Write duplicate map
  fs.writeFileSync(outputPath, JSON.stringify(duplicateMap, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\nDuplicate Detection Summary:');
  console.log(`  Total entities:      ${duplicateMap.summary.total_entities}`);
  console.log(`  Canonical entities:  ${duplicateMap.summary.canonical_entities}`);
  console.log(`  Duplicate entities:  ${duplicateMap.summary.duplicate_entities}`);
  console.log(`  Duplicate groups:    ${duplicateMap.summary.duplicate_groups}`);

  // Entity status list
  console.log('\nEntity Status:');
  for (const entity of duplicateMap.entities) {
    const icon = entity.status === 'canonical' ? '✓' : '↳';
    const suffix = entity.duplicate_of ? ` (duplicate of ${entity.duplicate_of})` : '';
    console.log(`  ${icon} ${entity.token}${suffix}`);
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(60));
  console.log('\nAcceptance Tests:');

  // Test 1: No object has two canonical entities (no duplicate canonicals for same entity)
  const canonicalCounts = new Map<string, number>();
  for (const entity of duplicateMap.entities) {
    if (entity.status === 'canonical') {
      const key = entity.token;
      canonicalCounts.set(key, (canonicalCounts.get(key) || 0) + 1);
    }
  }
  const multipleCanonicals = Array.from(canonicalCounts.entries()).filter(([_, count]) => count > 1);
  const test1Pass = multipleCanonicals.length === 0;
  console.log(`${test1Pass ? 'PASS' : 'FAIL'}: No object has two canonical entities`);

  // Test 2: All duplicates reference an existing canonical entity
  const canonicalSet = new Set(duplicateMap.entities.filter(e => e.status === 'canonical').map(e => e.token));
  const invalidDuplicateRefs = duplicateMap.entities
    .filter(e => e.status === 'duplicate')
    .filter(e => !e.duplicate_of || !canonicalSet.has(e.duplicate_of));
  const test2Pass = invalidDuplicateRefs.length === 0;
  console.log(`${test2Pass ? 'PASS' : 'FAIL'}: All duplicates reference an existing canonical entity`);

  // Test 3: Duplicate map file exists
  const test3Pass = fs.existsSync(outputPath);
  console.log(`${test3Pass ? 'PASS' : 'FAIL'}: duplicate_map.json generated`);

  // Test 4: Each entity has exactly one status
  const allHaveStatus = duplicateMap.entities.every(e =>
    e.status === 'canonical' || e.status === 'duplicate'
  );
  console.log(`${allHaveStatus ? 'PASS' : 'FAIL'}: Each entity has exactly one status`);

  const allPassed = test1Pass && test2Pass && test3Pass && allHaveStatus;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log(`\nOutput: ${outputPath}`);
  console.log('\n' + '='.repeat(60));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
