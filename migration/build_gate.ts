#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Build Pipeline Gate
 *
 * Runs all gate checks before deployment.
 * Blocks deployment if any entity lacks FULL CR.
 *
 * Usage in CI/CD:
 *   npx tsx migration/build_gate.ts
 *
 * Exit codes:
 *   0 - All gates passed, deployment allowed
 *   1 - Gates failed, deployment blocked
 *
 * Reference: /schema/plan2.md Step 12
 */

import * as fs from 'fs';
import * as path from 'path';
import { checkAllEntities } from './event_gate';
import type { GateCheckResult, EventType } from './event_gate';

// ============================================
// BUILD GATE CHECKS
// ============================================

interface BuildGateResult {
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    details?: string[];
  }[];
  blockedEntities: string[];
  allowedEntities: string[];
}

function runBuildGate(): BuildGateResult {
  const checks: BuildGateResult['checks'] = [];
  const blockedEntities: string[] = [];
  const allowedEntities: string[] = [];

  // Check 1: All entity pages must have CR-BLOCK
  const updateResults = checkAllEntities('update');
  const entitiesWithoutCR = updateResults.filter(r => !r.hasCR);

  checks.push({
    name: 'CR-BLOCK Presence',
    passed: entitiesWithoutCR.length === 0,
    message: entitiesWithoutCR.length === 0
      ? 'All entity pages have CR-BLOCK'
      : `${entitiesWithoutCR.length} pages missing CR-BLOCK`,
    details: entitiesWithoutCR.map(r => r.entity)
  });

  // Check 2: All CRs must be valid
  const invalidCRs = updateResults.filter(r => r.hasCR && !r.crValid);

  checks.push({
    name: 'CR Validation',
    passed: invalidCRs.length === 0,
    message: invalidCRs.length === 0
      ? 'All CRs pass validation'
      : `${invalidCRs.length} CRs fail validation`,
    details: invalidCRs.map(r => `${r.entity}: ${r.reason}`)
  });

  // Check 3: All CRs must be canonical (no migration flags)
  const nonCanonicalCRs = updateResults.filter(r => r.hasCR && !r.crCanonical);

  checks.push({
    name: 'CR Canonicality',
    passed: nonCanonicalCRs.length === 0,
    message: nonCanonicalCRs.length === 0
      ? 'All CRs are canonical (FULL CR)'
      : `${nonCanonicalCRs.length} CRs are not canonical`,
    details: nonCanonicalCRs.map(r => `${r.entity}: ${r.reason}`)
  });

  // Check 4: Sitemap gate
  const sitemapResults = checkAllEntities('sitemap');
  const sitemapBlocked = sitemapResults.filter(r => !r.allowed);

  checks.push({
    name: 'Sitemap Gate',
    passed: sitemapBlocked.length === 0,
    message: sitemapBlocked.length === 0
      ? 'All entities eligible for sitemap'
      : `${sitemapBlocked.length} entities blocked from sitemap`,
    details: sitemapBlocked.map(r => r.entity)
  });

  // Check 5: Comparison gate
  const comparisonResults = checkAllEntities('comparison');
  const comparisonBlocked = comparisonResults.filter(r => !r.allowed);

  checks.push({
    name: 'Comparison Gate',
    passed: comparisonBlocked.length === 0,
    message: comparisonBlocked.length === 0
      ? 'All entities eligible for comparison'
      : `${comparisonBlocked.length} entities blocked from comparison`,
    details: comparisonBlocked.map(r => r.entity)
  });

  // Check 6: AI citation gate
  const aiResults = checkAllEntities('ai_citation');
  const aiBlocked = aiResults.filter(r => !r.allowed);

  checks.push({
    name: 'AI Citation Gate',
    passed: aiBlocked.length === 0,
    message: aiBlocked.length === 0
      ? 'All entities eligible for AI citation'
      : `${aiBlocked.length} entities blocked from AI citation`,
    details: aiBlocked.map(r => r.entity)
  });

  // Collect blocked/allowed entities
  for (const result of updateResults) {
    if (result.allowed) {
      allowedEntities.push(result.entity);
    } else {
      blockedEntities.push(result.entity);
    }
  }

  // Overall pass/fail
  const passed = checks.every(c => c.passed);

  return {
    passed,
    checks,
    blockedEntities,
    allowedEntities
  };
}

// ============================================
// MAIN
// ============================================

function main() {
  console.log('CR-Markup Build Pipeline Gate\n');
  console.log('='.repeat(70));
  console.log('\nRunning pre-deployment checks...\n');

  const result = runBuildGate();

  // Print check results
  console.log('Check Results:');
  console.log('-'.repeat(70));

  for (const check of result.checks) {
    const status = check.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`\n  ${status}: ${check.name}`);
    console.log(`         ${check.message}`);

    if (!check.passed && check.details && check.details.length > 0) {
      console.log('         Affected:');
      for (const detail of check.details.slice(0, 5)) {
        console.log(`           - ${detail}`);
      }
      if (check.details.length > 5) {
        console.log(`           ... and ${check.details.length - 5} more`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\nBuild Gate Summary:');
  console.log(`  Allowed entities:  ${result.allowedEntities.length}`);
  console.log(`  Blocked entities:  ${result.blockedEntities.length}`);
  console.log(`  Checks passed:     ${result.checks.filter(c => c.passed).length}/${result.checks.length}`);

  // Final verdict
  console.log('\n' + '='.repeat(70));

  if (result.passed) {
    console.log('\n✅ BUILD GATE PASSED');
    console.log('   Deployment allowed - all entities have FULL CR');
  } else {
    console.log('\n❌ BUILD GATE FAILED');
    console.log('   Deployment blocked - some entities lack FULL CR');
    console.log('\n   To fix:');
    console.log('   1. Run: npx tsx migration/cr_binder.ts');
    console.log('   2. Run: npx tsx migration/cr_binding_validator.ts');
    console.log('   3. Ensure all CRs are promoted to FULL (no migration flags)');
  }

  console.log('\n' + '='.repeat(70));

  return result.passed;
}

// Export for programmatic use
export { runBuildGate };
export type { BuildGateResult };

// CLI entry point
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}
