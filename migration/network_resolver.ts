#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Network Semantics Resolver
 *
 * Resolves network ambiguity for each entity.
 *
 * Rules:
 * - off-chain → network omitted/null
 * - multi-chain → network only in child entities (parent uses array or "multi")
 * - unknown → network=unknown + reason
 * - on-chain → network mandatory
 *
 * Reference: /schema/plan2.md Step 5
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

type NetworkSemantics = 'off-chain' | 'multi-chain' | 'single-chain' | 'own-l1' | 'unknown';

interface NetworkResolution {
  entity: string;
  entityType: string;
  semantics: NetworkSemantics;
  originalNetwork: string;
  resolvedNetwork: string;
  reason: string;
  hasChildEntities: boolean;
}

interface ParsedCR {
  token: string;
  fields: Map<string, string>;
  raw: string;
}

// ============================================
// NETWORK KNOWLEDGE BASE
// ============================================

const NETWORK_KNOWLEDGE: Record<string, {
  semantics: NetworkSemantics;
  networks: string[];
  reason: string;
}> = {
  // CEX - Off-chain exchanges (support multiple networks for deposits/withdrawals)
  BINANCE: {
    semantics: 'off-chain',
    networks: [],
    reason: 'Centralized exchange - trading happens off-chain'
  },
  OKX: {
    semantics: 'off-chain',
    networks: [],
    reason: 'Centralized exchange - trading happens off-chain'
  },
  GATE: {
    semantics: 'off-chain',
    networks: [],
    reason: 'Centralized exchange - trading happens off-chain'
  },

  // DEX - On-chain with specific networks
  HYPERLIQUID: {
    semantics: 'own-l1',
    networks: ['hyperliquid-l1'],
    reason: 'Native L1 blockchain - all trading on Hyperliquid L1'
  },
  ASTERDEX: {
    semantics: 'multi-chain',
    networks: ['arbitrum', 'base', 'optimism'],
    reason: 'Multi-chain DEX - deployed on multiple L2s'
  },
  HIBACHI: {
    semantics: 'single-chain',
    networks: ['solana'],
    reason: 'Solana-native DEX - all trading on Solana'
  },
  LIGHTER: {
    semantics: 'single-chain',
    networks: ['arbitrum'],
    reason: 'Arbitrum-native DEX - all trading on Arbitrum'
  },

  // Cards - Off-chain with multi-chain support for funding
  ETHERFI: {
    semantics: 'off-chain',
    networks: [],
    reason: 'Crypto card - card transactions are off-chain, funding supports multiple networks'
  }
};

// ============================================
// CR PARSING
// ============================================

function parseCR(content: string): ParsedCR {
  const lines = content.trim().split('\n');
  const fields = new Map<string, string>();

  // Extract token from opening tag
  const openingMatch = lines[0].match(/^\[CR\/([A-Z0-9_-]+)\]$/);
  const token = openingMatch ? openingMatch[1] : 'UNKNOWN';

  // Parse fields
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const key = line.substring(0, eqIndex);
      const value = line.substring(eqIndex + 1);
      fields.set(key, value);
    }
  }

  return { token, fields, raw: content };
}

function serializeCR(cr: ParsedCR): string {
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
    'network_semantics',
    'network_reason',
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

// ============================================
// NETWORK RESOLUTION
// ============================================

function resolveNetwork(cr: ParsedCR): NetworkResolution {
  const entity = cr.token;
  const entityType = cr.fields.get('type') || 'unknown';
  const originalNetwork = cr.fields.get('network') || 'unset';

  const knowledge = NETWORK_KNOWLEDGE[entity];

  if (!knowledge) {
    // Unknown entity - mark as unknown
    return {
      entity,
      entityType,
      semantics: 'unknown',
      originalNetwork,
      resolvedNetwork: 'unknown',
      reason: 'Entity not in knowledge base - requires manual resolution',
      hasChildEntities: false
    };
  }

  let resolvedNetwork: string;

  switch (knowledge.semantics) {
    case 'off-chain':
      // Off-chain entities: network can be null or omitted
      // We use "null" to explicitly indicate off-chain
      resolvedNetwork = 'null';
      break;

    case 'multi-chain':
      // Multi-chain: use array notation
      resolvedNetwork = JSON.stringify(knowledge.networks);
      break;

    case 'single-chain':
      // Single-chain: use the specific network
      resolvedNetwork = knowledge.networks[0];
      break;

    case 'own-l1':
      // Own L1: use the L1 name
      resolvedNetwork = knowledge.networks[0];
      break;

    default:
      resolvedNetwork = 'unknown';
  }

  return {
    entity,
    entityType,
    semantics: knowledge.semantics,
    originalNetwork,
    resolvedNetwork,
    reason: knowledge.reason,
    hasChildEntities: knowledge.semantics === 'multi-chain'
  };
}

function applyNetworkResolution(cr: ParsedCR, resolution: NetworkResolution): ParsedCR {
  const updatedFields = new Map(cr.fields);

  // Update network field
  updatedFields.set('network', resolution.resolvedNetwork);

  // Add semantics metadata
  updatedFields.set('network_semantics', resolution.semantics);
  updatedFields.set('network_reason', `"${resolution.reason}"`);

  return {
    token: cr.token,
    fields: updatedFields,
    raw: cr.raw
  };
}

// ============================================
// VALIDATION
// ============================================

function validateNetworkSemantics(resolution: NetworkResolution): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for unresolved semantics
  if (resolution.semantics === 'unknown') {
    issues.push(`Unresolved network semantics for ${resolution.entity}`);
  }

  // Multi-chain parent should not have single network
  if (resolution.semantics === 'multi-chain') {
    if (!resolution.resolvedNetwork.startsWith('[')) {
      issues.push(`Multi-chain entity ${resolution.entity} should have network array`);
    }
  }

  // Single-chain should have specific network
  if (resolution.semantics === 'single-chain') {
    if (resolution.resolvedNetwork === 'multi' || resolution.resolvedNetwork.startsWith('[')) {
      issues.push(`Single-chain entity ${resolution.entity} should have specific network`);
    }
  }

  // Off-chain should have null network
  if (resolution.semantics === 'off-chain') {
    if (resolution.resolvedNetwork !== 'null') {
      issues.push(`Off-chain entity ${resolution.entity} should have network=null`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ============================================
// MAIN
// ============================================

function main() {
  const crDraftsDir = path.resolve(__dirname, 'cr_drafts');

  console.log('CR-Markup Network Semantics Resolver\n');
  console.log('='.repeat(60));

  // Find all CR drafts
  const crFiles = fs.readdirSync(crDraftsDir)
    .filter(f => f.endsWith('.cr'));

  console.log(`\nFound ${crFiles.length} CR drafts\n`);
  console.log('Resolving network semantics:\n');
  console.log('Entity          Semantics      Original        Resolved');
  console.log('-'.repeat(65));

  const resolutions: NetworkResolution[] = [];
  const allIssues: string[] = [];

  for (const file of crFiles) {
    const crPath = path.join(crDraftsDir, file);
    const content = fs.readFileSync(crPath, 'utf-8');
    const cr = parseCR(content);

    // Resolve network
    const resolution = resolveNetwork(cr);
    resolutions.push(resolution);

    // Validate
    const validation = validateNetworkSemantics(resolution);
    if (!validation.valid) {
      allIssues.push(...validation.issues);
    }

    // Apply resolution and save
    const updatedCR = applyNetworkResolution(cr, resolution);
    const serialized = serializeCR(updatedCR);
    fs.writeFileSync(crPath, serialized);

    // Format output
    const semanticsStr = resolution.semantics.padEnd(14);
    const originalStr = resolution.originalNetwork.substring(0, 15).padEnd(15);
    const resolvedStr = resolution.resolvedNetwork.substring(0, 20);

    console.log(
      `${resolution.entity.padEnd(15)} ` +
      `${semanticsStr} ` +
      `${originalStr} ` +
      `${resolvedStr}`
    );
  }

  // Summary by semantics
  console.log('\n' + '='.repeat(60));
  console.log('\nNetwork Semantics Summary:');

  const semanticsCounts = resolutions.reduce((acc, r) => {
    acc[r.semantics] = (acc[r.semantics] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [semantics, count] of Object.entries(semanticsCounts)) {
    console.log(`  ${semantics.padEnd(15)}: ${count}`);
  }

  // Detailed breakdown
  console.log('\nDetailed Breakdown:');

  console.log('\n  Off-chain (CEX/Cards):');
  for (const r of resolutions.filter(r => r.semantics === 'off-chain')) {
    console.log(`    ${r.entity}: ${r.reason}`);
  }

  console.log('\n  Multi-chain DEX:');
  for (const r of resolutions.filter(r => r.semantics === 'multi-chain')) {
    console.log(`    ${r.entity}: ${r.resolvedNetwork}`);
  }

  console.log('\n  Single-chain DEX:');
  for (const r of resolutions.filter(r => r.semantics === 'single-chain')) {
    console.log(`    ${r.entity}: ${r.resolvedNetwork}`);
  }

  console.log('\n  Own L1:');
  for (const r of resolutions.filter(r => r.semantics === 'own-l1')) {
    console.log(`    ${r.entity}: ${r.resolvedNetwork}`);
  }

  // Acceptance Tests
  console.log('\n' + '='.repeat(60));
  console.log('\nAcceptance Tests:');

  // Test 1: No entity has unresolved network semantics
  const unresolvedCount = resolutions.filter(r => r.semantics === 'unknown').length;
  const test1Pass = unresolvedCount === 0;
  console.log(`${test1Pass ? 'PASS' : 'FAIL'}: No entity has unresolved network semantics (${unresolvedCount} unresolved)`);

  // Test 2: Multi-chain parent does not contain single network
  const multiChainWithSingle = resolutions.filter(r =>
    r.semantics === 'multi-chain' && !r.resolvedNetwork.startsWith('[')
  );
  const test2Pass = multiChainWithSingle.length === 0;
  console.log(`${test2Pass ? 'PASS' : 'FAIL'}: Multi-chain parent does not contain single network`);

  // Test 3: Off-chain entities have network=null
  const offChainWithNetwork = resolutions.filter(r =>
    r.semantics === 'off-chain' && r.resolvedNetwork !== 'null'
  );
  const test3Pass = offChainWithNetwork.length === 0;
  console.log(`${test3Pass ? 'PASS' : 'FAIL'}: Off-chain entities have network=null`);

  // Test 4: On-chain entities have specific network
  const onChainWithoutNetwork = resolutions.filter(r =>
    ['single-chain', 'own-l1'].includes(r.semantics) &&
    (r.resolvedNetwork === 'null' || r.resolvedNetwork === 'unknown')
  );
  const test4Pass = onChainWithoutNetwork.length === 0;
  console.log(`${test4Pass ? 'PASS' : 'FAIL'}: On-chain entities have specific network`);

  // Test 5: All CRs have network_semantics field
  const allHaveSemantics = crFiles.every(file => {
    const content = fs.readFileSync(path.join(crDraftsDir, file), 'utf-8');
    return content.includes('network_semantics=');
  });
  console.log(`${allHaveSemantics ? 'PASS' : 'FAIL'}: All CRs have network_semantics field`);

  const allPassed = test1Pass && test2Pass && test3Pass && test4Pass && allHaveSemantics;
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  if (allIssues.length > 0) {
    console.log('\nIssues Found:');
    for (const issue of allIssues) {
      console.log(`  ⚠️  ${issue}`);
    }
  }

  console.log('\n' + '='.repeat(60));

  return allPassed;
}

// Run
const success = main();
process.exit(success ? 0 : 1);
