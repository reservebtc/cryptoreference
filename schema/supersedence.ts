/**
 * CR-Markup Protocol v1.0 - Supersedence Resolver
 *
 * Implements immutable history with forward correction:
 * - CR-blocks are IMMUTABLE once valid
 * - Errors are corrected via supersedence, not mutation
 * - supersedes: token of the CR-block being replaced
 * - supersedes_hash: hash of the CR-block being replaced
 *
 * Key principles:
 * - Cannot mutate existing CR
 * - Supersedence links entities, not URLs
 * - Chain of supersedence creates version history
 *
 * Reference: /schema/spec.md
 */

import { validateCR, ValidationResult } from './validate_cr';
import { isValidHashFormat } from './hash';

// ============================================
// TYPES
// ============================================

export interface SupersedenceInfo {
  supersedes: string;        // Token being superseded
  supersedes_hash: string;   // Hash of superseded CR-block
}

export interface SupersedenceValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  chain?: SupersedenceChain;
}

export interface SupersedenceChain {
  current: CRReference;
  superseded: CRReference[];
  depth: number;
}

export interface CRReference {
  token: string;
  hash: string;
  supersedes?: string;
  supersedes_hash?: string;
}

export interface CRRegistry {
  blocks: Map<string, CRReference>;  // hash -> reference
  byToken: Map<string, string[]>;    // token -> [hashes]
  latestByToken: Map<string, string>; // token -> latest hash
}

// ============================================
// REGISTRY (In-Memory Store)
// ============================================

/**
 * Creates a new CR registry for tracking blocks.
 */
export function createRegistry(): CRRegistry {
  return {
    blocks: new Map(),
    byToken: new Map(),
    latestByToken: new Map()
  };
}

/**
 * Registers a CR-block in the registry.
 */
export function registerCR(
  registry: CRRegistry,
  ref: CRReference
): { success: boolean; error?: string } {
  // Check if hash already exists (immutability)
  if (registry.blocks.has(ref.hash)) {
    return {
      success: false,
      error: `CR-block with hash ${ref.hash} already exists (immutable)`
    };
  }

  // Register the block
  registry.blocks.set(ref.hash, ref);

  // Track by token
  const tokenHashes = registry.byToken.get(ref.token) || [];
  tokenHashes.push(ref.hash);
  registry.byToken.set(ref.token, tokenHashes);

  // Update latest (if superseding or first)
  if (ref.supersedes_hash) {
    // This is a superseding block - it becomes latest
    registry.latestByToken.set(ref.token, ref.hash);
  } else if (!registry.latestByToken.has(ref.token)) {
    // First block for this token
    registry.latestByToken.set(ref.token, ref.hash);
  }

  return { success: true };
}

// ============================================
// SUPERSEDENCE VALIDATION
// ============================================

/**
 * Extracts supersedence info from a CR-block's parsed data.
 */
export function extractSupersedence(
  fields: Record<string, unknown>
): SupersedenceInfo | null {
  const supersedes = fields.supersedes as string | undefined;
  const supersedes_hash = fields.supersedes_hash as string | undefined;

  if (!supersedes && !supersedes_hash) {
    return null; // No supersedence
  }

  if (supersedes && !supersedes_hash) {
    return null; // Invalid: supersedes requires supersedes_hash
  }

  if (!supersedes && supersedes_hash) {
    return null; // Invalid: supersedes_hash requires supersedes
  }

  return {
    supersedes: supersedes!,
    supersedes_hash: supersedes_hash!
  };
}

/**
 * Validates supersedence relationship.
 *
 * Rules:
 * 1. supersedes must be a valid token format
 * 2. supersedes_hash must be valid sha256 format
 * 3. Both must be present together (or neither)
 * 4. Cannot supersede self
 * 5. Target must exist in registry (if registry provided)
 */
export function validateSupersedence(
  newBlock: CRReference,
  registry?: CRRegistry
): SupersedenceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // No supersedence - valid by default
  if (!newBlock.supersedes && !newBlock.supersedes_hash) {
    return { valid: true, errors, warnings };
  }

  // Check both fields present
  if (newBlock.supersedes && !newBlock.supersedes_hash) {
    errors.push('supersedes requires supersedes_hash');
  }

  if (!newBlock.supersedes && newBlock.supersedes_hash) {
    errors.push('supersedes_hash requires supersedes');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Validate token format
  const tokenRegex = /^[A-Z][A-Z0-9_-]*$/;
  if (!tokenRegex.test(newBlock.supersedes!)) {
    errors.push(`Invalid supersedes token format: ${newBlock.supersedes}`);
  }

  // Validate hash format
  if (!isValidHashFormat(newBlock.supersedes_hash!)) {
    errors.push(`Invalid supersedes_hash format: ${newBlock.supersedes_hash}`);
  }

  // Cannot supersede self
  if (newBlock.hash === newBlock.supersedes_hash) {
    errors.push('Cannot supersede self (same hash)');
  }

  if (newBlock.token === newBlock.supersedes && newBlock.hash === newBlock.supersedes_hash) {
    errors.push('Cannot supersede self (same token and hash)');
  }

  // Registry validation (if provided)
  if (registry && newBlock.supersedes_hash) {
    const targetExists = registry.blocks.has(newBlock.supersedes_hash);

    if (!targetExists) {
      errors.push(`Supersedence target not found: ${newBlock.supersedes_hash}`);
    } else {
      const target = registry.blocks.get(newBlock.supersedes_hash)!;

      // Token should match (typically same entity, different version)
      if (target.token !== newBlock.supersedes) {
        errors.push(
          `Supersedes token mismatch: expected ${target.token}, got ${newBlock.supersedes}`
        );
      }

      // Warning if superseding already-superseded block
      const latest = registry.latestByToken.get(target.token);
      if (latest && latest !== newBlock.supersedes_hash) {
        warnings.push(
          `Superseding non-latest version. Latest is ${latest}`
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Build chain if registry available
  let chain: SupersedenceChain | undefined;
  if (registry && newBlock.supersedes_hash) {
    chain = buildSupersedenceChain(newBlock, registry);
  }

  return { valid: true, errors, warnings, chain };
}

/**
 * Builds the supersedence chain for a CR-block.
 */
export function buildSupersedenceChain(
  ref: CRReference,
  registry: CRRegistry
): SupersedenceChain {
  const superseded: CRReference[] = [];
  let current = ref;
  let depth = 0;
  const maxDepth = 100; // Prevent infinite loops

  while (current.supersedes_hash && depth < maxDepth) {
    const prev = registry.blocks.get(current.supersedes_hash);
    if (!prev) break;

    superseded.push(prev);
    current = prev;
    depth++;
  }

  return {
    current: ref,
    superseded,
    depth: superseded.length
  };
}

/**
 * Gets the latest version of a token from the registry.
 */
export function getLatestVersion(
  token: string,
  registry: CRRegistry
): CRReference | null {
  const latestHash = registry.latestByToken.get(token);
  if (!latestHash) return null;

  return registry.blocks.get(latestHash) || null;
}

/**
 * Gets all versions of a token from the registry.
 */
export function getAllVersions(
  token: string,
  registry: CRRegistry
): CRReference[] {
  const hashes = registry.byToken.get(token) || [];
  return hashes
    .map(h => registry.blocks.get(h))
    .filter((r): r is CRReference => r !== undefined);
}

// ============================================
// IMMUTABILITY ENFORCEMENT
// ============================================

/**
 * Checks if a CR-block can be registered (immutability check).
 */
export function canRegister(
  ref: CRReference,
  registry: CRRegistry
): { allowed: boolean; reason?: string } {
  // Hash must be unique (immutability)
  if (registry.blocks.has(ref.hash)) {
    return {
      allowed: false,
      reason: 'CR-block with this hash already exists. CR-blocks are immutable.'
    };
  }

  return { allowed: true };
}

/**
 * Attempts to register with supersedence validation.
 */
export function registerWithSupersedence(
  ref: CRReference,
  registry: CRRegistry
): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check immutability
  const canReg = canRegister(ref, registry);
  if (!canReg.allowed) {
    errors.push(canReg.reason!);
    return { success: false, errors, warnings };
  }

  // Validate supersedence
  const superVal = validateSupersedence(ref, registry);
  if (!superVal.valid) {
    errors.push(...superVal.errors);
  }
  warnings.push(...superVal.warnings);

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Register
  const regResult = registerCR(registry, ref);
  if (!regResult.success) {
    errors.push(regResult.error!);
    return { success: false, errors, warnings };
  }

  return { success: true, errors, warnings };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Create test registry
  const registry = createRegistry();

  // Original CR-block
  const originalRef: CRReference = {
    token: 'TESTENTITY',
    hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
  };

  // Register original
  const regOriginal = registerWithSupersedence(originalRef, registry);
  if (regOriginal.success) {
    results.push('PASS: Test 1 - Original CR registered successfully');
  } else {
    results.push('FAIL: Test 1 - Original CR should register');
    allPassed = false;
  }

  // Test 2: New CR correctly references old one
  const supersedingRef: CRReference = {
    token: 'TESTENTITY',
    hash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    supersedes: 'TESTENTITY',
    supersedes_hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
  };

  const regSuper = registerWithSupersedence(supersedingRef, registry);
  if (regSuper.success) {
    results.push('PASS: Test 2 - New CR correctly references old one');
  } else {
    results.push('FAIL: Test 2 - Superseding CR should register');
    results.push(`       Errors: ${regSuper.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 3: Invalid supersedence target → fail
  const invalidTargetRef: CRReference = {
    token: 'TESTENTITY',
    hash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    supersedes: 'TESTENTITY',
    supersedes_hash: 'sha256:9999999999999999999999999999999999999999999999999999999999999999' // Does not exist
  };

  const regInvalid = registerWithSupersedence(invalidTargetRef, registry);
  if (!regInvalid.success && regInvalid.errors.some(e => e.includes('not found'))) {
    results.push('PASS: Test 3 - Invalid supersedence target rejected');
  } else {
    results.push('FAIL: Test 3 - Invalid target should be rejected');
    allPassed = false;
  }

  // Test 4: Cannot register same hash twice (immutability)
  const duplicateRef: CRReference = {
    token: 'TESTENTITY',
    hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111' // Same as original
  };

  const regDupe = registerWithSupersedence(duplicateRef, registry);
  if (!regDupe.success && regDupe.errors.some(e => e.includes('immutable'))) {
    results.push('PASS: Test 4 - Cannot register same hash twice (immutable)');
  } else {
    results.push('FAIL: Test 4 - Duplicate hash should be rejected');
    allPassed = false;
  }

  // Test 5: supersedes without supersedes_hash → fail
  const missingHashRef: CRReference = {
    token: 'NEWENTITY',
    hash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
    supersedes: 'TESTENTITY'
    // Missing supersedes_hash
  };

  const valMissingHash = validateSupersedence(missingHashRef);
  if (!valMissingHash.valid && valMissingHash.errors.some(e => e.includes('requires'))) {
    results.push('PASS: Test 5 - supersedes without supersedes_hash rejected');
  } else {
    results.push('FAIL: Test 5 - Missing supersedes_hash should fail');
    allPassed = false;
  }

  // Test 6: Invalid hash format → fail
  const badHashRef: CRReference = {
    token: 'NEWENTITY',
    hash: 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
    supersedes: 'TESTENTITY',
    supersedes_hash: 'md5:invalidhash'
  };

  const valBadHash = validateSupersedence(badHashRef);
  if (!valBadHash.valid && valBadHash.errors.some(e => e.includes('format'))) {
    results.push('PASS: Test 6 - Invalid supersedes_hash format rejected');
  } else {
    results.push('FAIL: Test 6 - Bad hash format should fail');
    allPassed = false;
  }

  // Test 7: Get latest version
  const latest = getLatestVersion('TESTENTITY', registry);
  if (latest && latest.hash === supersedingRef.hash) {
    results.push('PASS: Test 7 - getLatestVersion returns superseding block');
  } else {
    results.push('FAIL: Test 7 - Latest should be superseding block');
    allPassed = false;
  }

  // Test 8: Get all versions
  const allVersions = getAllVersions('TESTENTITY', registry);
  if (allVersions.length === 2) {
    results.push('PASS: Test 8 - getAllVersions returns both versions');
  } else {
    results.push('FAIL: Test 8 - Should have 2 versions');
    allPassed = false;
  }

  // Test 9: Build supersedence chain
  const chain = buildSupersedenceChain(supersedingRef, registry);
  if (chain.depth === 1 && chain.superseded[0].hash === originalRef.hash) {
    results.push('PASS: Test 9 - Supersedence chain built correctly');
  } else {
    results.push('FAIL: Test 9 - Chain should have depth 1');
    allPassed = false;
  }

  // Test 10: Cannot supersede self
  const selfRef: CRReference = {
    token: 'SELFTEST',
    hash: 'sha256:6666666666666666666666666666666666666666666666666666666666666666',
    supersedes: 'SELFTEST',
    supersedes_hash: 'sha256:6666666666666666666666666666666666666666666666666666666666666666'
  };

  const valSelf = validateSupersedence(selfRef);
  if (!valSelf.valid && valSelf.errors.some(e => e.includes('self'))) {
    results.push('PASS: Test 10 - Cannot supersede self');
  } else {
    results.push('FAIL: Test 10 - Self-supersedence should fail');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Supersedence Resolver - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example
  console.log('\n\nSupersedence Chain Example:');
  console.log('-'.repeat(60));

  const registry = createRegistry();

  // V1
  const v1: CRReference = {
    token: 'BINANCE',
    hash: 'sha256:aaaa111111111111111111111111111111111111111111111111111111111111'
  };
  registerWithSupersedence(v1, registry);
  console.log('V1 registered:', v1.hash.slice(0, 20) + '...');

  // V2 supersedes V1
  const v2: CRReference = {
    token: 'BINANCE',
    hash: 'sha256:bbbb222222222222222222222222222222222222222222222222222222222222',
    supersedes: 'BINANCE',
    supersedes_hash: v1.hash
  };
  registerWithSupersedence(v2, registry);
  console.log('V2 registered:', v2.hash.slice(0, 20) + '... (supersedes V1)');

  // V3 supersedes V2
  const v3: CRReference = {
    token: 'BINANCE',
    hash: 'sha256:cccc333333333333333333333333333333333333333333333333333333333333',
    supersedes: 'BINANCE',
    supersedes_hash: v2.hash
  };
  registerWithSupersedence(v3, registry);
  console.log('V3 registered:', v3.hash.slice(0, 20) + '... (supersedes V2)');

  const chain = buildSupersedenceChain(v3, registry);
  console.log(`\nChain depth: ${chain.depth}`);
  console.log('Latest:', getLatestVersion('BINANCE', registry)?.hash.slice(0, 20) + '...');
}
