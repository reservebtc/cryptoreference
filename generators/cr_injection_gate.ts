/**
 * CR Injection Gate
 *
 * Ensures CR-Markup appears only where allowed:
 * - CR required: entity, child_entity
 * - CR forbidden: education, comparison, interface, metrics
 *
 * Reference: plan3.md Step 8
 */

// =============================================================================
// Types
// =============================================================================

export type PageType = 'entity' | 'child_entity' | 'education' | 'comparison' | 'interface' | 'metrics';

export interface CRGateInput {
  registry_id: string;
  page_type: PageType;
  content: string;
  cr_required: boolean;
}

export interface CRGateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  has_cr_block: boolean;
  cr_block_count: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Page types that REQUIRE CR-Markup
 */
export const CR_REQUIRED_TYPES: PageType[] = ['entity', 'child_entity'];

/**
 * Page types where CR-Markup is FORBIDDEN
 */
export const CR_FORBIDDEN_TYPES: PageType[] = ['education', 'comparison', 'interface', 'metrics'];

/**
 * CR block detection patterns
 * These patterns detect top-level CR blocks (not nested matches within blocks)
 */
const CR_BLOCK_PATTERNS = {
  // Standard CR block: ```cr ... ```
  fenced: /```cr[\s\S]*?```/g,

  // HTML comment style: <!-- CR: ... -->
  comment: /<!--\s*CR:[\s\S]*?-->/g,

  // JSON-LD style with CR type
  jsonld: /<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"CR[^"]*"[\s\S]*?<\/script>/gi,

  // Inline CR token (standalone, not inside fenced blocks)
  token: /\[CR:[^\]]+\]/g
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Detect CR blocks in content
 */
export function detectCRBlocks(content: string): { count: number; matches: string[] } {
  const matches: string[] = [];

  for (const [_name, pattern] of Object.entries(CR_BLOCK_PATTERNS)) {
    const found = content.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  return {
    count: matches.length,
    matches
  };
}

/**
 * Check if page type requires CR
 */
export function requiresCR(pageType: PageType): boolean {
  return CR_REQUIRED_TYPES.includes(pageType);
}

/**
 * Check if page type forbids CR
 */
export function forbidsCR(pageType: PageType): boolean {
  return CR_FORBIDDEN_TYPES.includes(pageType);
}

/**
 * Validate CR presence/absence in content
 */
export function validateCRGate(input: CRGateInput): CRGateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Detect CR blocks
  const detection = detectCRBlocks(input.content);
  const hasCR = detection.count > 0;

  // Validate cr_required flag consistency with page type
  const shouldRequireCR = requiresCR(input.page_type);
  const shouldForbidCR = forbidsCR(input.page_type);

  // Check cr_required flag matches page type semantics
  if (shouldRequireCR && !input.cr_required) {
    errors.push(
      `CR_REQUIRED_MISMATCH: Page type '${input.page_type}' requires CR but cr_required=false`
    );
  }

  if (shouldForbidCR && input.cr_required) {
    errors.push(
      `CR_FORBIDDEN_MISMATCH: Page type '${input.page_type}' forbids CR but cr_required=true`
    );
  }

  // Validate CR presence in content
  if (input.cr_required && !hasCR) {
    errors.push(
      `MISSING_REQUIRED_CR: Page '${input.registry_id}' requires CR-Markup but none found`
    );
  }

  if (!input.cr_required && hasCR) {
    errors.push(
      `FORBIDDEN_CR_PRESENT: Page '${input.registry_id}' forbids CR-Markup but ${detection.count} block(s) found`
    );
  }

  // Check for multiple CR blocks (warning only)
  if (hasCR && detection.count > 1) {
    warnings.push(
      `MULTIPLE_CR_BLOCKS: Found ${detection.count} CR blocks, expected at most 1`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    has_cr_block: hasCR,
    cr_block_count: detection.count
  };
}

/**
 * Inject CR block into content if required
 * Returns modified content with CR block at the beginning
 */
export function injectCRBlock(
  content: string,
  crBlock: string,
  pageType: PageType
): { success: boolean; content: string; error?: string } {
  // Check if CR is forbidden for this page type
  if (forbidsCR(pageType)) {
    return {
      success: false,
      content,
      error: `Cannot inject CR into '${pageType}' page - CR is forbidden`
    };
  }

  // Check if CR already exists
  const existing = detectCRBlocks(content);
  if (existing.count > 0) {
    return {
      success: false,
      content,
      error: `Content already contains ${existing.count} CR block(s)`
    };
  }

  // Inject CR block at the beginning
  const injectedContent = `${crBlock}\n\n${content}`;

  return {
    success: true,
    content: injectedContent
  };
}

/**
 * Remove CR blocks from content
 * Used for cleaning forbidden CR from education/comparison pages
 */
export function removeCRBlocks(content: string): { content: string; removed: number } {
  let cleanContent = content;
  let totalRemoved = 0;

  for (const [_name, pattern] of Object.entries(CR_BLOCK_PATTERNS)) {
    const matches = cleanContent.match(pattern);
    if (matches) {
      totalRemoved += matches.length;
      cleanContent = cleanContent.replace(pattern, '');
    }
  }

  // Clean up extra newlines left by removal
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

  return {
    content: cleanContent,
    removed: totalRemoved
  };
}

/**
 * Gate function: validates and optionally transforms content
 * Main entry point for CR injection gate
 */
export function gateCRContent(
  input: CRGateInput,
  options: { autoRemoveForbidden?: boolean } = {}
): CRGateResult & { transformed_content?: string } {
  let content = input.content;
  const warnings: string[] = [];

  // Auto-remove forbidden CR if option enabled
  if (options.autoRemoveForbidden && forbidsCR(input.page_type)) {
    const removal = removeCRBlocks(content);
    if (removal.removed > 0) {
      warnings.push(
        `AUTO_REMOVED: Removed ${removal.removed} forbidden CR block(s) from '${input.page_type}' page`
      );
      content = removal.content;
    }
  }

  // Validate
  const result = validateCRGate({ ...input, content });

  return {
    ...result,
    warnings: [...result.warnings, ...warnings],
    transformed_content: content !== input.content ? content : undefined
  };
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('CR Injection Gate - Acceptance Tests\n');
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

  // Sample CR block for testing
  const sampleCRBlock = '```cr\n{"schema": "CR1.0", "type": "exchange"}\n```';
  const contentWithCR = `${sampleCRBlock}\n\n# Page Title\nContent here.`;
  const contentWithoutCR = '# Page Title\nContent here.';

  // Test 1: Detect CR block in content
  test('Test 1 - Detect fenced CR block', () => {
    const result = detectCRBlocks(contentWithCR);
    return result.count === 1;
  });

  // Test 2: No CR detected in plain content
  test('Test 2 - No CR in plain content', () => {
    const result = detectCRBlocks(contentWithoutCR);
    return result.count === 0;
  });

  // Test 3: Entity requires CR
  test('Test 3 - Entity type requires CR', () => {
    return requiresCR('entity') === true;
  });

  // Test 4: Education forbids CR
  test('Test 4 - Education type forbids CR', () => {
    return forbidsCR('education') === true;
  });

  // Test 5: Missing required CR fails validation
  test('Test 5 - Missing required CR fails', () => {
    const result = validateCRGate({
      registry_id: 'test-entity',
      page_type: 'entity',
      content: contentWithoutCR,
      cr_required: true
    });
    return !result.valid && result.errors.some(e => e.includes('MISSING_REQUIRED_CR'));
  });

  // Test 6: Forbidden CR present fails validation
  test('Test 6 - Forbidden CR present fails', () => {
    const result = validateCRGate({
      registry_id: 'test-education',
      page_type: 'education',
      content: contentWithCR,
      cr_required: false
    });
    return !result.valid && result.errors.some(e => e.includes('FORBIDDEN_CR_PRESENT'));
  });

  // Test 7: Valid entity with CR passes
  test('Test 7 - Valid entity with CR passes', () => {
    const result = validateCRGate({
      registry_id: 'test-entity',
      page_type: 'entity',
      content: contentWithCR,
      cr_required: true
    });
    return result.valid === true;
  });

  // Test 8: Valid education without CR passes
  test('Test 8 - Valid education without CR passes', () => {
    const result = validateCRGate({
      registry_id: 'test-education',
      page_type: 'education',
      content: contentWithoutCR,
      cr_required: false
    });
    return result.valid === true;
  });

  // Test 9: CR required mismatch detected
  test('Test 9 - CR required mismatch detected', () => {
    const result = validateCRGate({
      registry_id: 'test-entity',
      page_type: 'entity',
      content: contentWithCR,
      cr_required: false  // Wrong!
    });
    return !result.valid && result.errors.some(e => e.includes('CR_REQUIRED_MISMATCH'));
  });

  // Test 10: CR forbidden mismatch detected
  test('Test 10 - CR forbidden mismatch detected', () => {
    const result = validateCRGate({
      registry_id: 'test-comparison',
      page_type: 'comparison',
      content: contentWithoutCR,
      cr_required: true  // Wrong!
    });
    return !result.valid && result.errors.some(e => e.includes('CR_FORBIDDEN_MISMATCH'));
  });

  // Test 11: Child entity requires CR
  test('Test 11 - Child entity requires CR', () => {
    return requiresCR('child_entity') === true;
  });

  // Test 12: Comparison forbids CR
  test('Test 12 - Comparison forbids CR', () => {
    return forbidsCR('comparison') === true;
  });

  // Test 13: Interface forbids CR
  test('Test 13 - Interface forbids CR', () => {
    return forbidsCR('interface') === true;
  });

  // Test 14: Metrics forbids CR
  test('Test 14 - Metrics forbids CR', () => {
    return forbidsCR('metrics') === true;
  });

  // Test 15: Multiple CR blocks warning
  test('Test 15 - Multiple CR blocks warning', () => {
    const doubleCR = `${sampleCRBlock}\n\n${sampleCRBlock}\n\nContent`;
    const result = validateCRGate({
      registry_id: 'test-entity',
      page_type: 'entity',
      content: doubleCR,
      cr_required: true
    });
    return result.warnings.some(w => w.includes('MULTIPLE_CR_BLOCKS'));
  });

  // Test 16: Inject CR block success
  test('Test 16 - Inject CR block success', () => {
    const result = injectCRBlock(contentWithoutCR, sampleCRBlock, 'entity');
    return result.success && result.content.includes(sampleCRBlock);
  });

  // Test 17: Inject CR into forbidden type fails
  test('Test 17 - Inject CR into forbidden type fails', () => {
    const result = injectCRBlock(contentWithoutCR, sampleCRBlock, 'education');
    return !result.success && result.error !== undefined;
  });

  // Test 18: Inject CR when already exists fails
  test('Test 18 - Inject CR when exists fails', () => {
    const result = injectCRBlock(contentWithCR, sampleCRBlock, 'entity');
    return !result.success && (result.error?.includes('already contains') === true);
  });

  // Test 19: Remove CR blocks works
  test('Test 19 - Remove CR blocks works', () => {
    const result = removeCRBlocks(contentWithCR);
    return result.removed === 1 && !result.content.includes('```cr');
  });

  // Test 20: Gate with auto-remove option
  test('Test 20 - Gate auto-removes forbidden CR', () => {
    const result = gateCRContent(
      {
        registry_id: 'test-education',
        page_type: 'education',
        content: contentWithCR,
        cr_required: false
      },
      { autoRemoveForbidden: true }
    );
    return result.valid && result.warnings.some(w => w.includes('AUTO_REMOVED'));
  });

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed === 20 ? 'ALL TESTS PASSED' : `${failed} FAILED`}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAcceptanceTests();
}
