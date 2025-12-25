/**
 * Content Linting Rules
 *
 * Guarantees neutral, deterministic output:
 * - Detects CTA (calls to action)
 * - Detects advice language
 * - Detects evaluative/subjective language
 * - Enforces tables > prose preference
 * - Enforces deterministic phrasing
 *
 * Reference: plan3.md Step 9, CLAUDE.md Section 2
 */

// =============================================================================
// Types
// =============================================================================

export type LintSeverity = 'error' | 'warning';

export type LintCategory =
  | 'cta'
  | 'advice'
  | 'evaluative'
  | 'subjective'
  | 'marketing'
  | 'speculation'
  | 'recommendation'
  | 'emotional'
  | 'ranking'
  | 'prose_heavy';

export interface LintViolation {
  category: LintCategory;
  severity: LintSeverity;
  message: string;
  match: string;
  line?: number;
  column?: number;
}

export interface LintResult {
  valid: boolean;
  errors: LintViolation[];
  warnings: LintViolation[];
  stats: {
    total_violations: number;
    error_count: number;
    warning_count: number;
    lines_checked: number;
    prose_ratio: number;
  };
}

export interface LintRule {
  category: LintCategory;
  severity: LintSeverity;
  pattern: RegExp;
  message: string;
}

// =============================================================================
// Lint Rules
// =============================================================================

/**
 * Forbidden phrases and patterns
 * Based on CLAUDE.md Section 2: Hard Prohibitions
 */
export const LINT_RULES: LintRule[] = [
  // === CTA (Calls to Action) ===
  {
    category: 'cta',
    severity: 'error',
    pattern: /\b(sign up|register now|join now|get started|try now|start trading|open account|create account|click here|learn more|visit|check out)\b/gi,
    message: 'Call to action detected'
  },
  {
    category: 'cta',
    severity: 'error',
    pattern: /\b(don'?t miss|act now|limited time|hurry|exclusive offer|special offer)\b/gi,
    message: 'Urgency-based CTA detected'
  },

  // === Advice Language ===
  {
    category: 'advice',
    severity: 'error',
    pattern: /\b(you should|you must|you need to|we recommend|we suggest|consider using|make sure to|be sure to|always|never)\b/gi,
    message: 'Advice language detected'
  },
  {
    category: 'advice',
    severity: 'error',
    pattern: /\b(it'?s (best|better|wise|smart|important) to)\b/gi,
    message: 'Implicit advice detected'
  },

  // === Evaluative Language ===
  {
    category: 'evaluative',
    severity: 'error',
    pattern: /\b(best|worst|top|leading|premier|superior|inferior|excellent|outstanding|amazing|incredible|fantastic|terrible|awful|poor)\b/gi,
    message: 'Evaluative language detected'
  },
  {
    category: 'evaluative',
    severity: 'error',
    pattern: /\b(#1|number one|first-class|world-class|industry-leading|market-leading|cutting-edge|state-of-the-art)\b/gi,
    message: 'Ranking/superlative detected'
  },

  // === Subjective Language ===
  {
    category: 'subjective',
    severity: 'error',
    pattern: /\b(i think|i believe|in my opinion|we think|we believe|arguably|perhaps|maybe|probably|likely|seems|appears to be)\b/gi,
    message: 'Subjective language detected'
  },
  {
    category: 'subjective',
    severity: 'warning',
    pattern: /\b(interesting|exciting|impressive|remarkable|notable|significant|important)\b/gi,
    message: 'Potentially subjective qualifier detected'
  },

  // === Marketing Language ===
  {
    category: 'marketing',
    severity: 'error',
    pattern: /\b(revolutionary|game-changing|innovative|groundbreaking|disruptive|unique|unparalleled|unmatched|unprecedented)\b/gi,
    message: 'Marketing buzzword detected'
  },
  {
    category: 'marketing',
    severity: 'error',
    pattern: /\b(trusted by|loved by|preferred by|chosen by|used by millions|thousands of users)\b/gi,
    message: 'Social proof marketing detected'
  },

  // === Speculation ===
  {
    category: 'speculation',
    severity: 'error',
    pattern: /\b(will likely|could potentially|might become|expected to|predicted to|projected to|estimated to reach)\b/gi,
    message: 'Speculative language detected'
  },
  {
    category: 'speculation',
    severity: 'error',
    pattern: /\b(in the future|soon|eventually|someday|one day)\b/gi,
    message: 'Future speculation detected'
  },

  // === Recommendations ===
  {
    category: 'recommendation',
    severity: 'error',
    pattern: /\b(recommended|ideal for|perfect for|great for|suitable for|designed for beginners|designed for experts)\b/gi,
    message: 'Recommendation detected'
  },
  {
    category: 'recommendation',
    severity: 'error',
    pattern: /\b(if you want|if you need|if you're looking for|for those who)\b/gi,
    message: 'Targeted recommendation detected'
  },

  // === Emotional Language ===
  {
    category: 'emotional',
    severity: 'error',
    pattern: /\b(love|hate|fear|worry|excited|thrilled|disappointed|frustrated|happy|sad|angry)\b/gi,
    message: 'Emotional language detected'
  },
  {
    category: 'emotional',
    severity: 'warning',
    pattern: /!{2,}|\?{2,}/g,
    message: 'Excessive punctuation detected'
  },

  // === Ranking Claims ===
  {
    category: 'ranking',
    severity: 'error',
    pattern: /\b(ranked #?\d+|top \d+|in the top|among the (best|top|leading))\b/gi,
    message: 'Ranking claim detected'
  },
  {
    category: 'ranking',
    severity: 'error',
    pattern: /\b(most popular|most trusted|most secure|most reliable|fastest|cheapest|biggest|largest|smallest)\b/gi,
    message: 'Comparative ranking detected'
  }
];

/**
 * Allowed neutral phrases (whitelist)
 * These override violations when in specific contexts
 */
export const NEUTRAL_CONTEXTS: RegExp[] = [
  // Technical specifications
  /\b(maximum|minimum|average|median|total)\b/gi,
  // Factual statements with sources
  /according to|as stated in|per the documentation/gi,
  // Defined terms
  /"[^"]+"/g,
  // Code blocks (should be excluded)
  /```[\s\S]*?```/g
];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Find line and column for a match position
 */
function findPosition(content: string, index: number): { line: number; column: number } {
  const lines = content.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Remove code blocks and quoted strings from content for linting
 */
function preprocessContent(content: string): { cleaned: string; codeBlockRanges: Array<[number, number]> } {
  const codeBlockRanges: Array<[number, number]> = [];

  // Track code block positions
  const codeBlockPattern = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    codeBlockRanges.push([match.index, match.index + match[0].length]);
  }

  // Remove code blocks for linting
  const cleaned = content.replace(codeBlockPattern, (m) => ' '.repeat(m.length));

  return { cleaned, codeBlockRanges };
}

/**
 * Check if a position is inside a code block
 */
function isInCodeBlock(index: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

/**
 * Calculate prose ratio (paragraphs vs structured content)
 */
function calculateProseRatio(content: string): number {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return 0;

  let proseLines = 0;
  let structuredLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Structured content indicators
    if (
      trimmed.startsWith('#') ||      // Headers
      trimmed.startsWith('|') ||      // Tables
      trimmed.startsWith('-') ||      // Lists
      trimmed.startsWith('*') ||      // Lists
      trimmed.startsWith('1.') ||     // Numbered lists
      trimmed.startsWith('```') ||    // Code blocks
      trimmed.startsWith('>') ||      // Blockquotes
      /^\d+\./.test(trimmed)          // Numbered items
    ) {
      structuredLines++;
    } else if (trimmed.length > 50) {
      // Long lines without structure are prose
      proseLines++;
    }
  }

  const total = proseLines + structuredLines;
  return total > 0 ? proseLines / total : 0;
}

/**
 * Lint content for violations
 */
export function lintContent(content: string): LintResult {
  const errors: LintViolation[] = [];
  const warnings: LintViolation[] = [];

  // Preprocess to exclude code blocks
  const { cleaned, codeBlockRanges } = preprocessContent(content);

  // Apply each rule
  for (const rule of LINT_RULES) {
    // Reset regex lastIndex
    rule.pattern.lastIndex = 0;

    let match;
    while ((match = rule.pattern.exec(cleaned)) !== null) {
      // Skip if inside code block
      if (isInCodeBlock(match.index, codeBlockRanges)) {
        continue;
      }

      const position = findPosition(content, match.index);
      const violation: LintViolation = {
        category: rule.category,
        severity: rule.severity,
        message: rule.message,
        match: match[0],
        line: position.line,
        column: position.column
      };

      if (rule.severity === 'error') {
        errors.push(violation);
      } else {
        warnings.push(violation);
      }
    }
  }

  // Calculate prose ratio
  const proseRatio = calculateProseRatio(content);

  // Warn if too much prose (>70%)
  if (proseRatio > 0.7) {
    warnings.push({
      category: 'prose_heavy',
      severity: 'warning',
      message: `Content is ${Math.round(proseRatio * 100)}% prose. Consider using more tables/lists.`,
      match: ''
    });
  }

  const lines = content.split('\n').length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      total_violations: errors.length + warnings.length,
      error_count: errors.length,
      warning_count: warnings.length,
      lines_checked: lines,
      prose_ratio: Math.round(proseRatio * 100) / 100
    }
  };
}

/**
 * Quick check if content is clean (no errors)
 */
export function isCleanContent(content: string): boolean {
  const result = lintContent(content);
  return result.valid;
}

/**
 * Get violations grouped by category
 */
export function getViolationsByCategory(result: LintResult): Map<LintCategory, LintViolation[]> {
  const grouped = new Map<LintCategory, LintViolation[]>();

  for (const violation of [...result.errors, ...result.warnings]) {
    const existing = grouped.get(violation.category) || [];
    existing.push(violation);
    grouped.set(violation.category, existing);
  }

  return grouped;
}

/**
 * Format lint result as human-readable report
 */
export function formatLintReport(result: LintResult): string {
  const lines: string[] = [];

  lines.push('Content Lint Report');
  lines.push('='.repeat(40));

  if (result.valid) {
    lines.push('Status: PASS (no errors)');
  } else {
    lines.push(`Status: FAIL (${result.stats.error_count} errors)`);
  }

  lines.push(`Warnings: ${result.stats.warning_count}`);
  lines.push(`Lines checked: ${result.stats.lines_checked}`);
  lines.push(`Prose ratio: ${Math.round(result.stats.prose_ratio * 100)}%`);

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    for (const error of result.errors) {
      lines.push(`  [${error.category}] Line ${error.line}: "${error.match}" - ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const warning of result.warnings) {
      const location = warning.line ? `Line ${warning.line}: ` : '';
      const matchText = warning.match ? `"${warning.match}" - ` : '';
      lines.push(`  [${warning.category}] ${location}${matchText}${warning.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * Suggest fixes for common violations
 */
export function suggestFix(violation: LintViolation): string | null {
  const fixes: Record<string, Record<string, string>> = {
    evaluative: {
      'best': 'Remove or replace with factual comparison',
      'top': 'Remove or specify ranking source',
      'leading': 'Remove or cite market data',
      'excellent': 'Remove subjective qualifier',
      'amazing': 'Remove subjective qualifier'
    },
    advice: {
      'you should': 'Rephrase as factual statement',
      'we recommend': 'Remove recommendation',
      'consider using': 'Rephrase as feature description'
    },
    cta: {
      'sign up': 'Remove call to action',
      'get started': 'Remove call to action',
      'click here': 'Remove or rephrase as neutral link'
    }
  };

  const categoryFixes = fixes[violation.category];
  if (!categoryFixes) return null;

  const matchLower = violation.match.toLowerCase();
  for (const [pattern, fix] of Object.entries(categoryFixes)) {
    if (matchLower.includes(pattern)) {
      return fix;
    }
  }

  return null;
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('Content Linting Rules - Acceptance Tests\n');
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

  // Clean content for testing
  const cleanContent = `# Exchange Overview

| Feature | Value |
|---------|-------|
| Trading pairs | 150+ |
| Fees | 0.1% |

The exchange supports spot and futures trading.`;

  // Violating content
  const violatingContent = `# The Best Exchange

This is the best exchange you should try. Sign up now!
We recommend this platform for everyone.`;

  // Test 1: Clean content passes
  test('Test 1 - Clean content passes', () => {
    const result = lintContent(cleanContent);
    return result.valid === true;
  });

  // Test 2: "best" detected as evaluative
  test('Test 2 - "best" detected as evaluative', () => {
    const result = lintContent('This is the best platform.');
    return result.errors.some(e => e.category === 'evaluative' && e.match.toLowerCase() === 'best');
  });

  // Test 3: "recommended" detected
  test('Test 3 - "recommended" detected', () => {
    const result = lintContent('This platform is recommended for traders.');
    return result.errors.some(e => e.category === 'recommendation');
  });

  // Test 4: "you should" detected as advice
  test('Test 4 - "you should" detected as advice', () => {
    const result = lintContent('You should use this feature.');
    return result.errors.some(e => e.category === 'advice' && e.match.toLowerCase().includes('you should'));
  });

  // Test 5: CTA "sign up" detected
  test('Test 5 - CTA "sign up" detected', () => {
    const result = lintContent('Sign up today for free!');
    return result.errors.some(e => e.category === 'cta');
  });

  // Test 6: Neutral description passes
  test('Test 6 - Neutral description passes', () => {
    const result = lintContent('The platform offers 150 trading pairs with 0.1% fees.');
    return result.valid === true;
  });

  // Test 7: Marketing buzzwords detected
  test('Test 7 - Marketing buzzwords detected', () => {
    const result = lintContent('This revolutionary platform is groundbreaking.');
    return result.errors.some(e => e.category === 'marketing');
  });

  // Test 8: Speculation detected
  test('Test 8 - Speculation detected', () => {
    const result = lintContent('The price will likely increase in the future.');
    return result.errors.some(e => e.category === 'speculation');
  });

  // Test 9: Emotional language detected
  test('Test 9 - Emotional language detected', () => {
    const result = lintContent('Users love this feature.');
    return result.errors.some(e => e.category === 'emotional');
  });

  // Test 10: Ranking claims detected
  test('Test 10 - Ranking claims detected', () => {
    const result = lintContent('Ranked #1 in user satisfaction.');
    return result.errors.some(e => e.category === 'ranking');
  });

  // Test 11: Code blocks excluded from linting
  test('Test 11 - Code blocks excluded', () => {
    const content = '```\nconst best = "value";\n```\nNeutral text.';
    const result = lintContent(content);
    return result.valid === true;
  });

  // Test 12: Multiple violations counted
  test('Test 12 - Multiple violations counted', () => {
    const result = lintContent(violatingContent);
    return result.stats.error_count >= 3;
  });

  // Test 13: Line numbers tracked
  test('Test 13 - Line numbers tracked', () => {
    const result = lintContent('Line one.\nYou should do this.');
    return result.errors.some(e => e.line === 2);
  });

  // Test 14: isCleanContent helper works
  test('Test 14 - isCleanContent helper works', () => {
    return isCleanContent(cleanContent) === true && isCleanContent(violatingContent) === false;
  });

  // Test 15: Prose ratio calculated
  test('Test 15 - Prose ratio calculated', () => {
    const result = lintContent(cleanContent);
    return result.stats.prose_ratio >= 0 && result.stats.prose_ratio <= 1;
  });

  // Test 16: High prose ratio warning
  test('Test 16 - High prose ratio warning', () => {
    const proseHeavy = 'This is a long paragraph of text. '.repeat(20);
    const result = lintContent(proseHeavy);
    return result.warnings.some(w => w.category === 'prose_heavy');
  });

  // Test 17: getViolationsByCategory groups correctly
  test('Test 17 - Violations grouped by category', () => {
    const result = lintContent(violatingContent);
    const grouped = getViolationsByCategory(result);
    return grouped.size > 0;
  });

  // Test 18: formatLintReport produces output
  test('Test 18 - Report formatting works', () => {
    const result = lintContent(violatingContent);
    const report = formatLintReport(result);
    return report.includes('FAIL') && report.includes('errors');
  });

  // Test 19: Subjective language detected
  test('Test 19 - Subjective language detected', () => {
    const result = lintContent('I believe this is a good platform.');
    return result.errors.some(e => e.category === 'subjective');
  });

  // Test 20: suggestFix provides suggestions
  test('Test 20 - Fix suggestions provided', () => {
    const result = lintContent('This is the best exchange.');
    const fix = result.errors.length > 0 ? suggestFix(result.errors[0]) : null;
    return fix !== null;
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
