/*
  INTERNAL CONSISTENCY CHECKER
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/monitoring-spec.md

  CHECKS:
  - registry ↔ filesystem
  - dataset ↔ filesystem
  - CR-BLOCK ↔ dataset record

  HARD RULES:
  - Pure comparison logic
  - Emit structured violations only
  - No mutation
*/

import * as fs from "fs";
import * as path from "path";
import {
  loadAllSources,
  RegistryEntry,
  DatasetRecord,
  CRBlock,
  CanonicalSources,
} from "./loader";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export type ViolationType =
  | "REGISTRY_MISSING_PAGE"
  | "DATASET_MISSING_PAGE"
  | "CR_BLOCK_MISSING_DATASET"
  | "DATASET_CR_MISSING_BLOCK"
  | "ORPHAN_DATASET_RECORD";

export interface Violation {
  type: ViolationType;
  entity_id: string;
  surface: "registry" | "dataset" | "filesystem" | "cr_block";
  details: string;
}

export interface ConsistencyResult {
  status: "pass" | "fail";
  violations: Violation[];
  checked: {
    registry_entries: number;
    dataset_records: number;
    cr_blocks: number;
    filesystem_pages: number;
  };
}

// -------------------------------------------------------------------
// Path Resolution
// -------------------------------------------------------------------

function registryIdToPath(rootDir: string, entry: RegistryEntry): string | null {
  // Entity pages: determine hub from parent or known mappings
  if (entry.type === "entity") {
    // Known entity → hub mappings
    const hubMap: Record<string, string> = {
      binance: "exchanges",
      okx: "exchanges",
      gate: "exchanges",
      etherfi: "cards",
      asterdex: "dex",
      hibachi: "dex",
      hyperliquid: "dex",
      lighter: "dex",
    };
    const hub = hubMap[entry.id];
    if (hub) {
      return path.join(rootDir, "app", hub, entry.id, "page.tsx");
    }
    return null;
  }

  // Comparison pages
  if (entry.type === "comparison") {
    if (entry.id === "dex_compare") {
      return path.join(rootDir, "app", "dex", "compare", "page.tsx");
    }
    return null;
  }

  // Child entity pages
  if (entry.type === "child_entity" && entry.parent_id) {
    // Determine hub from parent
    const hubMap: Record<string, string> = {
      binance: "exchanges",
      okx: "exchanges",
      gate: "exchanges",
      etherfi: "cards",
      asterdex: "dex",
      hibachi: "dex",
      hyperliquid: "dex",
      lighter: "dex",
    };
    const hub = hubMap[entry.parent_id];
    if (hub) {
      // Convert ID to slug: parent_id_child_name → child-name
      const childSlug = entry.id
        .replace(`${entry.parent_id}_`, "")
        .replace(/_/g, "-");
      return path.join(rootDir, "app", hub, entry.parent_id, childSlug, "page.tsx");
    }
  }

  return null;
}

// -------------------------------------------------------------------
// Consistency Checks
// -------------------------------------------------------------------

function checkRegistryFilesystem(
  rootDir: string,
  registry: RegistryEntry[]
): Violation[] {
  const violations: Violation[] = [];

  for (const entry of registry) {
    if (entry.page_status !== "published") {
      continue; // Skip missing/planned entries
    }

    const expectedPath = registryIdToPath(rootDir, entry);
    if (!expectedPath) {
      continue; // Unknown mapping, skip
    }

    if (!fs.existsSync(expectedPath)) {
      violations.push({
        type: "REGISTRY_MISSING_PAGE",
        entity_id: entry.id,
        surface: "filesystem",
        details: `Expected: ${expectedPath}`,
      });
    }
  }

  return violations;
}

function checkDatasetFilesystem(
  rootDir: string,
  dataset: DatasetRecord[],
  registry: RegistryEntry[]
): Violation[] {
  const violations: Violation[] = [];

  // Build registry lookup
  const registryMap = new Map<string, RegistryEntry>();
  for (const entry of registry) {
    registryMap.set(entry.id, entry);
  }

  for (const record of dataset) {
    if (record.record_type === "cr") {
      // CR records correspond to entity pages
      const regEntry = registryMap.get(record.id);
      if (regEntry) {
        const expectedPath = registryIdToPath(rootDir, regEntry);
        if (expectedPath && !fs.existsSync(expectedPath)) {
          violations.push({
            type: "DATASET_MISSING_PAGE",
            entity_id: record.id,
            surface: "filesystem",
            details: `CR record exists but page missing: ${expectedPath}`,
          });
        }
      }
    } else if (record.record_type === "registry") {
      // Registry records in dataset
      const regEntry = registryMap.get(record.id);
      if (!regEntry) {
        violations.push({
          type: "ORPHAN_DATASET_RECORD",
          entity_id: record.id,
          surface: "dataset",
          details: "Dataset record has no corresponding registry entry",
        });
      } else if (regEntry.page_status === "published") {
        const expectedPath = registryIdToPath(rootDir, regEntry);
        if (expectedPath && !fs.existsSync(expectedPath)) {
          violations.push({
            type: "DATASET_MISSING_PAGE",
            entity_id: record.id,
            surface: "filesystem",
            details: `Dataset record exists but page missing: ${expectedPath}`,
          });
        }
      }
    }
  }

  return violations;
}

function checkCRBlockDataset(
  crBlocks: CRBlock[],
  dataset: DatasetRecord[]
): Violation[] {
  const violations: Violation[] = [];

  // Build CR record lookup from dataset
  const datasetCRs = new Set<string>();
  for (const record of dataset) {
    if (record.record_type === "cr") {
      datasetCRs.add(record.id);
    }
  }

  // Build CR-BLOCK lookup
  const blockEntities = new Set<string>();
  for (const block of crBlocks) {
    blockEntities.add(block.entity_id);
  }

  // Check: CR-BLOCK exists → dataset CR record should exist
  for (const block of crBlocks) {
    if (!datasetCRs.has(block.entity_id)) {
      violations.push({
        type: "CR_BLOCK_MISSING_DATASET",
        entity_id: block.entity_id,
        surface: "dataset",
        details: `CR-BLOCK in ${block.file_path} has no dataset CR record`,
      });
    }
  }

  // Check: dataset CR record exists → CR-BLOCK should exist
  for (const record of dataset) {
    if (record.record_type === "cr") {
      if (!blockEntities.has(record.id)) {
        violations.push({
          type: "DATASET_CR_MISSING_BLOCK",
          entity_id: record.id,
          surface: "cr_block",
          details: "Dataset CR record has no corresponding CR-BLOCK in page",
        });
      }
    }
  }

  return violations;
}

// -------------------------------------------------------------------
// Main Checker
// -------------------------------------------------------------------

export function checkConsistency(rootDir: string): ConsistencyResult {
  const sources = loadAllSources(rootDir);

  // Count filesystem pages
  const appDir = path.join(rootDir, "app");
  let filesystemPages = 0;
  function countPages(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        countPages(fullPath);
      } else if (entry.name === "page.tsx") {
        filesystemPages++;
      }
    }
  }
  countPages(appDir);

  // Run all checks
  const violations: Violation[] = [
    ...checkRegistryFilesystem(rootDir, sources.registry),
    ...checkDatasetFilesystem(rootDir, sources.dataset, sources.registry),
    ...checkCRBlockDataset(sources.crBlocks, sources.dataset),
  ];

  return {
    status: violations.length === 0 ? "pass" : "fail",
    violations,
    checked: {
      registry_entries: sources.registry.length,
      dataset_records: sources.dataset.length,
      cr_blocks: sources.crBlocks.length,
      filesystem_pages: filesystemPages,
    },
  };
}

// -------------------------------------------------------------------
// Standalone Execution
// -------------------------------------------------------------------

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();

  const result = checkConsistency(rootDir);

  console.log(JSON.stringify(result, null, 2));

  process.exit(result.status === "pass" ? 0 : 1);
}
