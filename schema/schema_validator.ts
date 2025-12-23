/**
 * CR-Markup Protocol v1.0 - JSON Schema Validator
 *
 * This module validates CR-block JSON against cr.schema.json.
 * Implements hard-fail semantics as specified in spec.md.
 *
 * Reference: /schema/cr.schema.json, /schema/spec.md
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================
// SCHEMA LOADING
// ============================================

const SCHEMA_PATH = join(__dirname, 'cr.schema.json');

let schemaCache: CRSchema | null = null;

interface CRSchema {
  required: string[];
  properties: Record<string, PropertySchema>;
  patternProperties?: Record<string, unknown>;
  additionalProperties: boolean;
}

interface PropertySchema {
  type?: string | string[];
  const?: string;
  pattern?: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  format?: string;
}

function loadSchema(): CRSchema {
  if (schemaCache) return schemaCache;

  const content = readFileSync(SCHEMA_PATH, 'utf8');
  schemaCache = JSON.parse(content);
  return schemaCache!;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates a value against a type specification.
 */
function validateType(value: unknown, typeSpec: string | string[]): boolean {
  const types = Array.isArray(typeSpec) ? typeSpec : [typeSpec];

  for (const type of types) {
    switch (type) {
      case 'string':
        if (typeof value === 'string') return true;
        break;
      case 'number':
        if (typeof value === 'number') return true;
        break;
      case 'integer':
        if (typeof value === 'number' && Number.isInteger(value)) return true;
        break;
      case 'boolean':
        if (typeof value === 'boolean') return true;
        break;
      case 'array':
        if (Array.isArray(value)) return true;
        break;
      case 'object':
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) return true;
        break;
    }
  }

  return false;
}

/**
 * Validates a value against a regex pattern.
 */
function validatePattern(value: string, pattern: string): boolean {
  const regex = new RegExp(pattern);
  return regex.test(value);
}

/**
 * Validates a CR-block JSON object against the schema.
 */
export function validateCRBlock(data: Record<string, unknown>): ValidationResult {
  const schema = loadSchema();
  const errors: ValidationError[] = [];

  // 1. Check required fields
  for (const field of schema.required) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push({
        field,
        message: `Missing required field: ${field}`
      });
    }
  }

  // 2. Validate each field
  for (const [key, value] of Object.entries(data)) {
    const propSchema = schema.properties[key];

    // Check if field is allowed
    if (!propSchema) {
      // Check pattern properties (x_ prefix extensions)
      const isExtension = /^x_[a-z][a-z0-9_]*$/.test(key);

      if (!isExtension && schema.additionalProperties === false) {
        errors.push({
          field: key,
          message: `Unknown field not allowed: ${key}`,
          value
        });
      }
      continue;
    }

    // Type validation
    if (propSchema.type && !validateType(value, propSchema.type)) {
      errors.push({
        field: key,
        message: `Invalid type for ${key}: expected ${JSON.stringify(propSchema.type)}, got ${typeof value}`,
        value
      });
      continue;
    }

    // Const validation
    if (propSchema.const !== undefined && value !== propSchema.const) {
      errors.push({
        field: key,
        message: `Invalid value for ${key}: must be exactly "${propSchema.const}"`,
        value
      });
    }

    // Pattern validation (for strings)
    if (propSchema.pattern && typeof value === 'string') {
      if (!validatePattern(value, propSchema.pattern)) {
        errors.push({
          field: key,
          message: `Invalid format for ${key}: does not match pattern ${propSchema.pattern}`,
          value
        });
      }
    }

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value as string)) {
      errors.push({
        field: key,
        message: `Invalid value for ${key}: must be one of ${JSON.stringify(propSchema.enum)}`,
        value
      });
    }

    // String length validation
    if (typeof value === 'string') {
      if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
        errors.push({
          field: key,
          message: `String too short for ${key}: minimum length is ${propSchema.minLength}`,
          value
        });
      }
      if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
        errors.push({
          field: key,
          message: `String too long for ${key}: maximum length is ${propSchema.maxLength}`,
          value
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// ACCEPTANCE TESTS
// ============================================

export function runAcceptanceTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Test 1: Valid CR → passes schema
  const validCR = {
    _token: "BINANCE",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "exchange",
    network: "multi",
    name: "Binance",
    status: "active",
    kyc_required: true,
    leverage_max: 125
  };

  const validResult = validateCRBlock(validCR);
  if (validResult.valid) {
    results.push('PASS: Test 1 - Valid CR passes schema');
  } else {
    results.push('FAIL: Test 1 - Valid CR should pass');
    results.push(`       Errors: ${JSON.stringify(validResult.errors)}`);
    allPassed = false;
  }

  // Test 2: Missing required field → hard fail
  const missingFieldCR = {
    _token: "TEST",
    schema: "CR1.0",
    version: "1.0",
    // canonical_hash missing!
    type: "exchange",
    network: "ethereum"
  };

  const missingResult = validateCRBlock(missingFieldCR);
  if (!missingResult.valid && missingResult.errors.some(e => e.field === 'canonical_hash')) {
    results.push('PASS: Test 2 - Missing required field rejected');
  } else {
    results.push('FAIL: Test 2 - Missing field should fail');
    allPassed = false;
  }

  // Test 3: Extra forbidden field → hard fail
  const extraFieldCR = {
    _token: "TEST",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "exchange",
    network: "ethereum",
    forbidden_field: "should not be allowed"
  };

  const extraResult = validateCRBlock(extraFieldCR);
  if (!extraResult.valid && extraResult.errors.some(e => e.field === 'forbidden_field')) {
    results.push('PASS: Test 3 - Extra forbidden field rejected');
  } else {
    results.push('FAIL: Test 3 - Extra field should fail');
    allPassed = false;
  }

  // Test 4: Extension fields (x_ prefix) allowed
  const extensionCR = {
    _token: "TEST",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "exchange",
    network: "ethereum",
    x_custom_field: "this is allowed"
  };

  const extensionResult = validateCRBlock(extensionCR);
  if (extensionResult.valid) {
    results.push('PASS: Test 4 - Extension fields (x_ prefix) allowed');
  } else {
    results.push('FAIL: Test 4 - Extension fields should be allowed');
    results.push(`       Errors: ${JSON.stringify(extensionResult.errors)}`);
    allPassed = false;
  }

  // Test 5: Invalid schema version → hard fail
  const wrongSchemaCR = {
    _token: "TEST",
    schema: "CR2.0",  // Wrong!
    version: "1.0",
    canonical_hash: "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "exchange",
    network: "ethereum"
  };

  const wrongSchemaResult = validateCRBlock(wrongSchemaCR);
  if (!wrongSchemaResult.valid && wrongSchemaResult.errors.some(e => e.field === 'schema')) {
    results.push('PASS: Test 5 - Invalid schema version rejected');
  } else {
    results.push('FAIL: Test 5 - Wrong schema version should fail');
    allPassed = false;
  }

  // Test 6: Invalid hash format → hard fail
  const badHashCR = {
    _token: "TEST",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "md5:invalidhash",  // Wrong format!
    type: "exchange",
    network: "ethereum"
  };

  const badHashResult = validateCRBlock(badHashCR);
  if (!badHashResult.valid && badHashResult.errors.some(e => e.field === 'canonical_hash')) {
    results.push('PASS: Test 6 - Invalid hash format rejected');
  } else {
    results.push('FAIL: Test 6 - Invalid hash should fail');
    allPassed = false;
  }

  // Test 7: Invalid status enum → hard fail
  const badStatusCR = {
    _token: "TEST",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    type: "exchange",
    network: "ethereum",
    status: "invalid_status"  // Not in enum!
  };

  const badStatusResult = validateCRBlock(badStatusCR);
  if (!badStatusResult.valid && badStatusResult.errors.some(e => e.field === 'status')) {
    results.push('PASS: Test 7 - Invalid status enum rejected');
  } else {
    results.push('FAIL: Test 7 - Invalid status should fail');
    allPassed = false;
  }

  return { passed: allPassed, results };
}

// ============================================
// CLI RUNNER
// ============================================

if (typeof require !== 'undefined' && require.main === module) {
  console.log('CR-Markup JSON Schema Validator - Acceptance Tests\n');
  console.log('='.repeat(60));

  const { passed, results } = runAcceptanceTests();

  for (const result of results) {
    console.log(result);
  }

  console.log('='.repeat(60));
  console.log(`\nOverall: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Example validation
  console.log('\n\nExample Validation:');
  console.log('-'.repeat(60));

  const exampleCR = {
    _token: "BINANCE",
    schema: "CR1.0",
    version: "1.0",
    canonical_hash: "sha256:f3aa7da7388a10ac25d6e57f6539a9dea2ea750fc9016763bb19e1e651b0d1b9",
    type: "exchange",
    subtype: "cex",
    network: "multi",
    name: "Binance",
    status: "active",
    kyc_required: true,
    leverage_max: 125,
    trading_fee_maker: "0.1%",
    trading_fee_taker: "0.1%",
    tags: ["cex", "spot", "futures"]
  };

  console.log('Input:');
  console.log(JSON.stringify(exampleCR, null, 2));

  const result = validateCRBlock(exampleCR);
  console.log('\nValidation Result:');
  console.log(`Valid: ${result.valid}`);
  if (result.errors.length > 0) {
    console.log('Errors:', result.errors);
  }
}
