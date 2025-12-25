/**
 * CR-Markup Protocol v1.0 - Forbidden Content Scanner
 *
 * This module scans CR-blocks for forbidden content:
 * - Emoji characters
 * - Marketing language
 * - Ranking claims
 * - CTA (Call-to-Action) verbs
 * - Prompt-like instructions
 *
 * Reference: /schema/spec.md, /schema/CLAUDE.md
 */

// ============================================
// TYPES
// ============================================

export interface ScanResult {
  clean: boolean;
  violations: Violation[];
}

export interface Violation {
  type: ViolationType;
  match: string;
  position: number;
  line?: number;
  message: string;
}

export type ViolationType =
  | 'emoji'
  | 'marketing'
  | 'ranking'
  | 'cta'
  | 'prompt'
  | 'opinion'
  | 'speculation';

// ============================================
// FORBIDDEN PATTERNS
// ============================================

/**
 * Emoji detection using code points (no unicode regex flag needed)
 */
function isEmojiCodePoint(code: number): boolean {
  // Emoticons
  if (code >= 0x1F600 && code <= 0x1F64F) return true;
  // Misc Symbols and Pictographs
  if (code >= 0x1F300 && code <= 0x1F5FF) return true;
  // Transport and Map
  if (code >= 0x1F680 && code <= 0x1F6FF) return true;
  // Flags
  if (code >= 0x1F1E0 && code <= 0x1F1FF) return true;
  // Misc symbols
  if (code >= 0x2600 && code <= 0x26FF) return true;
  // Dingbats
  if (code >= 0x2700 && code <= 0x27BF) return true;
  // Supplemental Symbols
  if (code >= 0x1F900 && code <= 0x1F9FF) return true;
  // Chess Symbols
  if (code >= 0x1FA00 && code <= 0x1FA6F) return true;
  // Extended-A
  if (code >= 0x1FA70 && code <= 0x1FAFF) return true;
  // Watch, Hourglass
  if (code >= 0x231A && code <= 0x231B) return true;
  // Media controls
  if (code >= 0x23E9 && code <= 0x23F3) return true;
  if (code >= 0x23F8 && code <= 0x23FA) return true;
  // Squares
  if (code >= 0x25AA && code <= 0x25AB) return true;
  if (code >= 0x25FB && code <= 0x25FE) return true;
  if (code === 0x25B6 || code === 0x25C0) return true;
  // Various symbols
  if (code >= 0x2614 && code <= 0x2615) return true;
  if (code >= 0x2648 && code <= 0x2653) return true;
  if (code === 0x267F || code === 0x2693 || code === 0x26A1) return true;
  if (code >= 0x26AA && code <= 0x26AB) return true;
  if (code >= 0x26BD && code <= 0x26BE) return true;
  if (code >= 0x26C4 && code <= 0x26C5) return true;
  if (code === 0x26CE || code === 0x26D4 || code === 0x26EA) return true;
  if (code >= 0x26F2 && code <= 0x26F3) return true;
  if (code === 0x26F5 || code === 0x26FA || code === 0x26FD) return true;
  if (code === 0x2702 || code === 0x2705) return true;
  if (code >= 0x2708 && code <= 0x270D) return true;
  if (code === 0x270F || code === 0x2712 || code === 0x2714 || code === 0x2716) return true;
  if (code === 0x271D || code === 0x2721 || code === 0x2728) return true;
  if (code >= 0x2733 && code <= 0x2734) return true;
  if (code === 0x2744 || code === 0x2747 || code === 0x274C || code === 0x274E) return true;
  if (code >= 0x2753 && code <= 0x2755) return true;
  if (code === 0x2757) return true;
  if (code >= 0x2763 && code <= 0x2764) return true;
  if (code >= 0x2795 && code <= 0x2797) return true;
  if (code === 0x27A1 || code === 0x27B0 || code === 0x27BF) return true;
  if (code >= 0x2934 && code <= 0x2935) return true;
  if (code >= 0x2B05 && code <= 0x2B07) return true;
  if (code >= 0x2B1B && code <= 0x2B1C) return true;
  if (code === 0x2B50 || code === 0x2B55) return true;
  if (code === 0x3030 || code === 0x303D || code === 0x3297 || code === 0x3299) return true;
  return false;
}

function findEmojisInText(text: string): { char: string; position: number }[] {
  const results: { char: string; position: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    if (code === undefined) continue;
    if (isEmojiCodePoint(code)) {
      results.push({ char: String.fromCodePoint(code), position: i });
    }
    if (code > 0xFFFF) i++; // Skip surrogate pair
  }
  return results;
}

/**
 * Marketing language patterns (case-insensitive)
 */
const MARKETING_TERMS = [
  'amazing',
  'awesome',
  'incredible',
  'revolutionary',
  'game-?changing',
  'cutting-?edge',
  'innovative',
  'groundbreaking',
  'unparalleled',
  'unprecedented',
  'exclusive',
  'premium',
  'ultimate',
  'powerful',
  'exceptional',
  'outstanding',
  'remarkable',
  'extraordinary',
  'fantastic',
  'superb',
  'excellent',
  'perfect',
  'ideal',
  'superior',
  'unmatched',
  'unbeatable',
  'world-?class',
  'industry-?leading',
  'state-?of-?the-?art',
  'next-?gen(?:eration)?',
  'must-?have',
  'game changer',
  'disruptive',
  'transformative',
];

/**
 * Ranking claims patterns (case-insensitive)
 */
const RANKING_TERMS = [
  'best',
  'top',
  '#1',
  'number one',
  'number 1',
  'leading',
  'largest',
  'biggest',
  'fastest',
  'safest',
  'most popular',
  'most trusted',
  'most reliable',
  'most secure',
  'highest rated',
  'top-?rated',
  'award-?winning',
  'recommended',
  'preferred',
  'favorite',
  'favourite',
  'go-?to',
  'first choice',
  'market leader',
  'industry leader',
  'dominant',
  'unrivaled',
  'unrivalled',
];

/**
 * Call-to-Action verbs patterns (case-insensitive)
 */
const CTA_TERMS = [
  'sign up',
  'signup',
  'register now',
  'join now',
  'join today',
  'get started',
  'start now',
  'start today',
  'try now',
  'try today',
  'try for free',
  'buy now',
  'order now',
  'subscribe',
  'download now',
  'claim your',
  'grab your',
  'get your',
  'don\'t miss',
  'dont miss',
  'act now',
  'act fast',
  'limited time',
  'hurry',
  'apply now',
  'click here',
  'learn more',
  'find out',
  'discover how',
  'unlock',
  'activate',
];

/**
 * Prompt-like instructions patterns (case-insensitive)
 */
const PROMPT_TERMS = [
  'you should',
  'you must',
  'you need to',
  'you have to',
  'we recommend',
  'we suggest',
  'we advise',
  'consider using',
  'make sure to',
  'be sure to',
  'don\'t forget to',
  'dont forget to',
  'remember to',
  'always use',
  'never use',
  'avoid using',
  'prefer using',
  'it\'s important to',
  'its important to',
  'please note',
  'note that',
  'keep in mind',
  'bear in mind',
  'pro tip',
  'protip',
  'hot tip',
  'insider tip',
];

/**
 * Opinion/speculation patterns (case-insensitive)
 */
const OPINION_TERMS = [
  'i think',
  'i believe',
  'in my opinion',
  'we think',
  'we believe',
  'probably',
  'maybe',
  'perhaps',
  'might be',
  'could be',
  'seems like',
  'appears to',
  'looks like',
  'supposedly',
  'allegedly',
  'reportedly',
  'rumor has it',
  'rumour has it',
  'word is',
  'speculation',
  'speculate',
];

// ============================================
// SCANNER FUNCTIONS
// ============================================

/**
 * Scans text for emoji characters.
 */
export function scanEmoji(text: string): Violation[] {
  const violations: Violation[] = [];
  const emojis = findEmojisInText(text);

  for (const emoji of emojis) {
    violations.push({
      type: 'emoji',
      match: emoji.char,
      position: emoji.position,
      message: `Emoji character forbidden: "${emoji.char}"`
    });
  }

  return violations;
}

/**
 * Scans text for forbidden terms.
 */
function scanTerms(
  text: string,
  terms: string[],
  type: ViolationType,
  category: string
): Violation[] {
  const violations: Violation[] = [];
  const lowerText = text.toLowerCase();

  for (const term of terms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;

    while ((match = regex.exec(lowerText)) !== null) {
      violations.push({
        type,
        match: text.slice(match.index, match.index + match[0].length),
        position: match.index,
        message: `${category} term forbidden: "${match[0]}"`
      });
    }
  }

  return violations;
}

/**
 * Scans text for marketing language.
 */
export function scanMarketing(text: string): Violation[] {
  return scanTerms(text, MARKETING_TERMS, 'marketing', 'Marketing');
}

/**
 * Scans text for ranking claims.
 */
export function scanRanking(text: string): Violation[] {
  return scanTerms(text, RANKING_TERMS, 'ranking', 'Ranking');
}

/**
 * Scans text for CTA verbs.
 */
export function scanCTA(text: string): Violation[] {
  return scanTerms(text, CTA_TERMS, 'cta', 'CTA');
}

/**
 * Scans text for prompt-like instructions.
 */
export function scanPrompts(text: string): Violation[] {
  return scanTerms(text, PROMPT_TERMS, 'prompt', 'Prompt-like');
}

/**
 * Scans text for opinion/speculation.
 */
export function scanOpinion(text: string): Violation[] {
  return scanTerms(text, OPINION_TERMS, 'opinion', 'Opinion/speculation');
}

// ============================================
// MAIN SCANNER
// ============================================

/**
 * Scans CR-block text for all forbidden content.
 *
 * @param text - Raw CR-block text or content to scan
 * @returns ScanResult with clean status and list of violations
 */
export function scanForbiddenContent(text: string): ScanResult {
  const violations: Violation[] = [
    ...scanEmoji(text),
    ...scanMarketing(text),
    ...scanRanking(text),
    ...scanCTA(text),
    ...scanPrompts(text),
    ...scanOpinion(text),
  ];

  // Add line numbers to violations
  const lines = text.split('\n');
  for (const violation of violations) {
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= violation.position) {
        violation.line = i + 1;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
  }

  // Sort by position
  violations.sort((a, b) => a.position - b.position);

  return {
    clean: violations.length === 0,
    violations
  };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Emoji inside CR → rejected
  const textWithEmoji = `[CR/TEST]
name=Test Entity 🚀
type=exchange
[/CR]`;

  const emojiResult = scanForbiddenContent(textWithEmoji);
  if (!emojiResult.clean && emojiResult.violations.some(v => v.type === 'emoji')) {
    results.push('PASS: Test 1 - Emoji inside CR rejected');
  } else {
    results.push('FAIL: Test 1 - Emoji should be rejected');
    allPassed = false;
  }

  // Test 2: "best", "#1", "recommended" → rejected
  const textWithRanking = `[CR/TEST]
name=Best Exchange
description=The #1 recommended platform
[/CR]`;

  const rankingResult = scanForbiddenContent(textWithRanking);
  const hasRankingViolations = rankingResult.violations.filter(v => v.type === 'ranking').length >= 2;
  if (!rankingResult.clean && hasRankingViolations) {
    results.push('PASS: Test 2 - Ranking claims ("best", "#1", "recommended") rejected');
  } else {
    results.push('FAIL: Test 2 - Ranking claims should be rejected');
    allPassed = false;
  }

  // Test 3: Neutral factual text → allowed
  const neutralText = `[CR/BINANCE]
schema=CR1.0
version=1.0
type=exchange
name=Binance
trading_fee=0.1%
leverage_max=125
kyc_required=true
[/CR]`;

  const neutralResult = scanForbiddenContent(neutralText);
  if (neutralResult.clean) {
    results.push('PASS: Test 3 - Neutral factual text allowed');
  } else {
    results.push('FAIL: Test 3 - Neutral text should be allowed');
    results.push(`       Violations: ${JSON.stringify(neutralResult.violations)}`);
    allPassed = false;
  }

  // Test 4: Marketing language → rejected
  const marketingText = `Amazing revolutionary platform with incredible features`;
  const marketingResult = scanForbiddenContent(marketingText);
  if (!marketingResult.clean && marketingResult.violations.some(v => v.type === 'marketing')) {
    results.push('PASS: Test 4 - Marketing language rejected');
  } else {
    results.push('FAIL: Test 4 - Marketing language should be rejected');
    allPassed = false;
  }

  // Test 5: CTA verbs → rejected
  const ctaText = `Sign up now and get started today! Don't miss this opportunity.`;
  const ctaResult = scanForbiddenContent(ctaText);
  if (!ctaResult.clean && ctaResult.violations.some(v => v.type === 'cta')) {
    results.push('PASS: Test 5 - CTA verbs rejected');
  } else {
    results.push('FAIL: Test 5 - CTA verbs should be rejected');
    allPassed = false;
  }

  // Test 6: Prompt-like instructions → rejected
  const promptText = `You should always use this feature. We recommend setting it up first.`;
  const promptResult = scanForbiddenContent(promptText);
  if (!promptResult.clean && promptResult.violations.some(v => v.type === 'prompt')) {
    results.push('PASS: Test 6 - Prompt-like instructions rejected');
  } else {
    results.push('FAIL: Test 6 - Prompt-like instructions should be rejected');
    allPassed = false;
  }

  // Test 7: Opinion/speculation → rejected
  const opinionText = `I think this might be a good option. It probably works well.`;
  const opinionResult = scanForbiddenContent(opinionText);
  if (!opinionResult.clean && opinionResult.violations.some(v => v.type === 'opinion')) {
    results.push('PASS: Test 7 - Opinion/speculation rejected');
  } else {
    results.push('FAIL: Test 7 - Opinion/speculation should be rejected');
    allPassed = false;
  }

  // Test 8: Multiple emoji types → all rejected
  const multiEmoji = `Test 🔥 with 💯 multiple ✨ emojis 🎉`;
  const multiEmojiResult = scanForbiddenContent(multiEmoji);
  if (multiEmojiResult.violations.filter(v => v.type === 'emoji').length >= 4) {
    results.push('PASS: Test 8 - Multiple emoji types all rejected');
  } else {
    results.push('FAIL: Test 8 - All emojis should be detected');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Forbidden Content Scanner - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example scan
  console.log('\n\nExample Scan (text with violations):');
  console.log('-'.repeat(60));

  const badText = `🚀 The BEST and #1 recommended exchange!
Sign up now to get started with this amazing platform.
We believe this is probably the top choice for everyone.`;

  console.log('Input:');
  console.log(badText);
  console.log('\nViolations found:');

  const result = scanForbiddenContent(badText);
  for (const v of result.violations) {
    console.log(`  [${v.type}] Line ${v.line}: "${v.match}" - ${v.message}`);
  }

  console.log(`\nClean: ${result.clean}`);
  console.log(`Total violations: ${result.violations.length}`);
}
