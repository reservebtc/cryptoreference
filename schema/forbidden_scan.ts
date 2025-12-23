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
 * Emoji Unicode ranges (comprehensive)
 */
const EMOJI_REGEX = new RegExp(
  [
    '[\u{1F600}-\u{1F64F}]', // Emoticons
    '[\u{1F300}-\u{1F5FF}]', // Misc Symbols and Pictographs
    '[\u{1F680}-\u{1F6FF}]', // Transport and Map
    '[\u{1F1E0}-\u{1F1FF}]', // Flags
    '[\u{2600}-\u{26FF}]',   // Misc symbols
    '[\u{2700}-\u{27BF}]',   // Dingbats
    '[\u{1F900}-\u{1F9FF}]', // Supplemental Symbols
    '[\u{1FA00}-\u{1FA6F}]', // Chess Symbols
    '[\u{1FA70}-\u{1FAFF}]', // Symbols and Pictographs Extended-A
    '[\u{231A}-\u{231B}]',   // Watch, Hourglass
    '[\u{23E9}-\u{23F3}]',   // Media control symbols
    '[\u{23F8}-\u{23FA}]',   // Media control symbols
    '[\u{25AA}-\u{25AB}]',   // Squares
    '[\u{25B6}]',            // Play button
    '[\u{25C0}]',            // Reverse button
    '[\u{25FB}-\u{25FE}]',   // Squares
    '[\u{2614}-\u{2615}]',   // Umbrella, Hot Beverage
    '[\u{2648}-\u{2653}]',   // Zodiac
    '[\u{267F}]',            // Wheelchair
    '[\u{2693}]',            // Anchor
    '[\u{26A1}]',            // High Voltage
    '[\u{26AA}-\u{26AB}]',   // Circles
    '[\u{26BD}-\u{26BE}]',   // Soccer, Baseball
    '[\u{26C4}-\u{26C5}]',   // Snowman, Sun
    '[\u{26CE}]',            // Ophiuchus
    '[\u{26D4}]',            // No Entry
    '[\u{26EA}]',            // Church
    '[\u{26F2}-\u{26F3}]',   // Fountain, Golf
    '[\u{26F5}]',            // Sailboat
    '[\u{26FA}]',            // Tent
    '[\u{26FD}]',            // Fuel Pump
    '[\u{2702}]',            // Scissors
    '[\u{2705}]',            // Check Mark
    '[\u{2708}-\u{270D}]',   // Airplane to Writing Hand
    '[\u{270F}]',            // Pencil
    '[\u{2712}]',            // Black Nib
    '[\u{2714}]',            // Check Mark
    '[\u{2716}]',            // X Mark
    '[\u{271D}]',            // Latin Cross
    '[\u{2721}]',            // Star of David
    '[\u{2728}]',            // Sparkles
    '[\u{2733}-\u{2734}]',   // Eight Spoked Asterisk
    '[\u{2744}]',            // Snowflake
    '[\u{2747}]',            // Sparkle
    '[\u{274C}]',            // Cross Mark
    '[\u{274E}]',            // Cross Mark
    '[\u{2753}-\u{2755}]',   // Question Marks
    '[\u{2757}]',            // Exclamation Mark
    '[\u{2763}-\u{2764}]',   // Heart Exclamation
    '[\u{2795}-\u{2797}]',   // Plus, Minus, Divide
    '[\u{27A1}]',            // Right Arrow
    '[\u{27B0}]',            // Curly Loop
    '[\u{27BF}]',            // Double Curly Loop
    '[\u{2934}-\u{2935}]',   // Arrows
    '[\u{2B05}-\u{2B07}]',   // Arrows
    '[\u{2B1B}-\u{2B1C}]',   // Squares
    '[\u{2B50}]',            // Star
    '[\u{2B55}]',            // Circle
    '[\u{3030}]',            // Wavy Dash
    '[\u{303D}]',            // Part Alternation Mark
    '[\u{3297}]',            // Circled Ideograph Congratulation
    '[\u{3299}]',            // Circled Ideograph Secret
  ].join('|'),
  'gu'
);

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
  let match;

  // Reset regex state
  EMOJI_REGEX.lastIndex = 0;

  while ((match = EMOJI_REGEX.exec(text)) !== null) {
    violations.push({
      type: 'emoji',
      match: match[0],
      position: match.index,
      message: `Emoji character forbidden: "${match[0]}"`
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
