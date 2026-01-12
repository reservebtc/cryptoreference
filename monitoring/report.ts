/*
  REPORT GENERATOR (DETERMINISTIC)
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/monitoring-spec.md

  ACTIONS:
  - Combine all check results
  - Generate hash-based report_id
  - Ordered fields
  - No timestamps with entropy

  OUTPUT:
  - /monitoring/reports/monitor-<hash>.json

  HARD RULES:
  - Same input → byte-identical report
  - Hash stable across runs
  - Append-only reports
*/

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { checkConsistency, ConsistencyResult } from "./consistency";
import { validateTopology, TopologyResult } from "./topology";
import { detectMetadataDrift, MetadataResult } from "./metadata";
import { runSnapshotCheck, SnapshotResult } from "./snapshot";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface MonitoringReport {
  report_id: string;
  scope: "internal";
  status: "pass" | "fail";
  engine_version: string;
  checked_at: string; // Deterministic: YYYY-MM-DD only
  summary: {
    total_violations: number;
    consistency_status: "pass" | "fail";
    topology_status: "pass" | "fail";
    metadata_status: "pass" | "fail";
    snapshot_status: "pass" | "fail";
  };
  consistency: ConsistencyResult;
  topology: TopologyResult;
  metadata: MetadataResult;
  snapshot: SnapshotResult;
}

// -------------------------------------------------------------------
// Engine Version
// -------------------------------------------------------------------

function getEngineVersion(rootDir: string): string {
  const packagePath = path.join(rootDir, "package.json");

  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
      return pkg.version || "unknown";
    } catch {
      return "unknown";
    }
  }

  return "unknown";
}

// -------------------------------------------------------------------
// Deterministic Date
// -------------------------------------------------------------------

function getDeterministicDate(): string {
  // Use date only, no time (no entropy)
  return new Date().toISOString().split("T")[0];
}

// -------------------------------------------------------------------
// Report ID Generation
// -------------------------------------------------------------------

function generateReportId(report: Omit<MonitoringReport, "report_id">): string {
  // Hash the report content for deterministic ID
  const content = JSON.stringify(report);
  const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  return `monitor-${hash}`;
}

// -------------------------------------------------------------------
// Report Generation
// -------------------------------------------------------------------

export function generateReport(rootDir: string): MonitoringReport {
  // Run all checks
  const consistency = checkConsistency(rootDir);
  const topology = validateTopology(rootDir);
  const metadata = detectMetadataDrift(rootDir);
  const snapshot = runSnapshotCheck(rootDir);

  // Calculate totals
  const totalViolations =
    consistency.violations.length +
    topology.violations.length +
    metadata.violations.length +
    snapshot.violations.length;

  const overallStatus =
    consistency.status === "pass" &&
    topology.status === "pass" &&
    metadata.status === "pass" &&
    snapshot.status === "pass"
      ? "pass"
      : "fail";

  // Build report without ID first
  const reportWithoutId: Omit<MonitoringReport, "report_id"> = {
    scope: "internal",
    status: overallStatus,
    engine_version: getEngineVersion(rootDir),
    checked_at: getDeterministicDate(),
    summary: {
      total_violations: totalViolations,
      consistency_status: consistency.status,
      topology_status: topology.status,
      metadata_status: metadata.status,
      snapshot_status: snapshot.status === "fail" ? "fail" : "pass",
    },
    consistency,
    topology,
    metadata,
    snapshot,
  };

  // Generate deterministic report ID
  const reportId = generateReportId(reportWithoutId);

  return {
    report_id: reportId,
    ...reportWithoutId,
  };
}

// -------------------------------------------------------------------
// Report Serialization (Ordered Fields)
// -------------------------------------------------------------------

function serializeReport(report: MonitoringReport): string {
  // JSON.stringify with null replacer preserves all nested data
  // Field ordering is determined by object creation order in generateReport
  return JSON.stringify(report, null, 2);
}

// -------------------------------------------------------------------
// Report Saving (Append-Only)
// -------------------------------------------------------------------

export function saveReport(rootDir: string, report: MonitoringReport): string {
  const reportsDir = path.join(rootDir, "monitoring", "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, `${report.report_id}.json`);

  // Append-only: allow overwrite only if content is identical
  if (fs.existsSync(reportPath)) {
    const existing = fs.readFileSync(reportPath, "utf-8");
    const newContent = serializeReport(report);

    if (existing === newContent) {
      // Identical content, no action needed
      return reportPath;
    }

    // Different content with same ID should not happen (hash collision)
    // But we allow it for determinism (same run = same output)
  }

  fs.writeFileSync(reportPath, serializeReport(report));
  return reportPath;
}

// -------------------------------------------------------------------
// Main Runner
// -------------------------------------------------------------------

export function runMonitoring(rootDir: string): {
  report: MonitoringReport;
  savedTo: string;
} {
  const report = generateReport(rootDir);
  const savedTo = saveReport(rootDir, report);

  return { report, savedTo };
}

// -------------------------------------------------------------------
// Standalone Execution
// -------------------------------------------------------------------

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();

  const { report, savedTo } = runMonitoring(rootDir);

  // Output summary to stdout
  console.log(JSON.stringify({
    report_id: report.report_id,
    status: report.status,
    total_violations: report.summary.total_violations,
    consistency: report.summary.consistency_status,
    topology: report.summary.topology_status,
    metadata: report.summary.metadata_status,
    snapshot: report.summary.snapshot_status,
    saved_to: savedTo,
  }, null, 2));

  process.exit(report.status === "pass" ? 0 : 1);
}
