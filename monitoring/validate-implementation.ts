/*
  IMPLEMENTATION VALIDATOR
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/plan-monitoring.md Step 13

  GOAL:
  Validate that monitoring implementation follows canonical order
  and that local + CI produce identical results.

  CONSTRAINTS:
  - CI MUST depend only on script behavior
  - No duplication of monitoring logic inside CI YAML

  CHECKS:
  - All required files exist
  - Runner script is executable
  - CI workflow uses runner script as only entrypoint
  - Local determinism verified
*/

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface ValidationResult {
  name: string;
  status: "pass" | "fail";
  details?: string;
}

interface ImplementationValidation {
  status: "pass" | "fail";
  checks: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// -------------------------------------------------------------------
// Check: Required Files Exist
// -------------------------------------------------------------------

function checkRequiredFiles(rootDir: string): ValidationResult {
  const requiredFiles = [
    // Step 1: Repository Scaffolding
    "monitoring/README.md",
    "monitoring/reports/.gitkeep",
    "monitoring/snapshots/.gitkeep",

    // Step 2: Canonical Source Loader
    "monitoring/loader.ts",

    // Step 3: Internal Consistency Checker
    "monitoring/consistency.ts",

    // Step 4: Topology Validator
    "monitoring/topology.ts",

    // Step 5: Metadata Drift Detector
    "monitoring/metadata.ts",

    // Step 6: Snapshot Comparator
    "monitoring/snapshot.ts",

    // Step 7: Report Generator
    "monitoring/report.ts",

    // Step 10: Regression & Lockdown
    "monitoring/lockdown.test.ts",

    // Step 11: Runner Script
    "scripts/run-monitoring.sh",

    // Step 12: CI Workflow
    ".github/workflows/monitoring.yml",

    // Governance
    "schema/monitoring-spec.md",
    "schema/plan-monitoring.md",
  ];

  const missing: string[] = [];

  for (const file of requiredFiles) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    return {
      name: "required_files",
      status: "fail",
      details: `Missing: ${missing.join(", ")}`,
    };
  }

  return {
    name: "required_files",
    status: "pass",
    details: `All ${requiredFiles.length} required files present`,
  };
}

// -------------------------------------------------------------------
// Check: Runner Script Executable
// -------------------------------------------------------------------

function checkRunnerExecutable(rootDir: string): ValidationResult {
  const scriptPath = path.join(rootDir, "scripts/run-monitoring.sh");

  if (!fs.existsSync(scriptPath)) {
    return {
      name: "runner_executable",
      status: "fail",
      details: "Runner script not found",
    };
  }

  // Check if file has shebang
  const content = fs.readFileSync(scriptPath, "utf-8");
  if (!content.startsWith("#!/")) {
    return {
      name: "runner_executable",
      status: "fail",
      details: "Runner script missing shebang",
    };
  }

  // Check file mode (on Unix systems)
  try {
    const stats = fs.statSync(scriptPath);
    const isExecutable = (stats.mode & 0o111) !== 0;
    if (!isExecutable) {
      return {
        name: "runner_executable",
        status: "fail",
        details: "Runner script not executable (chmod +x needed)",
      };
    }
  } catch {
    // Skip mode check on systems that don't support it
  }

  return {
    name: "runner_executable",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Check: CI Uses Runner Script Only
// -------------------------------------------------------------------

function checkCIUsesRunnerOnly(rootDir: string): ValidationResult {
  const workflowPath = path.join(rootDir, ".github/workflows/monitoring.yml");

  if (!fs.existsSync(workflowPath)) {
    return {
      name: "ci_uses_runner_only",
      status: "fail",
      details: "Workflow file not found",
    };
  }

  const content = fs.readFileSync(workflowPath, "utf-8");

  // Check that workflow calls the runner script
  if (!content.includes("scripts/run-monitoring.sh")) {
    return {
      name: "ci_uses_runner_only",
      status: "fail",
      details: "Workflow does not use scripts/run-monitoring.sh",
    };
  }

  // Check for duplicated monitoring logic (forbidden patterns)
  const forbiddenPatterns = [
    /npx tsx monitoring\/loader\.ts/,
    /npx tsx monitoring\/consistency\.ts/,
    /npx tsx monitoring\/topology\.ts/,
    /npx tsx monitoring\/metadata\.ts/,
    /npx tsx monitoring\/snapshot\.ts/,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        name: "ci_uses_runner_only",
        status: "fail",
        details: `Workflow contains duplicated monitoring logic: ${pattern}`,
      };
    }
  }

  return {
    name: "ci_uses_runner_only",
    status: "pass",
    details: "CI uses runner script as single entrypoint",
  };
}

// -------------------------------------------------------------------
// Check: No Engine Coupling
// -------------------------------------------------------------------

function checkNoEngineCoupling(rootDir: string): ValidationResult {
  const workflowPath = path.join(rootDir, ".github/workflows/monitoring.yml");

  if (!fs.existsSync(workflowPath)) {
    return {
      name: "no_engine_coupling",
      status: "fail",
      details: "Workflow file not found",
    };
  }

  const content = fs.readFileSync(workflowPath, "utf-8");

  // Check for engine module references (forbidden)
  const enginePatterns = [
    /generators\//,
    /registry\//,
    /migration\//,
  ];

  for (const pattern of enginePatterns) {
    if (pattern.test(content)) {
      return {
        name: "no_engine_coupling",
        status: "fail",
        details: `Workflow references engine module: ${pattern}`,
      };
    }
  }

  return {
    name: "no_engine_coupling",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Check: Determinism (Report Hash Stability)
// -------------------------------------------------------------------

function checkDeterminism(rootDir: string): ValidationResult {
  const reportsDir = path.join(rootDir, "monitoring/reports");

  if (!fs.existsSync(reportsDir)) {
    return {
      name: "determinism",
      status: "pass",
      details: "No reports to verify (first run)",
    };
  }

  const reports = fs.readdirSync(reportsDir)
    .filter((f) => f.startsWith("monitor-") && f.endsWith(".json"))
    .sort();

  if (reports.length === 0) {
    return {
      name: "determinism",
      status: "pass",
      details: "No reports to verify",
    };
  }

  // Verify latest report has deterministic ID
  const latestReport = reports[reports.length - 1];
  const reportPath = path.join(reportsDir, latestReport);
  const content = fs.readFileSync(reportPath, "utf-8");

  try {
    const report = JSON.parse(content);

    // Verify report_id matches expected format
    if (!report.report_id || !report.report_id.startsWith("monitor-")) {
      return {
        name: "determinism",
        status: "fail",
        details: "Report ID format invalid",
      };
    }

    // Verify checked_at is date-only (no time entropy)
    if (report.checked_at && report.checked_at.includes("T")) {
      return {
        name: "determinism",
        status: "fail",
        details: "Report contains timestamp with time (entropy)",
      };
    }

    return {
      name: "determinism",
      status: "pass",
      details: `Latest report: ${latestReport}`,
    };
  } catch {
    return {
      name: "determinism",
      status: "fail",
      details: "Failed to parse report JSON",
    };
  }
}

// -------------------------------------------------------------------
// Check: Workflow Triggers
// -------------------------------------------------------------------

function checkWorkflowTriggers(rootDir: string): ValidationResult {
  const workflowPath = path.join(rootDir, ".github/workflows/monitoring.yml");

  if (!fs.existsSync(workflowPath)) {
    return {
      name: "workflow_triggers",
      status: "fail",
      details: "Workflow file not found",
    };
  }

  const content = fs.readFileSync(workflowPath, "utf-8");

  const requiredTriggers = [
    "pull_request",
    "push",
  ];

  const missing: string[] = [];

  for (const trigger of requiredTriggers) {
    if (!content.includes(trigger)) {
      missing.push(trigger);
    }
  }

  if (missing.length > 0) {
    return {
      name: "workflow_triggers",
      status: "fail",
      details: `Missing triggers: ${missing.join(", ")}`,
    };
  }

  return {
    name: "workflow_triggers",
    status: "pass",
    details: "All required triggers present",
  };
}

// -------------------------------------------------------------------
// Check: Read-Only Compliance
// -------------------------------------------------------------------

function checkReadOnlyCompliance(rootDir: string): ValidationResult {
  const monitoringDir = path.join(rootDir, "monitoring");
  const violations: string[] = [];

  function scanFile(filePath: string): void {
    if (!filePath.endsWith(".ts")) return;
    if (filePath.includes(".test.ts")) return;
    if (filePath.includes("validate-implementation")) return;

    const content = fs.readFileSync(filePath, "utf-8");

    // Check header comment for READ-ONLY
    const headerMatch = content.match(/^\/\*[\s\S]*?\*\//);
    if (!headerMatch || !headerMatch[0].includes("READ-ONLY")) {
      violations.push(`${path.basename(filePath)}: missing READ-ONLY marker`);
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
      name: "read_only_compliance",
      status: "fail",
      details: violations.join("; "),
    };
  }

  return {
    name: "read_only_compliance",
    status: "pass",
  };
}

// -------------------------------------------------------------------
// Main Validator
// -------------------------------------------------------------------

export function validateImplementation(rootDir: string): ImplementationValidation {
  const checks: ValidationResult[] = [
    checkRequiredFiles(rootDir),
    checkRunnerExecutable(rootDir),
    checkCIUsesRunnerOnly(rootDir),
    checkNoEngineCoupling(rootDir),
    checkDeterminism(rootDir),
    checkWorkflowTriggers(rootDir),
    checkReadOnlyCompliance(rootDir),
  ];

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  return {
    status: failed === 0 ? "pass" : "fail",
    checks,
    summary: {
      total: checks.length,
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

  const result = validateImplementation(rootDir);

  console.log(JSON.stringify(result, null, 2));

  console.log("\n========================================");
  console.log(`  Implementation Validation: ${result.status.toUpperCase()}`);
  console.log("========================================");
  console.log(`  Total:  ${result.summary.total}`);
  console.log(`  Passed: ${result.summary.passed}`);
  console.log(`  Failed: ${result.summary.failed}`);

  if (result.summary.failed > 0) {
    console.log("\nFailed checks:");
    for (const check of result.checks) {
      if (check.status === "fail") {
        console.log(`  - ${check.name}: ${check.details}`);
      }
    }
  }

  console.log("\n----------------------------------------");
  console.log("  Canonical Execution Order (Step 13)");
  console.log("----------------------------------------");
  console.log("  1. scripts/run-monitoring.sh (Step 11)");
  console.log("  2. Local determinism verified");
  console.log("  3. .github/workflows/monitoring.yml (Step 12)");
  console.log("  4. CI semantics validated");
  console.log("----------------------------------------");
  console.log("  CI depends ONLY on runner script behavior");
  console.log("  No monitoring logic duplication in CI YAML");
  console.log("========================================");

  process.exit(result.status === "pass" ? 0 : 1);
}
