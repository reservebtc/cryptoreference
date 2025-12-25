/**
 * CR-Markup Protocol v1.0 - Canonicalization Algorithm
 *
 * This module implements the canonical representation for CR-blocks.
 * The canonical form is used to compute deterministic hashes.
 *
 * Reference: /schema/spec.md, /schema/cr_grammar.ebnf
 */

// ============================================
// TYPES
// ============================================

export interface CRBlock {
  token: string;
  fields: Record<string, CRValue>;
}

export type CRValue = string | number | boolean | string[];

export interface CanonicalResult {
  success: boolean;
  canonical?: string;
  json?: Record<string, CRValue>;
  error?: string;
}

export interface ParseResult {
  success: boolean;
  block?: CRBlock;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const CR_OPEN_REGEX = /^\[CR\/([A-Za-z][A-Za-z0-9_-]*)\]$/;
const CR_CLOSE_TAG = '[/CR]';
const FIELD_REGEX = /^([A-Za-z][A-Za-z0-9_-]*)=(.+)$/;

// Emoji detection function (forbidden in CR-blocks)
function containsEmoji(str: string): boolean {
  // Check for common emoji ranges using code points
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i);
    if (code === undefined) continue;

    // Skip surrogate pairs (already handled by codePointAt)
    if (code > 0xFFFF) i++;

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
    // Chess, cards, etc
    if (code >= 0x1FA00 && code <= 0x1FA6F) return true;
    // Extended-A
    if (code >= 0x1FA70 && code <= 0x1FAFF) return true;
  }
  return false;
}

// ============================================
// 1. CR-BLOCK EXTRACTION
// ============================================

/**
 * Extracts the CR-block content from raw text.
 * Returns the lines between [CR/TOKEN] and [/CR].
 */
export function extractCRBlock(input: string): ParseResult {
  const lines = input.split('\n').map(line => line.trim());

  let inBlock = false;
  let token = '';
  let blockLines: string[] = [];
  let openTagFound = false;
  let closeTagFound = false;

  for (const line of lines) {
    if (!inBlock) {
      const openMatch = line.match(CR_OPEN_REGEX);
      if (openMatch) {
        token = openMatch[1];
        inBlock = true;
        openTagFound = true;
        continue;
      }
    } else {
      if (line === CR_CLOSE_TAG) {
        closeTagFound = true;
        break;
      }

      // Check for nested CR-block (forbidden)
      if (CR_OPEN_REGEX.test(line)) {
        return {
          success: false,
          error: 'Nested CR-blocks are forbidden'
        };
      }

      // Check for emoji (forbidden)
      if (containsEmoji(line)) {
        return {
          success: false,
          error: 'Emoji characters are forbidden inside CR-blocks'
        };
      }

      if (line.length > 0) {
        blockLines.push(line);
      }
    }
  }

  if (!openTagFound) {
    return {
      success: false,
      error: 'No CR-block opening tag found'
    };
  }

  if (!closeTagFound) {
    return {
      success: false,
      error: 'Missing closing [/CR] tag'
    };
  }

  return {
    success: true,
    block: {
      token,
      fields: {}
    }
  };
}

// ============================================
// 2. FIELD PARSING
// ============================================

/**
 * Parses a value string into the appropriate type.
 */
export function parseValue(valueStr: string): CRValue {
  const trimmed = valueStr.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Array: ["a","b","c"]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner.length === 0) return [];

    const elements: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];

      if (char === '"' && (i === 0 || inner[i - 1] !== '\\')) {
        inQuote = !inQuote;
        continue;
      }

      if (char === ',' && !inQuote) {
        elements.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim().length > 0) {
      elements.push(current.trim());
    }

    return elements;
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // String (remove quotes if present)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Parses all fields from CR-block lines.
 */
export function parseFields(lines: string[]): Record<string, CRValue> {
  const fields: Record<string, CRValue> = {};
  const seenKeys = new Set<string>();

  for (const line of lines) {
    const match = line.match(FIELD_REGEX);
    if (!match) {
      continue; // Skip invalid lines
    }

    const [, key, value] = match;

    // Check for duplicate keys
    if (seenKeys.has(key)) {
      throw new Error(`Duplicate key: ${key}`);
    }
    seenKeys.add(key);

    // Check for empty value
    if (value.trim().length === 0) {
      throw new Error(`Empty value for key: ${key}`);
    }

    fields[key] = parseValue(value);
  }

  return fields;
}

// ============================================
// 3. WHITESPACE NORMALIZATION
// ============================================

/**
 * Normalizes whitespace in a CR-block string.
 * - Trims each line
 * - Removes empty lines
 * - Uses single LF for line endings
 */
export function normalizeWhitespace(input: string): string {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

// ============================================
// 4. KEY SORTING (Deterministic Order)
// ============================================

/**
 * Sorts fields alphabetically by key.
 * This ensures deterministic output regardless of input order.
 */
export function sortFields(fields: Record<string, CRValue>): Record<string, CRValue> {
  const sorted: Record<string, CRValue> = {};
  const keys = Object.keys(fields).sort();

  for (const key of keys) {
    sorted[key] = fields[key];
  }

  return sorted;
}

// ============================================
// 5. CANONICAL JSON SERIALIZATION
// ============================================

/**
 * Serializes a CR-block to canonical JSON.
 *
 * Rules:
 * - Keys are sorted alphabetically
 * - No extra whitespace
 * - UTF-8 encoding
 * - Consistent number formatting
 */
export function toCanonicalJSON(block: CRBlock): string {
  const sorted = sortFields(block.fields);

  const canonical = {
    _token: block.token,
    ...sorted
  };

  // JSON.stringify with sorted keys (already sorted above)
  // No space, no indentation for minimal canonical form
  return JSON.stringify(canonical, null, 0);
}

// ============================================
// 6. MAIN CANONICALIZATION FUNCTION
// ============================================

/**
 * Canonicalizes a CR-block from raw input.
 *
 * Steps:
 * 1. Extract CR-block
 * 2. Normalize whitespace
 * 3. Parse fields
 * 4. Sort keys alphabetically
 * 5. Serialize to canonical JSON
 *
 * @param input - Raw CR-block text
 * @returns CanonicalResult with success status and canonical JSON
 */
export function canonicalize(input: string): CanonicalResult {
  try {
    // Step 1: Normalize whitespace
    const normalized = normalizeWhitespace(input);
    const lines = normalized.split('\n');

    // Step 2: Extract and validate structure
    let token = '';
    let fieldLines: string[] = [];
    let foundOpen = false;
    let foundClose = false;

    for (const line of lines) {
      if (!foundOpen) {
        const openMatch = line.match(CR_OPEN_REGEX);
        if (openMatch) {
          token = openMatch[1];
          foundOpen = true;
          continue;
        }
      } else if (line === CR_CLOSE_TAG) {
        foundClose = true;
        break;
      } else {
        // Check for nested CR-block
        if (CR_OPEN_REGEX.test(line)) {
          return {
            success: false,
            error: 'Nested CR-blocks are forbidden'
          };
        }

        // Check for emoji
        if (containsEmoji(line)) {
          return {
            success: false,
            error: 'Emoji characters are forbidden inside CR-blocks'
          };
        }

        fieldLines.push(line);
      }
    }

    if (!foundOpen) {
      return {
        success: false,
        error: 'No CR-block opening tag [CR/<TOKEN>] found'
      };
    }

    if (!foundClose) {
      return {
        success: false,
        error: 'Missing closing [/CR] tag'
      };
    }

    // Step 3: Parse fields
    const fields = parseFields(fieldLines);

    // Step 4 & 5: Sort and serialize
    const block: CRBlock = { token, fields };
    const canonical = toCanonicalJSON(block);

    return {
      success: true,
      canonical,
      json: { _token: token, ...sortFields(fields) }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// 7. ACCEPTANCE TESTS
// ============================================

/**
 * Run acceptance tests for canonicalization.
 *
 * Test 1: Same CR with different formatting → identical canonical JSON
 * Test 2: Field value changes → different canonical JSON
 */
export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Same CR with different formatting → identical canonical JSON
  const crFormat1 = `
[CR/TEST]
name=TestEntity
type=example
version=1.0
[/CR]
`;

  const crFormat2 = `[CR/TEST]
version=1.0
type=example
name=TestEntity
[/CR]`;

  const crFormat3 = `

  [CR/TEST]
  name=TestEntity

  type=example
  version=1.0

  [/CR]

`;

  const result1 = canonicalize(crFormat1);
  const result2 = canonicalize(crFormat2);
  const result3 = canonicalize(crFormat3);

  if (result1.canonical === result2.canonical && result2.canonical === result3.canonical) {
    results.push('PASS: Test 1 - Same CR with different formatting → identical canonical JSON');
  } else {
    results.push('FAIL: Test 1 - Different formatting produced different canonical JSON');
    results.push(`  Format1: ${result1.canonical}`);
    results.push(`  Format2: ${result2.canonical}`);
    results.push(`  Format3: ${result3.canonical}`);
    allPassed = false;
  }

  // Test 2: Field value changes → different canonical JSON
  const crValueA = `
[CR/TEST]
name=EntityA
type=example
[/CR]
`;

  const crValueB = `
[CR/TEST]
name=EntityB
type=example
[/CR]
`;

  const resultA = canonicalize(crValueA);
  const resultB = canonicalize(crValueB);

  if (resultA.canonical !== resultB.canonical) {
    results.push('PASS: Test 2 - Field value changes → different canonical JSON');
  } else {
    results.push('FAIL: Test 2 - Different values produced same canonical JSON');
    allPassed = false;
  }

  // Test 3: Emoji rejection
  const crWithEmoji = `
[CR/TEST]
name=Test 🚀
[/CR]
`;

  const emojiResult = canonicalize(crWithEmoji);
  if (!emojiResult.success && emojiResult.error?.includes('Emoji')) {
    results.push('PASS: Test 3 - Emoji inside block rejected');
  } else {
    results.push('FAIL: Test 3 - Emoji was not rejected');
    allPassed = false;
  }

  // Test 4: Missing closing tag rejection
  const crNoClose = `
[CR/TEST]
name=Test
`;

  const noCloseResult = canonicalize(crNoClose);
  if (!noCloseResult.success && noCloseResult.error?.includes('closing')) {
    results.push('PASS: Test 4 - Missing closing tag rejected');
  } else {
    results.push('FAIL: Test 4 - Missing closing tag was not rejected');
    allPassed = false;
  }

  // Test 5: Nested CR-block rejection
  const crNested = `
[CR/OUTER]
name=Outer
[CR/INNER]
name=Inner
[/CR]
[/CR]
`;

  const nestedResult = canonicalize(crNested);
  if (!nestedResult.success && nestedResult.error?.includes('Nested')) {
    results.push('PASS: Test 5 - Nested CR-block rejected');
  } else {
    results.push('FAIL: Test 5 - Nested CR-block was not rejected');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER (for testing)
// ============================================

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup Canonicalization - Acceptance Tests\n');
  console.log('='.repeat(50));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(50));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example usage
  console.log('\n\nExample Canonicalization:');
  console.log('-'.repeat(50));

  const exampleCR = `
[CR/BINANCE]
schema=CR1.0
version=1.0
type=exchange
name=Binance
trading_fee=0.1%
leverage_max=125
kyc_required=true
tags=["cex","spot","futures"]
[/CR]
`;

  const result = canonicalize(exampleCR);
  console.log('Input CR-block:');
  console.log(exampleCR);
  console.log('Canonical JSON:');
  console.log(result.canonical);
}
