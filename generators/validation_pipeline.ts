/**
 * Validation & CI Integration Pipeline
 *
 * Unified validation pipeline - CI is the only gatekeeper:
 * 1. Registry validation
 * 2. Manifest validation
 * 3. Generator validation
 * 4. CR validation (if applicable)
 * 5. Content lint
 * 6. Affiliate constraints
 *
 * Reference: plan3.md Step 11
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

export type ValidationStage =
  | 'registry'
  | 'manifest'
  | 'generator'
  | 'cr_gate'
  | 'content_lint'
  | 'affiliate';

export interface StageResult {
  stage: ValidationStage;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration_ms: number;
}

export interface PipelineResult {
  valid: boolean;
  stages: StageResult[];
  summary: {
    total_stages: number;
    passed_stages: number;
    failed_stages: number;
    total_errors: number;
    total_warnings: number;
    total_duration_ms: number;
  };
  publish_allowed: boolean;
}

export interface PageValidationInput {
  registry_id: string;
  page_type: 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';
  content: string;
  cr_required: boolean;
  generator_type?: string;
}

export interface RegistryEntry {
  id: string;
  type: string;
  page_status: string;
  cr_required: boolean;
  parent_id?: string;
  entities?: string[];
  source_scope?: string[];
}

export interface Registry {
  version: string;
  entries: RegistryEntry[];
}

export interface Manifest {
  generated_at: string;
  registry_version: string;
  total_tasks: number;
  tasks: Array<{
    registry_id: string;
    page_type: string;
    generator_type: string;
    source_scope: string[];
    priority: number;
    cr_required: boolean;
  }>;
}

// =============================================================================
// Validator Imports (inline implementations for self-contained module)
// =============================================================================

/**
 * CR Gate validation
 */
function validateCRGate(content: string, pageType: string, crRequired: boolean): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Detect CR blocks
  const crPattern = /```cr[\s\S]*?```/g;
  const hasCR = crPattern.test(content);

  const crRequiredTypes = ['entity', 'child_entity'];
  const crForbiddenTypes = ['education', 'comparison', 'interface', 'metrics'];

  // Check cr_required consistency
  if (crRequiredTypes.includes(pageType) && !crRequired) {
    errors.push(`CR_REQUIRED_MISMATCH: ${pageType} requires cr_required=true`);
  }
  if (crForbiddenTypes.includes(pageType) && crRequired) {
    errors.push(`CR_FORBIDDEN_MISMATCH: ${pageType} must have cr_required=false`);
  }

  // Check CR presence
  if (crRequired && !hasCR) {
    errors.push(`MISSING_CR: Content requires CR block but none found`);
  }
  if (!crRequired && hasCR) {
    errors.push(`FORBIDDEN_CR: Content has CR block but cr_required=false`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Content lint validation
 */
function validateContentLint(content: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Remove code blocks for linting
  const cleanContent = content.replace(/```[\s\S]*?```/g, '');

  // Forbidden patterns (errors)
  const errorPatterns: Array<[RegExp, string]> = [
    [/\b(best|worst|top|leading|excellent|amazing)\b/gi, 'Evaluative language'],
    [/\b(you should|we recommend|consider using)\b/gi, 'Advice language'],
    [/\b(sign up|register now|click here|get started)\b/gi, 'Call to action'],
    [/\b(revolutionary|groundbreaking|innovative)\b/gi, 'Marketing buzzword'],
    [/\b(i think|i believe|in my opinion)\b/gi, 'Subjective language'],
  ];

  for (const [pattern, message] of errorPatterns) {
    const match = cleanContent.match(pattern);
    if (match) {
      errors.push(`LINT_ERROR: ${message} detected: "${match[0]}"`);
    }
  }

  // Warning patterns
  const warningPatterns: Array<[RegExp, string]> = [
    [/\b(probably|likely|seems|appears)\b/gi, 'Hedging language'],
    [/!{2,}/g, 'Excessive punctuation'],
  ];

  for (const [pattern, message] of warningPatterns) {
    const match = cleanContent.match(pattern);
    if (match) {
      warnings.push(`LINT_WARNING: ${message} detected: "${match[0]}"`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Affiliate constraint validation
 */
function validateAffiliateConstraints(content: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract affiliate links (no 'g' flag - we only test, not match all)
  const affiliatePatterns = [
    /[?&](ref|referral|affiliate|aff|partner)=[^&\s)]+/i,
    /\/(ref|referral|affiliate)\//i,
    /bit\.ly|tinyurl/i,
  ];

  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  const affiliateLinks: string[] = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    for (const pattern of affiliatePatterns) {
      if (pattern.test(url)) {
        affiliateLinks.push(url);
        break;
      }
    }
  }

  // Max 1 affiliate link
  if (affiliateLinks.length > 1) {
    errors.push(`AFFILIATE_LIMIT: Found ${affiliateLinks.length} affiliate links, max 1 allowed`);
  }

  // Check if inside CR block
  const crBlocks = content.match(/```cr[\s\S]*?```/g) || [];
  for (const crBlock of crBlocks) {
    for (const affLink of affiliateLinks) {
      if (crBlock.includes(affLink)) {
        errors.push(`AFFILIATE_IN_CR: Affiliate link found inside CR block`);
      }
    }
  }

  // Missing disclosure warning
  if (affiliateLinks.length > 0) {
    const hasDisclosure = /affiliate\s*(link|disclosure)|referral\s*link/i.test(content);
    if (!hasDisclosure) {
      warnings.push(`AFFILIATE_DISCLOSURE: Affiliate link present without disclosure`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Registry validation
 */
function validateRegistry(registry: Registry): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!registry.version) {
    errors.push('REGISTRY_VERSION: Missing version field');
  }

  if (!Array.isArray(registry.entries)) {
    errors.push('REGISTRY_ENTRIES: entries must be an array');
    return { valid: false, errors };
  }

  const seenIds = new Set<string>();
  const validTypes = ['entity', 'child_entity', 'education', 'comparison', 'interface', 'metrics'];
  const validStatuses = ['missing', 'published', 'deprecated', 'duplicate'];

  for (const entry of registry.entries) {
    // ID validation
    if (!entry.id) {
      errors.push('REGISTRY_ID: Entry missing id');
      continue;
    }

    if (seenIds.has(entry.id)) {
      errors.push(`REGISTRY_DUPLICATE: Duplicate id "${entry.id}"`);
    }
    seenIds.add(entry.id);

    if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) {
      errors.push(`REGISTRY_ID_FORMAT: Invalid id format "${entry.id}"`);
    }

    // Type validation
    if (!validTypes.includes(entry.type)) {
      errors.push(`REGISTRY_TYPE: Invalid type "${entry.type}" for "${entry.id}"`);
    }

    // Status validation
    if (!validStatuses.includes(entry.page_status)) {
      errors.push(`REGISTRY_STATUS: Invalid status "${entry.page_status}" for "${entry.id}"`);
    }

    // CR required validation
    const crRequiredTypes = ['entity', 'child_entity'];
    if (crRequiredTypes.includes(entry.type) && !entry.cr_required) {
      errors.push(`REGISTRY_CR: "${entry.id}" type "${entry.type}" must have cr_required=true`);
    }
    if (!crRequiredTypes.includes(entry.type) && entry.cr_required) {
      errors.push(`REGISTRY_CR: "${entry.id}" type "${entry.type}" must have cr_required=false`);
    }

    // Hierarchy validation
    if (entry.type === 'child_entity' && !entry.parent_id) {
      errors.push(`REGISTRY_HIERARCHY: child_entity "${entry.id}" missing parent_id`);
    }
    if (entry.type === 'entity' && entry.parent_id) {
      errors.push(`REGISTRY_HIERARCHY: entity "${entry.id}" should not have parent_id`);
    }

    // Comparison validation
    if (entry.type === 'comparison') {
      if (!entry.entities || entry.entities.length < 2) {
        errors.push(`REGISTRY_COMPARISON: comparison "${entry.id}" needs at least 2 entities`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Manifest validation
 */
function validateManifest(manifest: Manifest, registry: Registry): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.generated_at) {
    errors.push('MANIFEST_TIMESTAMP: Missing generated_at');
  }

  if (!Array.isArray(manifest.tasks)) {
    errors.push('MANIFEST_TASKS: tasks must be an array');
    return { valid: false, errors };
  }

  if (manifest.total_tasks !== manifest.tasks.length) {
    errors.push(`MANIFEST_COUNT: total_tasks (${manifest.total_tasks}) != tasks.length (${manifest.tasks.length})`);
  }

  const registryIds = new Set(registry.entries.map(e => e.id));
  const validGenerators = [
    'entity_generator', 'child_entity_generator', 'education_generator',
    'comparison_generator', 'interface_generator', 'metrics_generator'
  ];

  for (const task of manifest.tasks) {
    // Check registry reference
    if (!registryIds.has(task.registry_id)) {
      errors.push(`MANIFEST_REF: Task references unknown registry_id "${task.registry_id}"`);
    }

    // Check generator type
    if (!validGenerators.includes(task.generator_type)) {
      errors.push(`MANIFEST_GENERATOR: Invalid generator "${task.generator_type}"`);
    }

    // Check priority
    if (task.priority < 1 || task.priority > 10) {
      errors.push(`MANIFEST_PRIORITY: Priority must be 1-10, got ${task.priority}`);
    }

    // Verify only missing status in manifest
    const registryEntry = registry.entries.find(e => e.id === task.registry_id);
    if (registryEntry && registryEntry.page_status !== 'missing') {
      errors.push(`MANIFEST_STATUS: Task "${task.registry_id}" has status "${registryEntry.page_status}", expected "missing"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generator type validation
 */
function validateGeneratorType(pageType: string, generatorType: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const expectedGenerator: Record<string, string> = {
    'entity': 'entity_generator',
    'child_entity': 'child_entity_generator',
    'education': 'education_generator',
    'comparison': 'comparison_generator',
    'interface': 'interface_generator',
    'metrics': 'metrics_generator'
  };

  if (expectedGenerator[pageType] !== generatorType) {
    errors.push(`GENERATOR_MISMATCH: Page type "${pageType}" requires "${expectedGenerator[pageType]}", got "${generatorType}"`);
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// Pipeline Implementation
// =============================================================================

/**
 * Run a single validation stage with timing
 */
function runStage(
  stage: ValidationStage,
  fn: () => { valid: boolean; errors: string[]; warnings?: string[] }
): StageResult {
  const start = Date.now();

  try {
    const result = fn();
    return {
      stage,
      passed: result.valid,
      errors: result.errors,
      warnings: result.warnings || [],
      duration_ms: Date.now() - start
    };
  } catch (error) {
    return {
      stage,
      passed: false,
      errors: [`STAGE_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      duration_ms: Date.now() - start
    };
  }
}

/**
 * Validate a single generated page
 */
export function validatePage(input: PageValidationInput): PipelineResult {
  const stages: StageResult[] = [];

  // Stage 1: Generator type validation (if provided)
  if (input.generator_type) {
    stages.push(runStage('generator', () =>
      validateGeneratorType(input.page_type, input.generator_type!)
    ));
  }

  // Stage 2: CR Gate validation
  stages.push(runStage('cr_gate', () =>
    validateCRGate(input.content, input.page_type, input.cr_required)
  ));

  // Stage 3: Content lint
  stages.push(runStage('content_lint', () =>
    validateContentLint(input.content)
  ));

  // Stage 4: Affiliate constraints
  stages.push(runStage('affiliate', () =>
    validateAffiliateConstraints(input.content)
  ));

  // Calculate summary
  const passedStages = stages.filter(s => s.passed).length;
  const failedStages = stages.filter(s => !s.passed).length;
  const totalErrors = stages.reduce((sum, s) => sum + s.errors.length, 0);
  const totalWarnings = stages.reduce((sum, s) => sum + s.warnings.length, 0);
  const totalDuration = stages.reduce((sum, s) => sum + s.duration_ms, 0);

  return {
    valid: failedStages === 0,
    stages,
    summary: {
      total_stages: stages.length,
      passed_stages: passedStages,
      failed_stages: failedStages,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      total_duration_ms: totalDuration
    },
    publish_allowed: failedStages === 0
  };
}

/**
 * Validate full pipeline: registry + manifest + pages
 */
export function validateFullPipeline(
  registry: Registry,
  manifest: Manifest,
  pages?: Map<string, { content: string; page_type: string; cr_required: boolean }>
): PipelineResult {
  const stages: StageResult[] = [];

  // Stage 1: Registry validation
  stages.push(runStage('registry', () => validateRegistry(registry)));

  // Stage 2: Manifest validation
  stages.push(runStage('manifest', () => validateManifest(manifest, registry)));

  // Stage 3+: Page validations (if provided)
  if (pages) {
    for (const [registryId, page] of Array.from(pages.entries())) {
      const task = manifest.tasks.find(t => t.registry_id === registryId);
      if (task) {
        // Generator validation
        stages.push(runStage('generator', () =>
          validateGeneratorType(page.page_type, task.generator_type)
        ));

        // CR Gate
        stages.push(runStage('cr_gate', () =>
          validateCRGate(page.content, page.page_type, page.cr_required)
        ));

        // Content lint
        stages.push(runStage('content_lint', () =>
          validateContentLint(page.content)
        ));

        // Affiliate
        stages.push(runStage('affiliate', () =>
          validateAffiliateConstraints(page.content)
        ));
      }
    }
  }

  // Calculate summary
  const passedStages = stages.filter(s => s.passed).length;
  const failedStages = stages.filter(s => !s.passed).length;
  const totalErrors = stages.reduce((sum, s) => sum + s.errors.length, 0);
  const totalWarnings = stages.reduce((sum, s) => sum + s.warnings.length, 0);
  const totalDuration = stages.reduce((sum, s) => sum + s.duration_ms, 0);

  return {
    valid: failedStages === 0,
    stages,
    summary: {
      total_stages: stages.length,
      passed_stages: passedStages,
      failed_stages: failedStages,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      total_duration_ms: totalDuration
    },
    publish_allowed: failedStages === 0
  };
}

/**
 * Format pipeline result for CI output
 */
export function formatPipelineReport(result: PipelineResult): string {
  const lines: string[] = [];

  lines.push('=' .repeat(60));
  lines.push('  VALIDATION PIPELINE REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  if (result.valid) {
    lines.push('Status: PASSED');
    lines.push('Publish: ALLOWED');
  } else {
    lines.push('Status: FAILED');
    lines.push('Publish: BLOCKED');
  }

  lines.push('');
  lines.push(`Stages: ${result.summary.passed_stages}/${result.summary.total_stages} passed`);
  lines.push(`Errors: ${result.summary.total_errors}`);
  lines.push(`Warnings: ${result.summary.total_warnings}`);
  lines.push(`Duration: ${result.summary.total_duration_ms}ms`);
  lines.push('');

  // Stage details
  lines.push('-'.repeat(60));
  lines.push('Stage Details:');
  lines.push('-'.repeat(60));

  for (const stage of result.stages) {
    const status = stage.passed ? 'PASS' : 'FAIL';
    lines.push(`[${status}] ${stage.stage} (${stage.duration_ms}ms)`);

    for (const error of stage.errors) {
      lines.push(`  ERROR: ${error}`);
    }
    for (const warning of stage.warnings) {
      lines.push(`  WARN: ${warning}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * CI entry point - exits with code 1 on failure
 */
export function runCIValidation(registryPath: string, manifestPath: string): void {
  console.log('Running CI Validation Pipeline...\n');

  // Load registry
  let registry: Registry;
  try {
    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    registry = JSON.parse(registryContent);
  } catch (error) {
    console.error(`Failed to load registry: ${error}`);
    process.exit(1);
  }

  // Load manifest (optional)
  let manifest: Manifest;
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  } catch {
    // Create empty manifest if not exists
    manifest = {
      generated_at: new Date().toISOString(),
      registry_version: registry.version,
      total_tasks: 0,
      tasks: []
    };
  }

  // Run validation
  const result = validateFullPipeline(registry, manifest);

  // Output report
  console.log(formatPipelineReport(result));

  // Exit with appropriate code
  if (!result.valid) {
    process.exit(1);
  }
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('Validation Pipeline - Acceptance Tests\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean): void {
    try {
      if (fn()) {
        console.log(`PASS: ${name}`);
        passed++;
      } else {
        console.log(`FAIL: ${name}`);
        failed++;
      }
    } catch (e) {
      console.log(`FAIL: ${name} - ${e}`);
      failed++;
    }
  }

  // Sample valid content
  const validContent = `\`\`\`cr
{"schema": "CR1.0", "type": "exchange"}
\`\`\`

# Exchange Overview

| Feature | Value |
|---------|-------|
| Fees | 0.1% |

The platform supports spot trading.`;

  const invalidContent = `This is the best exchange you should try!
Sign up now for exclusive bonuses!`;

  // Sample registry
  const validRegistry: Registry = {
    version: '1.0',
    entries: [
      { id: 'test-exchange', type: 'entity', page_status: 'missing', cr_required: true },
      { id: 'test-guide', type: 'education', page_status: 'missing', cr_required: false }
    ]
  };

  // Sample manifest
  const validManifest: Manifest = {
    generated_at: new Date().toISOString(),
    registry_version: '1.0',
    total_tasks: 1,
    tasks: [{
      registry_id: 'test-exchange',
      page_type: 'entity',
      generator_type: 'entity_generator',
      source_scope: ['official_site'],
      priority: 10,
      cr_required: true
    }]
  };

  // Test 1: Valid entity page passes
  test('Test 1 - Valid entity page passes', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true,
      generator_type: 'entity_generator'
    });
    return result.valid === true;
  });

  // Test 2: Invalid content fails lint
  test('Test 2 - Invalid content fails lint', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'education',
      content: invalidContent,
      cr_required: false
    });
    return result.valid === false;
  });

  // Test 3: Missing CR fails for entity
  test('Test 3 - Missing CR fails for entity', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: '# No CR here',
      cr_required: true
    });
    return result.valid === false && result.stages.some(s => s.stage === 'cr_gate' && !s.passed);
  });

  // Test 4: CR in education fails
  test('Test 4 - CR in education fails', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'education',
      content: validContent,
      cr_required: false
    });
    return result.valid === false;
  });

  // Test 5: Generator mismatch detected
  test('Test 5 - Generator mismatch detected', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true,
      generator_type: 'education_generator'
    });
    return result.valid === false && result.stages.some(s => s.stage === 'generator' && !s.passed);
  });

  // Test 6: Valid registry passes
  test('Test 6 - Valid registry passes', () => {
    const result = validateFullPipeline(validRegistry, validManifest);
    return result.stages.some(s => s.stage === 'registry' && s.passed);
  });

  // Test 7: Duplicate ID fails registry
  test('Test 7 - Duplicate ID fails registry', () => {
    const badRegistry: Registry = {
      version: '1.0',
      entries: [
        { id: 'dupe', type: 'entity', page_status: 'missing', cr_required: true },
        { id: 'dupe', type: 'entity', page_status: 'missing', cr_required: true }
      ]
    };
    const result = validateFullPipeline(badRegistry, validManifest);
    return result.stages.some(s => s.stage === 'registry' && !s.passed);
  });

  // Test 8: Valid manifest passes
  test('Test 8 - Valid manifest passes', () => {
    const result = validateFullPipeline(validRegistry, validManifest);
    return result.stages.some(s => s.stage === 'manifest' && s.passed);
  });

  // Test 9: Manifest with unknown registry_id fails
  test('Test 9 - Unknown registry_id fails', () => {
    const badManifest: Manifest = {
      ...validManifest,
      tasks: [{ ...validManifest.tasks[0], registry_id: 'nonexistent' }]
    };
    const result = validateFullPipeline(validRegistry, badManifest);
    return result.stages.some(s => s.stage === 'manifest' && !s.passed);
  });

  // Test 10: publish_allowed reflects validation
  test('Test 10 - publish_allowed reflects validation', () => {
    const goodResult = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true
    });
    const badResult = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: invalidContent,
      cr_required: true
    });
    return goodResult.publish_allowed === true && badResult.publish_allowed === false;
  });

  // Test 11: Summary counts errors correctly
  test('Test 11 - Summary counts errors', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: invalidContent,
      cr_required: true
    });
    return result.summary.total_errors > 0;
  });

  // Test 12: Duration tracked
  test('Test 12 - Duration tracked', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true
    });
    return result.summary.total_duration_ms >= 0;
  });

  // Test 13: Affiliate validation runs
  test('Test 13 - Affiliate validation included', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true
    });
    return result.stages.some(s => s.stage === 'affiliate');
  });

  // Test 14: Multiple affiliates fail
  test('Test 14 - Multiple affiliates fail', () => {
    const content = `[L1](https://x.com?ref=a) [L2](https://y.com?ref=b)`;
    const result = validatePage({
      registry_id: 'test',
      page_type: 'education',
      content,
      cr_required: false
    });
    return result.stages.some(s => s.stage === 'affiliate' && !s.passed);
  });

  // Test 15: Report format includes status
  test('Test 15 - Report format includes status', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: validContent,
      cr_required: true
    });
    const report = formatPipelineReport(result);
    return report.includes('PASSED') && report.includes('ALLOWED');
  });

  // Test 16: Failed report shows BLOCKED
  test('Test 16 - Failed report shows BLOCKED', () => {
    const result = validatePage({
      registry_id: 'test',
      page_type: 'entity',
      content: invalidContent,
      cr_required: true
    });
    const report = formatPipelineReport(result);
    return report.includes('FAILED') && report.includes('BLOCKED');
  });

  // Test 17: Child entity without parent fails
  test('Test 17 - Child entity needs parent', () => {
    const badRegistry: Registry = {
      version: '1.0',
      entries: [
        { id: 'orphan', type: 'child_entity', page_status: 'missing', cr_required: true }
      ]
    };
    const result = validateFullPipeline(badRegistry, { ...validManifest, tasks: [] });
    return result.stages.some(s => s.stage === 'registry' && !s.passed);
  });

  // Test 18: Education with CR fails
  test('Test 18 - Education CR mismatch fails', () => {
    const badRegistry: Registry = {
      version: '1.0',
      entries: [
        { id: 'edu', type: 'education', page_status: 'missing', cr_required: true }
      ]
    };
    const result = validateFullPipeline(badRegistry, { ...validManifest, tasks: [] });
    return result.stages.some(s => s.stage === 'registry' && !s.passed);
  });

  // Test 19: Manifest task count mismatch detected
  test('Test 19 - Task count mismatch detected', () => {
    const badManifest: Manifest = {
      ...validManifest,
      total_tasks: 5  // Wrong count
    };
    const result = validateFullPipeline(validRegistry, badManifest);
    return result.stages.some(s => s.stage === 'manifest' && !s.passed);
  });

  // Test 20: Full pipeline with pages validates all
  test('Test 20 - Full pipeline validates pages', () => {
    const pages = new Map([
      ['test-exchange', { content: validContent, page_type: 'entity', cr_required: true }]
    ]);
    const result = validateFullPipeline(validRegistry, validManifest, pages);
    return result.stages.length > 2;  // Has more than just registry + manifest
  });

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed === 20 ? 'ALL TESTS PASSED' : `${failed} FAILED`}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests or CI validation based on arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--ci') && args.length >= 3) {
    const registryPath = args[args.indexOf('--ci') + 1];
    const manifestPath = args[args.indexOf('--ci') + 2];
    runCIValidation(registryPath, manifestPath);
  } else {
    runAcceptanceTests();
  }
}
