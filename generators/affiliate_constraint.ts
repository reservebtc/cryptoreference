/**
 * Affiliate Constraint Enforcement
 *
 * Prevents canonical pollution:
 * - Max 1 affiliate link per page
 * - Affiliate links MUST be outside CR blocks
 * - Affiliate links MUST use neutral wording
 *
 * Reference: plan3.md Step 10
 */

// =============================================================================
// Types
// =============================================================================

export interface AffiliateLink {
  url: string;
  text: string;
  line: number;
  column: number;
  isInsideCR: boolean;
}

export interface AffiliateViolation {
  type: 'multiple_links' | 'inside_cr' | 'non_neutral_wording' | 'missing_disclosure';
  message: string;
  link?: AffiliateLink;
}

export interface AffiliateResult {
  valid: boolean;
  errors: AffiliateViolation[];
  warnings: AffiliateViolation[];
  links_found: AffiliateLink[];
  stats: {
    total_links: number;
    links_inside_cr: number;
    links_outside_cr: number;
  };
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Known affiliate URL patterns
 */
export const AFFILIATE_PATTERNS: RegExp[] = [
  // Referral parameters
  /[?&](ref|referral|affiliate|aff|partner|promo|campaign|utm_source|r)=[^&\s)]+/i,

  // Common affiliate subdomains/paths
  /\/(ref|referral|affiliate|partner|go|click|track)\//i,

  // Crypto exchange referral patterns
  /\.(com|io|exchange)\/(register|signup|join)\?.*ref/i,

  // Short link services often used for affiliates
  /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly/i,

  // Explicit affiliate markers
  /affiliate|referral-link|partner-link/i
];

/**
 * Non-neutral wording patterns around affiliate links
 */
export const NON_NEUTRAL_PATTERNS: RegExp[] = [
  // Promotional language
  /\b(exclusive|special|bonus|discount|limited|free|best deal)\b/i,

  // Urgency language
  /\b(now|today|hurry|limited time|don't miss)\b/i,

  // Imperative CTAs
  /\b(sign up|register|join|get started|claim|grab)\b/i,

  // Benefit claims
  /\b(save|earn|get \$|receive|unlock)\b/i,

  // Recommendation language
  /\b(recommended|my favorite|i use|we recommend)\b/i
];

/**
 * Allowed neutral wording for affiliate links
 */
export const NEUTRAL_WORDING_EXAMPLES = [
  'Referral link',
  'Affiliate link',
  'Partner link',
  'Registration link',
  'This link may provide commission'
];

/**
 * Required disclosure patterns
 */
export const DISCLOSURE_PATTERNS: RegExp[] = [
  /affiliate\s*(link|disclosure)/i,
  /referral\s*(link|commission)/i,
  /partner\s*link/i,
  /may\s*(receive|earn)\s*(commission|compensation)/i,
  /sponsored/i
];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Extract CR block ranges from content
 */
function extractCRBlockRanges(content: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  // Fenced CR blocks: ```cr ... ```
  const fencedPattern = /```cr[\s\S]*?```/g;
  let match;
  while ((match = fencedPattern.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  // HTML comment CR: <!-- CR: ... -->
  const commentPattern = /<!--\s*CR:[\s\S]*?-->/g;
  while ((match = commentPattern.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  return ranges;
}

/**
 * Check if position is inside any CR block
 */
function isInsideCRBlock(index: number, ranges: Array<[number, number]>): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

/**
 * Find line and column for a position
 */
function findPosition(content: string, index: number): { line: number; column: number } {
  const lines = content.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Check if URL is an affiliate link
 */
export function isAffiliateLink(url: string): boolean {
  return AFFILIATE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extract all links from content
 */
export function extractLinks(content: string): Array<{ url: string; text: string; index: number }> {
  const links: Array<{ url: string; text: string; index: number }> = [];

  // Markdown links: [text](url)
  const mdPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdPattern.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      index: match.index
    });
  }

  // HTML links: <a href="url">text</a>
  const htmlPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  while ((match = htmlPattern.exec(content)) !== null) {
    links.push({
      text: match[2],
      url: match[1],
      index: match.index
    });
  }

  // Bare URLs (excluding URLs inside markdown links, HTML attributes, etc.)
  const urlPattern = /(?<![[(="'])https?:\/\/[^\s<>)\]"']+/g;
  while ((match = urlPattern.exec(content)) !== null) {
    // Additional check: skip if URL ends with quote (partial match inside attribute)
    const url = match[0].replace(/["']$/, '');
    if (url.length > 10) { // Basic sanity check
      links.push({
        text: url,
        url: url,
        index: match.index
      });
    }
  }

  return links;
}

/**
 * Extract preceding text context for a link (text BEFORE the link only)
 * This avoids flagging the link text itself as non-neutral
 */
function getLinkContext(content: string, index: number, radius: number = 100): string {
  const start = Math.max(0, index - radius);
  // Only get text BEFORE the link, not including the link itself
  return content.substring(start, index);
}

/**
 * Check if wording around link is neutral
 */
export function isNeutralWording(context: string): { neutral: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const pattern of NON_NEUTRAL_PATTERNS) {
    const match = context.match(pattern);
    if (match) {
      violations.push(match[0]);
    }
  }

  return {
    neutral: violations.length === 0,
    violations
  };
}

/**
 * Check if content has proper affiliate disclosure
 */
export function hasAffiliateDisclosure(content: string): boolean {
  return DISCLOSURE_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Main validation function
 */
export function validateAffiliateConstraints(content: string): AffiliateResult {
  const errors: AffiliateViolation[] = [];
  const warnings: AffiliateViolation[] = [];
  const affiliateLinks: AffiliateLink[] = [];

  // Extract CR block ranges
  const crRanges = extractCRBlockRanges(content);

  // Extract all links
  const allLinks = extractLinks(content);

  // Find affiliate links
  for (const link of allLinks) {
    if (isAffiliateLink(link.url)) {
      const position = findPosition(content, link.index);
      const isInsideCR = isInsideCRBlock(link.index, crRanges);

      affiliateLinks.push({
        url: link.url,
        text: link.text,
        line: position.line,
        column: position.column,
        isInsideCR
      });
    }
  }

  // Validate: Max 1 affiliate link
  if (affiliateLinks.length > 1) {
    errors.push({
      type: 'multiple_links',
      message: `Found ${affiliateLinks.length} affiliate links, maximum allowed is 1`,
      link: affiliateLinks[1] // Reference the second link as the violation
    });
  }

  // Validate: No affiliate links inside CR
  const linksInsideCR = affiliateLinks.filter(l => l.isInsideCR);
  for (const link of linksInsideCR) {
    errors.push({
      type: 'inside_cr',
      message: `Affiliate link found inside CR block at line ${link.line}`,
      link
    });
  }

  // Validate: Neutral wording around affiliate links
  // We need original link index, so we find it from allLinks
  for (const link of affiliateLinks) {
    // Find the original link to get the correct index
    const originalLink = allLinks.find(l => l.url === link.url);
    const linkIndex = originalLink ? originalLink.index : 0;
    const context = getLinkContext(content, linkIndex);
    const wordingCheck = isNeutralWording(context);

    if (!wordingCheck.neutral) {
      errors.push({
        type: 'non_neutral_wording',
        message: `Non-neutral wording near affiliate link: "${wordingCheck.violations.join('", "')}"`,
        link
      });
    }
  }

  // Warning: Missing disclosure if affiliate links present
  if (affiliateLinks.length > 0 && !hasAffiliateDisclosure(content)) {
    warnings.push({
      type: 'missing_disclosure',
      message: 'Affiliate link present but no disclosure statement found'
    });
  }

  // Calculate stats
  const linksOutsideCR = affiliateLinks.filter(l => !l.isInsideCR);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    links_found: affiliateLinks,
    stats: {
      total_links: affiliateLinks.length,
      links_inside_cr: linksInsideCR.length,
      links_outside_cr: linksOutsideCR.length
    }
  };
}

/**
 * Quick check if content has valid affiliate constraints
 */
export function hasValidAffiliates(content: string): boolean {
  const result = validateAffiliateConstraints(content);
  return result.valid;
}

/**
 * Format validation result as report
 */
export function formatAffiliateReport(result: AffiliateResult): string {
  const lines: string[] = [];

  lines.push('Affiliate Constraint Report');
  lines.push('='.repeat(40));

  if (result.valid) {
    lines.push('Status: PASS');
  } else {
    lines.push(`Status: FAIL (${result.errors.length} errors)`);
  }

  lines.push(`Affiliate links found: ${result.stats.total_links}`);
  lines.push(`  - Inside CR: ${result.stats.links_inside_cr}`);
  lines.push(`  - Outside CR: ${result.stats.links_outside_cr}`);

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    for (const error of result.errors) {
      const location = error.link ? ` (line ${error.link.line})` : '';
      lines.push(`  [${error.type}]${location}: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const warning of result.warnings) {
      lines.push(`  [${warning.type}]: ${warning.message}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Acceptance Tests
// =============================================================================

function runAcceptanceTests(): void {
  console.log('Affiliate Constraint Enforcement - Acceptance Tests\n');
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

  // Test content samples
  const cleanContent = `# Exchange Overview

| Feature | Value |
|---------|-------|
| Fees | 0.1% |

Affiliate link (referral): [Register](https://exchange.com/signup?ref=abc123)

*Affiliate disclosure: This link may provide commission.*`;

  const contentWithCRAffiliate = `\`\`\`cr
{"schema": "CR1.0", "type": "exchange"}
[Affiliate](https://exchange.com?ref=123)
\`\`\`

Content here.`;

  const contentMultipleAffiliates = `
[Link 1](https://exchange.com?ref=abc)
[Link 2](https://other.com?affiliate=xyz)
`;

  const contentNonNeutral = `
Sign up now with this exclusive bonus link!
[Get Started](https://exchange.com?ref=abc)
`;

  // Test 1: Clean content with proper affiliate passes
  test('Test 1 - Valid affiliate content passes', () => {
    const result = validateAffiliateConstraints(cleanContent);
    return result.valid === true;
  });

  // Test 2: Affiliate inside CR block fails
  test('Test 2 - Affiliate inside CR fails', () => {
    const result = validateAffiliateConstraints(contentWithCRAffiliate);
    return !result.valid && result.errors.some(e => e.type === 'inside_cr');
  });

  // Test 3: Multiple affiliate links fails
  test('Test 3 - Multiple affiliates fails', () => {
    const result = validateAffiliateConstraints(contentMultipleAffiliates);
    return !result.valid && result.errors.some(e => e.type === 'multiple_links');
  });

  // Test 4: Non-neutral wording fails
  test('Test 4 - Non-neutral wording fails', () => {
    const result = validateAffiliateConstraints(contentNonNeutral);
    return !result.valid && result.errors.some(e => e.type === 'non_neutral_wording');
  });

  // Test 5: No affiliate links passes
  test('Test 5 - No affiliates passes', () => {
    const result = validateAffiliateConstraints('# Plain content\nNo links here.');
    return result.valid === true;
  });

  // Test 6: isAffiliateLink detects ref parameter
  test('Test 6 - Detects ref parameter', () => {
    return isAffiliateLink('https://exchange.com?ref=abc123') === true;
  });

  // Test 7: isAffiliateLink detects affiliate parameter
  test('Test 7 - Detects affiliate parameter', () => {
    return isAffiliateLink('https://site.com?affiliate=xyz') === true;
  });

  // Test 8: isAffiliateLink detects referral path
  test('Test 8 - Detects referral path', () => {
    return isAffiliateLink('https://site.com/referral/user123') === true;
  });

  // Test 9: Regular link not detected as affiliate
  test('Test 9 - Regular link not affiliate', () => {
    return isAffiliateLink('https://docs.example.com/api') === false;
  });

  // Test 10: extractLinks finds markdown links
  test('Test 10 - Extracts markdown links', () => {
    const links = extractLinks('[Text](https://example.com)');
    return links.length === 1 && links[0].url === 'https://example.com';
  });

  // Test 11: extractLinks finds HTML links
  test('Test 11 - Extracts HTML links', () => {
    const links = extractLinks('<a href="https://example.com">Text</a>');
    return links.length === 1 && links[0].url === 'https://example.com';
  });

  // Test 12: isNeutralWording detects promotional language
  test('Test 12 - Detects promotional language', () => {
    const result = isNeutralWording('Get exclusive bonus now!');
    return result.neutral === false;
  });

  // Test 13: isNeutralWording passes neutral text
  test('Test 13 - Passes neutral text', () => {
    const result = isNeutralWording('Referral link for registration.');
    return result.neutral === true;
  });

  // Test 14: hasAffiliateDisclosure detects disclosure
  test('Test 14 - Detects affiliate disclosure', () => {
    return hasAffiliateDisclosure('Affiliate disclosure: commission may apply') === true;
  });

  // Test 15: Missing disclosure warning
  test('Test 15 - Missing disclosure warning', () => {
    const result = validateAffiliateConstraints('[Link](https://x.com?ref=a)');
    return result.warnings.some(w => w.type === 'missing_disclosure');
  });

  // Test 16: Stats count correctly
  test('Test 16 - Stats count correctly', () => {
    const result = validateAffiliateConstraints(cleanContent);
    return result.stats.total_links === 1 && result.stats.links_outside_cr === 1;
  });

  // Test 17: hasValidAffiliates helper works
  test('Test 17 - hasValidAffiliates helper', () => {
    return hasValidAffiliates(cleanContent) === true &&
           hasValidAffiliates(contentMultipleAffiliates) === false;
  });

  // Test 18: formatAffiliateReport produces output
  test('Test 18 - Report formatting works', () => {
    const result = validateAffiliateConstraints(contentMultipleAffiliates);
    const report = formatAffiliateReport(result);
    return report.includes('FAIL') && report.includes('multiple_links');
  });

  // Test 19: Detects bit.ly as potential affiliate
  test('Test 19 - Detects short links', () => {
    return isAffiliateLink('https://bit.ly/abc123') === true;
  });

  // Test 20: Line numbers tracked correctly
  test('Test 20 - Line numbers tracked', () => {
    const content = 'Line 1\nLine 2\n[Aff](https://x.com?ref=a)';
    const result = validateAffiliateConstraints(content);
    return result.links_found.length === 1 && result.links_found[0].line === 3;
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
