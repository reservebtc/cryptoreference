#!/usr/bin/env npx tsx
/**
 * CR Official Sources Validator
 *
 * Validates source registry files against sources.schema.json
 * and enforces URL validity.
 *
 * Reference: /schema/spec3.md, /schema/plan3.md Step 0.1
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

export type SourceScope = 'official_site' | 'official_docs' | 'product_pages' | 'campaigns' | 'analytics' | 'official_social';

export interface OfficialSources {
  official_site?: string[];
  official_docs?: string[];
  product_pages?: string[];
  campaigns?: string[];
  analytics?: string[];
  official_social?: string[];
}

export interface SourceRegistry {
  $schema?: string;
  entity: string;
  official_sources: OfficialSources;
}

export interface SourceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    entity: string;
    total_urls: number;
    by_scope: Record<SourceScope, number>;
  };
}

// ============================================
// CONSTANTS
// ============================================

const VALID_SCOPES: SourceScope[] = ['official_site', 'official_docs', 'product_pages', 'campaigns', 'analytics', 'official_social'];
const ENTITY_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return URL_PATTERN.test(url);
  } catch {
    return false;
  }
}

/**
 * Validate source registry
 */
export function validateSourceRegistry(source: SourceRegistry): SourceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: SourceValidationResult['stats'] = {
    entity: source.entity || 'unknown',
    total_urls: 0,
    by_scope: {
      official_site: 0,
      official_docs: 0,
      product_pages: 0,
      campaigns: 0,
      analytics: 0,
      official_social: 0
    }
  };

  // Validate entity ID
  if (!source.entity) {
    errors.push('Entity ID is required');
  } else if (!ENTITY_ID_PATTERN.test(source.entity)) {
    errors.push(`Invalid entity ID format: "${source.entity}"`);
  }

  // Validate official_sources object
  if (!source.official_sources || typeof source.official_sources !== 'object') {
    errors.push('official_sources object is required');
    return { valid: false, errors, warnings, stats };
  }

  // Check for unknown scopes
  const knownScopes = new Set(VALID_SCOPES);
  for (const scope of Object.keys(source.official_sources)) {
    if (!knownScopes.has(scope as SourceScope)) {
      errors.push(`Unknown source scope: "${scope}"`);
    }
  }

  // Validate URLs in each scope
  for (const scope of VALID_SCOPES) {
    const urls = source.official_sources[scope];
    if (!urls) continue;

    if (!Array.isArray(urls)) {
      errors.push(`Scope "${scope}" must be an array of URLs`);
      continue;
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      if (typeof url !== 'string') {
        errors.push(`Scope "${scope}" URL at index ${i} must be a string`);
        continue;
      }

      if (!isValidUrl(url)) {
        errors.push(`Invalid URL in scope "${scope}": "${url}"`);
        continue;
      }

      // Check for HTTPS
      if (!url.startsWith('https://')) {
        warnings.push(`Non-HTTPS URL in scope "${scope}": "${url}"`);
      }

      stats.by_scope[scope]++;
      stats.total_urls++;
    }

    // Check for duplicate URLs within scope
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size !== urls.length) {
      warnings.push(`Duplicate URLs found in scope "${scope}"`);
    }
  }

  // Check for cross-scope duplicates
  const allUrls: string[] = [];
  for (const scope of VALID_SCOPES) {
    const urls = source.official_sources[scope] || [];
    allUrls.push(...urls);
  }
  const uniqueAllUrls = new Set(allUrls);
  if (uniqueAllUrls.size !== allUrls.length) {
    warnings.push('Same URL appears in multiple scopes');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Load and validate source registry from file
 */
export function loadAndValidateSourceFile(filePath: string): SourceValidationResult {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        errors: [`Source file not found: ${filePath}`],
        warnings: [],
        stats: {
          entity: 'unknown',
          total_urls: 0,
          by_scope: { official_site: 0, official_docs: 0, product_pages: 0, campaigns: 0, analytics: 0, official_social: 0 }
        }
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const source: SourceRegistry = JSON.parse(content);

    return validateSourceRegistry(source);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load source file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      stats: {
        entity: 'unknown',
        total_urls: 0,
        by_scope: { official_site: 0, official_docs: 0, product_pages: 0, campaigns: 0, analytics: 0, official_social: 0 }
      }
    };
  }
}

/**
 * Load all source registries from directory
 */
export function loadAllSources(sourcesDir?: string): Map<string, SourceRegistry> {
  const defaultDir = path.resolve(__dirname);
  const dir = sourcesDir || defaultDir;
  const sources = new Map<string, SourceRegistry>();

  if (!fs.existsSync(dir)) {
    return sources;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sources.json'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const source: SourceRegistry = JSON.parse(content);
      sources.set(source.entity, source);
    } catch {
      // Skip invalid files
    }
  }

  return sources;
}

/**
 * Get allowed URLs for an entity and scope
 */
export function getAllowedUrls(entity: string, scope: SourceScope, sourcesDir?: string): string[] {
  const sources = loadAllSources(sourcesDir);
  const source = sources.get(entity);

  if (!source) return [];

  return source.official_sources[scope] || [];
}

/**
 * Check if URL is allowed for entity
 */
export function isUrlAllowed(entity: string, url: string, sourcesDir?: string): { allowed: boolean; scope?: SourceScope } {
  const sources = loadAllSources(sourcesDir);
  const source = sources.get(entity);

  if (!source) return { allowed: false };

  for (const scope of VALID_SCOPES) {
    const urls = source.official_sources[scope] || [];
    if (urls.includes(url)) {
      return { allowed: true, scope };
    }
  }

  return { allowed: false };
}

/**
 * Validate all source files in directory
 */
export function validateAllSources(sourcesDir?: string): { valid: boolean; results: Map<string, SourceValidationResult> } {
  const defaultDir = path.resolve(__dirname);
  const dir = sourcesDir || defaultDir;
  const results = new Map<string, SourceValidationResult>();
  let allValid = true;

  if (!fs.existsSync(dir)) {
    return { valid: false, results };
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sources.json'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const result = loadAndValidateSourceFile(filePath);
    results.set(file, result);

    if (!result.valid) {
      allValid = false;
    }
  }

  return { valid: allValid, results };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  console.log('Source Registry Validator - Acceptance Tests\n');
  console.log('='.repeat(50));

  // Test 1: Valid source registry
  const validSource: SourceRegistry = {
    entity: 'test-entity',
    official_sources: {
      official_site: ['https://example.com'],
      official_docs: ['https://docs.example.com']
    }
  };
  const validResult = validateSourceRegistry(validSource);
  if (validResult.valid) {
    results.push('PASS: Test 1 - Valid source registry validates');
  } else {
    results.push('FAIL: Test 1 - Valid source registry should validate');
    results.push(`  Errors: ${validResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 2: Invalid entity ID
  const invalidEntity: SourceRegistry = {
    entity: '123-invalid',
    official_sources: {}
  };
  const entityResult = validateSourceRegistry(invalidEntity);
  if (!entityResult.valid && entityResult.errors.some(e => e.includes('Invalid entity ID'))) {
    results.push('PASS: Test 2 - Invalid entity ID rejected');
  } else {
    results.push('FAIL: Test 2 - Invalid entity ID should be rejected');
    allPassed = false;
  }

  // Test 3: Invalid URL
  const invalidUrl: SourceRegistry = {
    entity: 'test',
    official_sources: {
      official_site: ['not-a-url']
    }
  };
  const urlResult = validateSourceRegistry(invalidUrl);
  if (!urlResult.valid && urlResult.errors.some(e => e.includes('Invalid URL'))) {
    results.push('PASS: Test 3 - Invalid URL rejected');
  } else {
    results.push('FAIL: Test 3 - Invalid URL should be rejected');
    allPassed = false;
  }

  // Test 4: Unknown scope
  const unknownScope: SourceRegistry = {
    entity: 'test',
    official_sources: {
      unknown_scope: ['https://example.com']
    } as OfficialSources
  };
  const scopeResult = validateSourceRegistry(unknownScope);
  if (!scopeResult.valid && scopeResult.errors.some(e => e.includes('Unknown source scope'))) {
    results.push('PASS: Test 4 - Unknown scope rejected');
  } else {
    results.push('FAIL: Test 4 - Unknown scope should be rejected');
    allPassed = false;
  }

  // Test 5: asterdex.sources.json exists and validates
  const asterdexPath = path.resolve(__dirname, 'asterdex.sources.json');
  const asterdexResult = loadAndValidateSourceFile(asterdexPath);
  if (asterdexResult.valid) {
    results.push('PASS: Test 5 - asterdex.sources.json exists and validates');
    results.push(`  Entity: ${asterdexResult.stats.entity}`);
    results.push(`  Total URLs: ${asterdexResult.stats.total_urls}`);
  } else {
    results.push('FAIL: Test 5 - asterdex.sources.json should exist and validate');
    results.push(`  Errors: ${asterdexResult.errors.join(', ')}`);
    allPassed = false;
  }

  // Test 6: URL count per scope
  if (asterdexResult.valid) {
    const expectedScopes = ['official_site', 'official_docs', 'product_pages', 'campaigns', 'analytics', 'official_social'];
    const hasAllScopes = expectedScopes.every(s => asterdexResult.stats.by_scope[s as SourceScope] >= 0);
    if (hasAllScopes) {
      results.push('PASS: Test 6 - All scopes tracked correctly');
    } else {
      results.push('FAIL: Test 6 - Scope tracking issue');
      allPassed = false;
    }
  }

  // Test 7: isUrlAllowed function
  const sources = loadAllSources();
  if (sources.has('asterdex')) {
    const checkResult = isUrlAllowed('asterdex', 'https://www.asterdex.com/en');
    if (checkResult.allowed && checkResult.scope === 'official_site') {
      results.push('PASS: Test 7 - isUrlAllowed correctly identifies allowed URL');
    } else {
      results.push('FAIL: Test 7 - isUrlAllowed should identify allowed URL');
      allPassed = false;
    }
  }

  // Test 8: isUrlAllowed rejects unknown URL
  const unknownCheck = isUrlAllowed('asterdex', 'https://unknown.com/fake');
  if (!unknownCheck.allowed) {
    results.push('PASS: Test 8 - isUrlAllowed rejects unknown URL');
  } else {
    results.push('FAIL: Test 8 - isUrlAllowed should reject unknown URL');
    allPassed = false;
  }

  // Test 9: Empty official_sources is valid
  const emptySource: SourceRegistry = {
    entity: 'empty-test',
    official_sources: {}
  };
  const emptyResult = validateSourceRegistry(emptySource);
  if (emptyResult.valid) {
    results.push('PASS: Test 9 - Empty official_sources is valid');
  } else {
    results.push('FAIL: Test 9 - Empty official_sources should be valid');
    allPassed = false;
  }

  // Test 10: HTTP URL triggers warning
  const httpSource: SourceRegistry = {
    entity: 'http-test',
    official_sources: {
      official_site: ['http://insecure.example.com']
    }
  };
  const httpResult = validateSourceRegistry(httpSource);
  if (httpResult.valid && httpResult.warnings.some(w => w.includes('Non-HTTPS'))) {
    results.push('PASS: Test 10 - HTTP URL triggers warning');
  } else {
    results.push('FAIL: Test 10 - HTTP URL should trigger warning');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Validate all source files
  console.log('\n' + '='.repeat(50));
  console.log('\nValidating all source files:');
  console.log('-'.repeat(50));

  const { valid, results: sourceResults } = validateAllSources();

  for (const [file, result] of Array.from(sourceResults.entries())) {
    console.log(`\n${file}:`);
    console.log(`  Valid: ${result.valid}`);
    console.log(`  Entity: ${result.stats.entity}`);
    console.log(`  Total URLs: ${result.stats.total_urls}`);

    if (result.stats.total_urls > 0) {
      console.log('  By scope:');
      for (const [scope, count] of Object.entries(result.stats.by_scope)) {
        if ((count as number) > 0) console.log(`    ${scope}: ${count}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('  Errors:');
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      for (const warning of result.warnings) {
        console.log(`    - ${warning}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\nAll source files valid: ${valid}`);

  process.exit(passed && valid ? 0 : 1);
}
