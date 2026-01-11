/*
  CANONICAL SOURCE LOADER
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/monitoring-spec.md

  HARD RULES:
  - Strict read-only access
  - No inference
  - No fallback sources
  - Fail on missing file
  - Deterministic output
*/

import * as fs from "fs";
import * as path from "path";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface RegistryEntry {
  id: string;
  type: "entity" | "child_entity" | "comparison";
  page_status: "published" | "missing";
  parent_id: string | null;
}

export interface DatasetRecord {
  record_type: "cr" | "registry";
  id: string;
  canonical_hash?: string;
  page_status?: string;
  parent_id?: string | null;
}

export interface CRBlock {
  entity_id: string;
  file_path: string;
  raw: string;
}

export interface CanonicalSources {
  registry: RegistryEntry[];
  dataset: DatasetRecord[];
  crBlocks: CRBlock[];
}

// -------------------------------------------------------------------
// Loader Error
// -------------------------------------------------------------------

export class LoaderError extends Error {
  constructor(
    message: string,
    public readonly source: string
  ) {
    super(`[LOADER_ERROR] ${source}: ${message}`);
    this.name = "LoaderError";
  }
}

// -------------------------------------------------------------------
// Registry Loader
// -------------------------------------------------------------------

export function loadRegistry(rootDir: string): RegistryEntry[] {
  const registryPath = path.join(rootDir, "public", "dataset", "registry.json");

  if (!fs.existsSync(registryPath)) {
    throw new LoaderError("File not found", registryPath);
  }

  const raw = fs.readFileSync(registryPath, "utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LoaderError("Invalid JSON", registryPath);
  }

  if (!Array.isArray(parsed)) {
    throw new LoaderError("Expected array", registryPath);
  }

  return parsed as RegistryEntry[];
}

// -------------------------------------------------------------------
// Dataset Loader (NDJSON)
// -------------------------------------------------------------------

export function loadDataset(rootDir: string): DatasetRecord[] {
  const datasetPath = path.join(rootDir, "public", "dataset", "latest.jsonl");

  if (!fs.existsSync(datasetPath)) {
    throw new LoaderError("File not found", datasetPath);
  }

  const raw = fs.readFileSync(datasetPath, "utf-8");
  const lines = raw.split("\n").filter((line) => line.trim() !== "");

  const records: DatasetRecord[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const parsed = JSON.parse(line);
      records.push(parsed as DatasetRecord);
    } catch {
      throw new LoaderError(`Invalid JSON at line ${i + 1}`, datasetPath);
    }
  }

  return records;
}

// -------------------------------------------------------------------
// CR-BLOCK Loader
// -------------------------------------------------------------------

const CR_BLOCK_REGEX = /\[CR\/[A-Z0-9_]+\][\s\S]*?\[\/CR\]/g;

export function loadCRBlocks(rootDir: string): CRBlock[] {
  const appDir = path.join(rootDir, "app");

  if (!fs.existsSync(appDir)) {
    throw new LoaderError("App directory not found", appDir);
  }

  const crBlocks: CRBlock[] = [];
  const pageFiles = findPageFiles(appDir);

  for (const filePath of pageFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const matches = content.match(CR_BLOCK_REGEX);

    if (matches) {
      for (const match of matches) {
        // Extract entity ID from CR-BLOCK header [CR/<TOKEN>]
        const tokenMatch = match.match(/\[CR\/([A-Z0-9_]+)\]/);
        if (tokenMatch) {
          crBlocks.push({
            entity_id: tokenMatch[1].toLowerCase(),
            file_path: filePath,
            raw: match,
          });
        }
      }
    }
  }

  return crBlocks;
}

// -------------------------------------------------------------------
// File Discovery (deterministic)
// -------------------------------------------------------------------

function findPageFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    // Sort for deterministic order
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "page.tsx") {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

// -------------------------------------------------------------------
// Combined Loader
// -------------------------------------------------------------------

export function loadAllSources(rootDir: string): CanonicalSources {
  return {
    registry: loadRegistry(rootDir),
    dataset: loadDataset(rootDir),
    crBlocks: loadCRBlocks(rootDir),
  };
}

// -------------------------------------------------------------------
// Standalone Execution (for testing)
// -------------------------------------------------------------------

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();

  try {
    const sources = loadAllSources(rootDir);

    console.log(JSON.stringify({
      registry_count: sources.registry.length,
      dataset_count: sources.dataset.length,
      cr_block_count: sources.crBlocks.length,
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
