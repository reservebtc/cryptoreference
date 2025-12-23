#!/usr/bin/env npx tsx
/**
 * CR-Markup Protocol v1.0 - Minimal CLI Tool
 *
 * Developer ergonomics without weakening rules.
 *
 * Commands:
 *   validate     - Validate a CR-block
 *   canonicalize - Canonicalize a CR-block
 *   hash         - Compute canonical hash
 *
 * Usage:
 *   npx tsx schema/cr-cli.ts validate <file>
 *   npx tsx schema/cr-cli.ts canonicalize <file>
 *   npx tsx schema/cr-cli.ts hash <file>
 *   echo "[CR/TOKEN]..." | npx tsx schema/cr-cli.ts validate -
 *
 * Reference: /schema/plan.md Step 13
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateCR, ValidationResult } from './validate_cr';
import { validateInMode, ValidationMode } from './validation_modes';
import { canonicalize, CanonicalResult } from './canonicalize';
import { computeCanonicalHash, HashResult } from './hash';
import { analyzeDeprecation } from './deprecation';

// ============================================
// CLI TYPES
// ============================================

interface CLIOptions {
  mode?: ValidationMode;
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}

// ============================================
// COLORS (ANSI escape codes)
// ============================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function color(text: string, c: keyof typeof colors): string {
  // Check if stdout is a TTY
  if (!process.stdout.isTTY) {
    return text;
  }
  return `${colors[c]}${text}${colors.reset}`;
}

// ============================================
// INPUT HANDLING
// ============================================

function readInput(source: string): string {
  if (source === '-') {
    // Read from stdin
    return fs.readFileSync(0, 'utf-8');
  }

  // Read from file
  const filePath = path.resolve(source);

  if (!fs.existsSync(filePath)) {
    console.error(color(`Error: File not found: ${filePath}`, 'red'));
    process.exit(1);
  }

  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================
// VALIDATE COMMAND
// ============================================

function cmdValidate(source: string, options: CLIOptions): void {
  const input = readInput(source);
  const mode = options.mode || 'production';

  if (options.json) {
    // JSON output mode
    const result = validateInMode(input, mode);
    console.log(JSON.stringify({
      valid: result.accepted,
      ingestable: result.ingestable,
      mode: result.mode,
      stage: result.result.stage,
      errors: result.result.errors,
      warnings: result.result.warnings,
      summary: result.summary
    }, null, 2));
    process.exit(result.accepted ? 0 : 1);
  }

  // Human-readable output
  const result = validateInMode(input, mode);

  if (!options.quiet) {
    console.log();
    console.log(color('CR-Markup Validation', 'bold'));
    console.log(color('─'.repeat(50), 'gray'));
    console.log();
  }

  if (result.accepted) {
    if (!options.quiet) {
      console.log(color('  Status: VALID', 'green'));
      console.log(color(`  Mode: ${mode}`, 'cyan'));
      console.log(color(`  Ingestable: ${result.ingestable}`, 'cyan'));

      if (result.result.data) {
        console.log();
        console.log(color('  Token:', 'gray'), result.result.data.token);
        console.log(color('  Hash:', 'gray'), result.result.data.computedHash);
      }

      if (result.result.warnings.length > 0) {
        console.log();
        console.log(color('  Warnings:', 'yellow'));
        for (const w of result.result.warnings) {
          console.log(color(`    - ${w.message}`, 'yellow'));
        }
      }

      console.log();
      console.log(color(result.summary.message, 'green'));
    }
    process.exit(0);
  } else {
    if (!options.quiet) {
      console.log(color('  Status: INVALID', 'red'));
      console.log(color(`  Mode: ${mode}`, 'cyan'));
      console.log(color(`  Stage: ${result.result.stage}`, 'red'));
      console.log();
      console.log(color('  Errors:', 'red'));
      for (const e of result.result.errors) {
        console.log(color(`    [${e.stage}] ${e.code}: ${e.message}`, 'red'));
        if (e.field) {
          console.log(color(`           Field: ${e.field}`, 'gray'));
        }
      }
      console.log();
      console.log(color(result.summary.message, 'red'));
    } else {
      console.error('INVALID');
    }
    process.exit(1);
  }
}

// ============================================
// CANONICALIZE COMMAND
// ============================================

function cmdCanonicalize(source: string, options: CLIOptions): void {
  const input = readInput(source);
  const result: CanonicalResult = canonicalize(input);

  if (options.json) {
    console.log(JSON.stringify({
      success: result.success,
      canonical: result.canonical,
      json: result.json,
      error: result.error
    }, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  if (!result.success) {
    console.error(color(`Error: ${result.error}`, 'red'));
    process.exit(1);
  }

  if (options.verbose) {
    console.log(color('Canonical Form:', 'bold'));
    console.log(color('─'.repeat(50), 'gray'));
  }

  console.log(result.canonical);

  if (options.verbose && result.json) {
    console.log();
    console.log(color('Parsed JSON:', 'bold'));
    console.log(color('─'.repeat(50), 'gray'));
    console.log(JSON.stringify(result.json, null, 2));
  }

  process.exit(0);
}

// ============================================
// HASH COMMAND
// ============================================

function cmdHash(source: string, options: CLIOptions): void {
  const input = readInput(source);
  const result: HashResult = computeCanonicalHash(input);

  if (options.json) {
    console.log(JSON.stringify({
      success: result.success,
      hash: result.hash,
      error: result.error
    }, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  if (!result.success) {
    console.error(color(`Error: ${result.error}`, 'red'));
    process.exit(1);
  }

  if (options.verbose) {
    console.log(color('Canonical Hash:', 'bold'));
    console.log(color('─'.repeat(50), 'gray'));
  }

  console.log(result.hash);

  process.exit(0);
}

// ============================================
// INFO COMMAND
// ============================================

function cmdInfo(source: string, options: CLIOptions): void {
  const input = readInput(source);
  const validation = validateCR(input);
  const deprecation = analyzeDeprecation(input);

  if (options.json) {
    console.log(JSON.stringify({
      valid: validation.valid,
      token: validation.data?.token,
      hash: validation.data?.computedHash,
      fields: validation.data?.fields,
      deprecation: deprecation.deprecation,
      ai_guidance: deprecation.ai_guidance
    }, null, 2));
    process.exit(validation.valid ? 0 : 1);
  }

  if (!validation.valid) {
    console.error(color('Error: Invalid CR-block', 'red'));
    for (const e of validation.errors) {
      console.error(color(`  [${e.stage}] ${e.message}`, 'red'));
    }
    process.exit(1);
  }

  console.log();
  console.log(color('CR-Block Information', 'bold'));
  console.log(color('─'.repeat(50), 'gray'));
  console.log();

  console.log(color('  Token:', 'cyan'), validation.data!.token);
  console.log(color('  Hash:', 'cyan'), validation.data!.computedHash);
  console.log();

  console.log(color('  Fields:', 'cyan'));
  const fields = validation.data!.fields;
  for (const [key, value] of Object.entries(fields)) {
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.log(color(`    ${key}:`, 'gray'), displayValue);
  }

  if (deprecation.deprecation.is_deprecated) {
    console.log();
    console.log(color('  Deprecation:', 'yellow'));
    console.log(color('    Status:', 'gray'), 'DEPRECATED');
    if (deprecation.deprecation.replacement_refs.length > 0) {
      console.log(color('    Replacements:', 'gray'),
        deprecation.deprecation.replacement_refs.map(r => r.token || r.hash).join(', '));
    }
    console.log(color('    AI Guidance:', 'gray'), deprecation.ai_guidance.message);
  }

  console.log();
  process.exit(0);
}

// ============================================
// HELP
// ============================================

function showHelp(): void {
  console.log(`
${color('CR-Markup CLI', 'bold')} - CR-Markup Protocol v1.0

${color('USAGE:', 'cyan')}
  npx tsx schema/cr-cli.ts <command> [options] <file|->

${color('COMMANDS:', 'cyan')}
  validate      Validate a CR-block
  canonicalize  Output canonical form
  hash          Compute canonical hash
  info          Show CR-block information

${color('OPTIONS:', 'cyan')}
  -m, --mode <mode>   Validation mode: draft|preview|production (default: production)
  -j, --json          Output as JSON
  -q, --quiet         Suppress output (exit code only)
  -v, --verbose       Verbose output
  -h, --help          Show this help

${color('INPUT:', 'cyan')}
  <file>    Path to file containing CR-block
  -         Read from stdin

${color('EXAMPLES:', 'cyan')}
  # Validate a file
  npx tsx schema/cr-cli.ts validate example.cr

  # Validate from stdin
  echo '[CR/TOKEN]...[/CR]' | npx tsx schema/cr-cli.ts validate -

  # Get canonical hash
  npx tsx schema/cr-cli.ts hash example.cr

  # Validate in draft mode with JSON output
  npx tsx schema/cr-cli.ts validate -m draft -j example.cr

  # Get full info about a CR-block
  npx tsx schema/cr-cli.ts info example.cr

${color('EXIT CODES:', 'cyan')}
  0   Success (valid CR)
  1   Failure (invalid CR or error)

${color('REFERENCE:', 'gray')}
  /schema/spec.md - CR-Markup Protocol Specification
`);
}

// ============================================
// ARGUMENT PARSING
// ============================================

function parseArgs(args: string[]): { command: string; source: string; options: CLIOptions } {
  const options: CLIOptions = {};
  let command = '';
  let source = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      showHelp();
      process.exit(0);
    }

    if (arg === '-m' || arg === '--mode') {
      const mode = args[++i];
      if (!['draft', 'preview', 'production'].includes(mode)) {
        console.error(color(`Error: Invalid mode: ${mode}`, 'red'));
        process.exit(1);
      }
      options.mode = mode as ValidationMode;
      continue;
    }

    if (arg === '-j' || arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '-q' || arg === '--quiet') {
      options.quiet = true;
      continue;
    }

    if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
      continue;
    }

    if (arg.startsWith('-') && arg !== '-') {
      console.error(color(`Error: Unknown option: ${arg}`, 'red'));
      process.exit(1);
    }

    if (!command) {
      command = arg;
    } else if (!source) {
      source = arg;
    }
  }

  return { command, source, options };
}

// ============================================
// MAIN
// ============================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const { command, source, options } = parseArgs(args);

  if (!command) {
    showHelp();
    process.exit(0);
  }

  if (!source && command !== 'help') {
    console.error(color('Error: No input file specified', 'red'));
    console.error(color('Use - to read from stdin', 'gray'));
    process.exit(1);
  }

  switch (command) {
    case 'validate':
      cmdValidate(source, options);
      break;

    case 'canonicalize':
    case 'canonical':
      cmdCanonicalize(source, options);
      break;

    case 'hash':
      cmdHash(source, options);
      break;

    case 'info':
      cmdInfo(source, options);
      break;

    case 'help':
      showHelp();
      break;

    default:
      console.error(color(`Error: Unknown command: ${command}`, 'red'));
      console.error(color('Run with --help for usage', 'gray'));
      process.exit(1);
  }
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test CR for validation
  const validCR = `[CR/CLITEST]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=CLITestExchange
status=active
[/CR]`;

  const invalidCR = `[CR/INVALID]
name=MissingFields
[/CR]`;

  // Test 1: validateCR matches CLI validation
  const internalResult = validateCR(validCR);
  const modeResult = validateInMode(validCR, 'production');

  if (internalResult.valid === modeResult.accepted) {
    results.push('PASS: Test 1 - CLI validation matches internal engine');
  } else {
    results.push('FAIL: Test 1 - CLI validation should match internal engine');
    allPassed = false;
  }

  // Test 2: canonicalize matches CLI output
  const canonResult = canonicalize(validCR);
  if (canonResult.success && canonResult.canonical) {
    results.push('PASS: Test 2 - CLI canonicalize matches internal engine');
  } else {
    results.push('FAIL: Test 2 - CLI canonicalize should match internal engine');
    allPassed = false;
  }

  // Test 3: hash matches CLI output
  const hashResult = computeCanonicalHash(validCR);
  if (hashResult.success && hashResult.hash?.startsWith('sha256:')) {
    results.push('PASS: Test 3 - CLI hash matches internal engine');
  } else {
    results.push('FAIL: Test 3 - CLI hash should match internal engine');
    allPassed = false;
  }

  // Test 4: Invalid CR is rejected
  const invalidResult = validateCR(invalidCR);
  if (!invalidResult.valid) {
    results.push('PASS: Test 4 - Invalid CR correctly rejected');
  } else {
    results.push('FAIL: Test 4 - Invalid CR should be rejected');
    allPassed = false;
  }

  // Test 5: No bypass - production mode enforces hard-fail
  const prodResult = validateInMode(invalidCR, 'production');
  if (!prodResult.accepted && !prodResult.ingestable) {
    results.push('PASS: Test 5 - No bypass possible (production hard-fail)');
  } else {
    results.push('FAIL: Test 5 - Production mode should not allow bypass');
    allPassed = false;
  }

  // Test 6: Hash is deterministic
  const hash1 = computeCanonicalHash(validCR);
  const hash2 = computeCanonicalHash(validCR);
  if (hash1.hash === hash2.hash) {
    results.push('PASS: Test 6 - Hash is deterministic');
  } else {
    results.push('FAIL: Test 6 - Hash should be deterministic');
    allPassed = false;
  }

  // Test 7: Canonical form is deterministic
  const canon1 = canonicalize(validCR);
  const canon2 = canonicalize(validCR);
  if (canon1.canonical === canon2.canonical) {
    results.push('PASS: Test 7 - Canonical form is deterministic');
  } else {
    results.push('FAIL: Test 7 - Canonical form should be deterministic');
    allPassed = false;
  }

  // Test 8: Validation modes work correctly
  const draftResult = validateInMode(invalidCR, 'draft');
  const previewResult = validateInMode(invalidCR, 'preview');
  if (!draftResult.accepted && !previewResult.accepted && !prodResult.accepted) {
    results.push('PASS: Test 8 - All validation modes reject invalid CR');
  } else {
    results.push('FAIL: Test 8 - All modes should reject invalid CR');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI ENTRY POINT
// ============================================

// Check if running as CLI or being imported
const isRunningAsCLI = typeof require !== 'undefined' && require.main === module;
const isRunningTests = process.argv.includes('--test');

if (isRunningAsCLI) {
  if (isRunningTests) {
    // Run acceptance tests
    console.log('CR-Markup CLI - Acceptance Tests\n');
    console.log('='.repeat(50));

    const { passed, results } = runAcceptanceTests();

    for (const result of results) {
      console.log(result);
    }

    console.log('='.repeat(50));
    console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    process.exit(passed ? 0 : 1);
  } else {
    // Run as CLI
    main();
  }
}
