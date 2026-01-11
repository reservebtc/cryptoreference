/*
  REGRESSION & LOCKDOWN TESTS

  Governed by: /schema/monitoring-spec.md, plan-monitoring.md Step 10

  GOAL:
  Prevent monitoring from evolving into control logic.

  GUARD TESTS:
  - monitoring cannot write outside /monitoring
  - monitoring cannot import engine modules

  HARD RULES:
  - Attempt forbidden write → FAIL
  - Clean run → PASS
*/

import * as fs from "fs";
import * as path from "path";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface TestResult {
  name: string;
  status: "pass" | "fail";
  details?: string;
}

interface LockdownResult {
  status: "pass" | "fail";
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// -------------------------------------------------------------------
// Forbidden Engine Modules
// -------------------------------------------------------------------

const FORBIDDEN_IMPORTS = [
  "generators/",
  "registry/",
  "migration/",
  "schema/canonicalize",
  "schema/hash",
  "schema/validate_cr",
  "schema/schema_validator",
  "schema/forbidden_scan",
  "schema/supersedence",
  "schema/entity_graph",
  "schema/deprecation",
];

// -------------------------------------------------------------------
// Test: No Engine Imports
// -------------------------------------------------------------------

function testNoEngineImports(rootDir: string): TestResult {
  const monitoringDir = path.join(rootDir, "monitoring");
  const violations: string[] = [];

  function scanFile(filePath: string): void {
    if (!filePath.endsWith(".ts")) return;

    const content = fs.readFileSync(filePath, "utf-8");

    for (const forbidden of FORBIDDEN_IMPORTS) {
      // Check import statements
      const importRegex = new RegExp(
        `from\\s+['"].*${forbidden.replace("/", "/")}.*['"]`,
        "g"
      );
      const requireRegex = new RegExp(
        `require\\s*\\(\\s*['"].*${forbidden.replace("/", "/")}.*['"]\\s*\\)`,
        "g"
      );

      if (importRegex.test(content) || requireRegex.test(content)) {
        violations.push(`${filePath}: imports forbidden module "${forbidden}"`);
      }
    }
  }

  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  }

  if (fs.existsSync(monitoringDir)) {
    scanDirectory(monitoringDir);
  }

  if (violations.length > 0) {
    return {
      name: "no_engine_imports",
      status: "fail",
      details: violations.join("\n"),
    };
  }

  return {
    name: "no_engine_imports",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Test: Write Isolation
// -------------------------------------------------------------------

function testWriteIsolation(rootDir: string): TestResult {
  const monitoringDir = path.join(rootDir, "monitoring");
  const violations: string[] = [];

  // Patterns that indicate file writes
  const writePatterns = [
    /fs\.writeFileSync\s*\(/g,
    /fs\.writeFile\s*\(/g,
    /fs\.appendFileSync\s*\(/g,
    /fs\.appendFile\s*\(/g,
    /fs\.mkdirSync\s*\(/g,
    /fs\.mkdir\s*\(/g,
    /fs\.copyFileSync\s*\(/g,
    /fs\.renameSync\s*\(/g,
    /fs\.unlinkSync\s*\(/g,
  ];

  function scanFile(filePath: string): void {
    if (!filePath.endsWith(".ts")) return;
    // Skip this test file itself
    if (filePath.includes("lockdown.test.ts")) return;

    const content = fs.readFileSync(filePath, "utf-8");

    // Valid monitoring path variables
    const validPathVars = [
      "reportPath",
      "snapshotPath",
      "reportsDir",
      "snapshotsDir",
      "monitoringDir",
    ];

    for (const pattern of writePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Check if write is to monitoring directory only
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (pattern.test(line)) {
            // Check if the line uses a valid monitoring path variable
            const usesValidPath =
              line.includes("monitoring") ||
              line.includes('rootDir, "monitoring"') ||
              validPathVars.some((v) => line.includes(v));

            if (!usesValidPath) {
              violations.push(
                `${filePath}:${i + 1}: write operation may target outside /monitoring`
              );
            }
          }
        }
      }
    }
  }

  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  }

  if (fs.existsSync(monitoringDir)) {
    scanDirectory(monitoringDir);
  }

  if (violations.length > 0) {
    return {
      name: "write_isolation",
      status: "fail",
      details: violations.join("\n"),
    };
  }

  return {
    name: "write_isolation",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Test: No Mutation Functions
// -------------------------------------------------------------------

function testNoMutationFunctions(rootDir: string): TestResult {
  const monitoringDir = path.join(rootDir, "monitoring");
  const violations: string[] = [];

  // Patterns that indicate mutation of external state
  const mutationPatterns = [
    /\.push\s*\(\s*[^)]*registry/gi,
    /\.push\s*\(\s*[^)]*dataset/gi,
    /registry\s*=\s*/g,
    /dataset\s*=\s*/g,
    /JSON\.parse\s*\([^)]*\)\s*\.\s*push/g,
  ];

  function scanFile(filePath: string): void {
    if (!filePath.endsWith(".ts")) return;
    // Skip test files
    if (filePath.includes(".test.ts")) return;

    const content = fs.readFileSync(filePath, "utf-8");

    // Check for export of mutation functions
    if (
      content.includes("export function update") ||
      content.includes("export function modify") ||
      content.includes("export function mutate") ||
      content.includes("export function regenerate")
    ) {
      violations.push(`${filePath}: exports mutation function`);
    }
  }

  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  }

  if (fs.existsSync(monitoringDir)) {
    scanDirectory(monitoringDir);
  }

  if (violations.length > 0) {
    return {
      name: "no_mutation_functions",
      status: "fail",
      details: violations.join("\n"),
    };
  }

  return {
    name: "no_mutation_functions",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Test: Monitoring Directory Structure
// -------------------------------------------------------------------

function testDirectoryStructure(rootDir: string): TestResult {
  const requiredPaths = [
    "monitoring/README.md",
    "monitoring/reports",
    "monitoring/snapshots",
    "monitoring/loader.ts",
    "monitoring/consistency.ts",
    "monitoring/topology.ts",
    "monitoring/metadata.ts",
    "monitoring/snapshot.ts",
    "monitoring/report.ts",
  ];

  const missing: string[] = [];

  for (const reqPath of requiredPaths) {
    const fullPath = path.join(rootDir, reqPath);
    if (!fs.existsSync(fullPath)) {
      missing.push(reqPath);
    }
  }

  if (missing.length > 0) {
    return {
      name: "directory_structure",
      status: "fail",
      details: `Missing: ${missing.join(", ")}`,
    };
  }

  return {
    name: "directory_structure",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Test: Read-Only Markers
// -------------------------------------------------------------------

function testReadOnlyMarkers(rootDir: string): TestResult {
  const monitoringDir = path.join(rootDir, "monitoring");
  const violations: string[] = [];

  const requiredMarker = "READ-ONLY";

  function scanFile(filePath: string): void {
    if (!filePath.endsWith(".ts")) return;
    // Skip test files
    if (filePath.includes(".test.ts")) return;

    const content = fs.readFileSync(filePath, "utf-8");

    // Check for READ-ONLY marker in header comment
    const headerMatch = content.match(/^\/\*[\s\S]*?\*\//);
    if (headerMatch) {
      if (!headerMatch[0].includes(requiredMarker)) {
        violations.push(`${filePath}: missing READ-ONLY marker in header`);
      }
    } else {
      violations.push(`${filePath}: missing header comment with READ-ONLY marker`);
    }
  }

  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  }

  if (fs.existsSync(monitoringDir)) {
    scanDirectory(monitoringDir);
  }

  if (violations.length > 0) {
    return {
      name: "read_only_markers",
      status: "fail",
      details: violations.join("\n"),
    };
  }

  return {
    name: "read_only_markers",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Main Runner
// -------------------------------------------------------------------

export function runLockdownTests(rootDir: string): LockdownResult {
  const tests: TestResult[] = [
    testNoEngineImports(rootDir),
    testWriteIsolation(rootDir),
    testNoMutationFunctions(rootDir),
    testDirectoryStructure(rootDir),
    testReadOnlyMarkers(rootDir),
  ];

  const passed = tests.filter((t) => t.status === "pass").length;
  const failed = tests.filter((t) => t.status === "fail").length;

  return {
    status: failed === 0 ? "pass" : "fail",
    tests,
    summary: {
      total: tests.length,
      passed,
      failed,
    },
  };
}

// -------------------------------------------------------------------
// Standalone Execution
// -------------------------------------------------------------------

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();

  const result = runLockdownTests(rootDir);

  console.log(JSON.stringify(result, null, 2));

  // Print summary
  console.log("\n========================================");
  console.log(`  Lockdown Tests: ${result.status.toUpperCase()}`);
  console.log("========================================");
  console.log(`  Total:  ${result.summary.total}`);
  console.log(`  Passed: ${result.summary.passed}`);
  console.log(`  Failed: ${result.summary.failed}`);

  if (result.summary.failed > 0) {
    console.log("\nFailed tests:");
    for (const test of result.tests) {
      if (test.status === "fail") {
        console.log(`  - ${test.name}: ${test.details}`);
      }
    }
  }

  process.exit(result.status === "pass" ? 0 : 1);
}
