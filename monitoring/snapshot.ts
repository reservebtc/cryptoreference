/*
  SNAPSHOT COMPARATOR
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/monitoring-spec.md

  ACTIONS:
  - Load latest snapshot
  - Byte-compare rendered output + filesystem

  CONSTRAINTS:
  - Append-only snapshots
  - No overwrite

  HARD RULES:
  - Snapshots are immutable once created
  - Divergence detection only
  - No mutation of source files
*/

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// -------------------------------------------------------------------
// Expected Mutation Allowlist (Generation Window Exception)
// -------------------------------------------------------------------

const EXPECTED_MUTATION_PATHS = new Set<string>([
  "public/dataset/registry.json",
  "public/dataset/latest.jsonl",
]);

function isExpectedMutationPath(p: string): boolean {
  // Dataset files are always expected to change during generation
  if (EXPECTED_MUTATION_PATHS.has(p)) return true;

  // Allow mutation ONLY for entity root pages:
  // app/{hub}/{entity}/page.tsx
  //
  // Reason:
  // Entity pages are updated to add child links during generation.
  // Child pages themselves MUST NOT be modified after creation.
  //
  // Examples (allowed):
  // app/exchanges/binance/page.tsx
  // app/dex/hibachi/page.tsx
  // app/cards/etherfi/page.tsx
  //
  // Examples (NOT allowed):
  // app/exchanges/binance/security-features/page.tsx
  // app/dex/hibachi/insurance-fund/page.tsx

  if (/^app\/[^/]+\/[^/]+\/page\.tsx$/.test(p)) {
    return true;
  }

  return false;
}

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface FileSnapshot {
  path: string;
  hash: string;
  size: number;
}

export interface Snapshot {
  snapshot_id: string;
  created_at: string;
  files: FileSnapshot[];
  total_files: number;
  total_size: number;
}

export type SnapshotViolationType =
  | "FILE_MODIFIED"
  | "FILE_DELETED"
  | "SNAPSHOT_MISSING";

export interface SnapshotViolation {
  type: SnapshotViolationType;
  file_path: string;
  details: string;
  expected_hash?: string;
  actual_hash?: string;
}

export interface SnapshotResult {
  status: "pass" | "fail" | "skipped_expected_mutation";
  violations: SnapshotViolation[];
  checked: {
    snapshot_id: string | null;
    files_compared: number;
    files_unchanged: number;
    files_modified: number;
    files_deleted: number;
  };
}

// -------------------------------------------------------------------
// Hash Computation
// -------------------------------------------------------------------

function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

// -------------------------------------------------------------------
// File Discovery
// -------------------------------------------------------------------

function collectFiles(rootDir: string): FileSnapshot[] {
  const files: FileSnapshot[] = [];
  const appDir = path.join(rootDir, "app");
  const datasetDir = path.join(rootDir, "public", "dataset");

  function scanDirectory(dir: string, basePath: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Skip go/ directory (affiliate infrastructure - non-canonical)
        if (entry.name === "go") continue;
        scanDirectory(fullPath, relativePath);
      } else if (entry.name === "page.tsx" || entry.name.endsWith(".json") || entry.name.endsWith(".jsonl")) {
        const stats = fs.statSync(fullPath);
        files.push({
          path: relativePath,
          hash: computeFileHash(fullPath),
          size: stats.size,
        });
      }
    }
  }

  // Scan app directory for page.tsx files
  scanDirectory(appDir, "app");

  // Scan dataset files
  if (fs.existsSync(datasetDir)) {
    const datasetFiles = fs.readdirSync(datasetDir);
    for (const file of datasetFiles.sort()) {
      if (file.endsWith(".json") || file.endsWith(".jsonl")) {
        const fullPath = path.join(datasetDir, file);
        const relativePath = path.join("public", "dataset", file);
        const stats = fs.statSync(fullPath);
        files.push({
          path: relativePath,
          hash: computeFileHash(fullPath),
          size: stats.size,
        });
      }
    }
  }

  return files;
}

// -------------------------------------------------------------------
// Snapshot Creation (Append-Only)
// -------------------------------------------------------------------

export function createSnapshot(rootDir: string): Snapshot {
  const files = collectFiles(rootDir);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // Deterministic snapshot ID based on content hash
  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex")
    .slice(0, 16);

  // Use deterministic timestamp format (date only, no time entropy)
  const dateStr = new Date().toISOString().split("T")[0];

  return {
    snapshot_id: `snapshot-${dateStr}-${contentHash}`,
    created_at: dateStr,
    files,
    total_files: files.length,
    total_size: totalSize,
  };
}

export function saveSnapshot(rootDir: string, snapshot: Snapshot): string {
  const snapshotsDir = path.join(rootDir, "monitoring", "snapshots");

  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  const snapshotPath = path.join(snapshotsDir, `${snapshot.snapshot_id}.json`);

  // Append-only: refuse to overwrite existing snapshot
  if (fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot already exists (append-only): ${snapshotPath}`);
  }

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  return snapshotPath;
}

// -------------------------------------------------------------------
// Snapshot Loading
// -------------------------------------------------------------------

export function loadLatestSnapshot(rootDir: string): Snapshot | null {
  const snapshotsDir = path.join(rootDir, "monitoring", "snapshots");

  if (!fs.existsSync(snapshotsDir)) {
    return null;
  }

  const files = fs.readdirSync(snapshotsDir)
    .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  const latestPath = path.join(snapshotsDir, files[0]);
  const content = fs.readFileSync(latestPath, "utf-8");
  return JSON.parse(content) as Snapshot;
}

// -------------------------------------------------------------------
// Snapshot Comparison
// -------------------------------------------------------------------

export function compareSnapshot(rootDir: string, snapshot: Snapshot): SnapshotResult {
  const currentFiles = collectFiles(rootDir);
  const violations: SnapshotViolation[] = [];

  // Build lookup maps
  const currentMap = new Map<string, FileSnapshot>();
  for (const file of currentFiles) {
    currentMap.set(file.path, file);
  }

  let filesUnchanged = 0;
  let filesModified = 0;
  let filesDeleted = 0;

  // Check each file in snapshot against current state
  for (const snapshotFile of snapshot.files) {
    const currentFile = currentMap.get(snapshotFile.path);

    if (!currentFile) {
      // File was deleted
      filesDeleted++;
      violations.push({
        type: "FILE_DELETED",
        file_path: snapshotFile.path,
        details: "File exists in snapshot but not in filesystem",
        expected_hash: snapshotFile.hash,
      });
    } else if (currentFile.hash !== snapshotFile.hash) {
      // File was modified
      filesModified++;
      violations.push({
        type: "FILE_MODIFIED",
        file_path: snapshotFile.path,
        details: "File hash differs from snapshot",
        expected_hash: snapshotFile.hash,
        actual_hash: currentFile.hash,
      });
    } else {
      filesUnchanged++;
    }
  }

  // Note: New files are NOT violations (append-only model allows additions)

  // ---------------------------
  // Generation Window Exception
  // ---------------------------
  const modified = violations.filter((v) => v.type === "FILE_MODIFIED");
  const deleted = violations.filter((v) => v.type === "FILE_DELETED");

  const expectedModified = modified.filter((v) => isExpectedMutationPath(v.file_path));
  const unexpectedModified = modified.filter((v) => !isExpectedMutationPath(v.file_path));

  // If there are unexpected deletions — always fail (deletions are never expected)
  if (deleted.length > 0) {
    return {
      status: "fail",
      violations,
      checked: {
        snapshot_id: snapshot.snapshot_id,
        files_compared: snapshot.files.length,
        files_unchanged: filesUnchanged,
        files_modified: filesModified,
        files_deleted: filesDeleted,
      },
    };
  }

  // If modifications exist and ALL are in expected allowlist => do NOT fail snapshot
  if (modified.length > 0 && unexpectedModified.length === 0) {
    return {
      status: "skipped_expected_mutation",
      violations: [], // expected mutations are not reported as violations
      checked: {
        snapshot_id: snapshot.snapshot_id,
        files_compared: snapshot.files.length,
        files_unchanged: filesUnchanged,
        files_modified: expectedModified.length,
        files_deleted: filesDeleted,
      },
    };
  }

  // Otherwise: standard behavior (fail if any violation exists)
  return {
    status: violations.length === 0 ? "pass" : "fail",
    violations,
    checked: {
      snapshot_id: snapshot.snapshot_id,
      files_compared: snapshot.files.length,
      files_unchanged: filesUnchanged,
      files_modified: filesModified,
      files_deleted: filesDeleted,
    },
  };
}

// -------------------------------------------------------------------
// Main Comparator
// -------------------------------------------------------------------

export function runSnapshotCheck(rootDir: string): SnapshotResult {
  const snapshot = loadLatestSnapshot(rootDir);

  if (!snapshot) {
    return {
      status: "pass", // No snapshot = nothing to compare (first run)
      violations: [],
      checked: {
        snapshot_id: null,
        files_compared: 0,
        files_unchanged: 0,
        files_modified: 0,
        files_deleted: 0,
      },
    };
  }

  return compareSnapshot(rootDir, snapshot);
}

// -------------------------------------------------------------------
// Standalone Execution
// -------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const rootDir = args[1] || process.cwd();

  if (command === "create") {
    // Create new snapshot
    const snapshot = createSnapshot(rootDir);
    const savedPath = saveSnapshot(rootDir, snapshot);
    console.log(JSON.stringify({
      action: "created",
      snapshot_id: snapshot.snapshot_id,
      total_files: snapshot.total_files,
      saved_to: savedPath,
    }, null, 2));
    process.exit(0);
  } else if (command === "check" || !command) {
    // Compare against latest snapshot
    const result = runSnapshotCheck(rootDir);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === "fail" ? 1 : 0);
  } else {
    console.error("Usage: snapshot.ts [create|check] [rootDir]");
    process.exit(1);
  }
}
