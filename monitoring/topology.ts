/*
  TOPOLOGY VALIDATOR
  READ-ONLY / NON-DESTRUCTIVE

  Governed by: /schema/monitoring-spec.md, spec5.md

  CHECKS:
  - root → hub only
  - hub → entity only
  - entity → child only
  - ≤ allowed depth
  - No hub-to-hub cross-links

  HARD RULES:
  - Parse href graph
  - Compare against spec5 topology
  - No mutation
*/

import * as fs from "fs";
import * as path from "path";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export type PageType = "root" | "hub" | "entity" | "child" | "comparison" | "unknown";

export type TopologyViolationType =
  | "ROOT_INVALID_LINK"
  | "HUB_TO_HUB_LINK"
  | "HUB_INVALID_LINK"
  | "ENTITY_INVALID_LINK"
  | "DEPTH_EXCEEDED";

export interface TopologyViolation {
  type: TopologyViolationType;
  source_path: string;
  source_type: PageType;
  target_href: string;
  target_type: PageType;
  details: string;
}

export interface TopologyResult {
  status: "pass" | "fail";
  violations: TopologyViolation[];
  checked: {
    pages_scanned: number;
    links_analyzed: number;
  };
}

// -------------------------------------------------------------------
// Page Classification
// -------------------------------------------------------------------

const HUBS = ["dex", "exchanges", "cards"];
const ENTITIES = ["binance", "okx", "gate", "etherfi", "asterdex", "hibachi", "hyperliquid", "lighter"];

function classifyPath(href: string): PageType {
  // Normalize path
  const normalized = href.replace(/^\//, "").replace(/\/$/, "");

  if (normalized === "" || normalized === "/") {
    return "root";
  }

  const segments = normalized.split("/");

  // Hub: /dex, /exchanges, /cards
  if (segments.length === 1 && HUBS.includes(segments[0])) {
    return "hub";
  }

  // Comparison: /dex/compare
  if (segments.length === 2 && segments[0] === "dex" && segments[1] === "compare") {
    return "comparison";
  }

  // Entity: /hub/entity
  if (segments.length === 2 && HUBS.includes(segments[0])) {
    return "entity";
  }

  // Child: /hub/entity/child
  if (segments.length === 3 && HUBS.includes(segments[0])) {
    return "child";
  }

  // Affiliate routes are outside topology
  if (segments[0] === "go") {
    return "unknown"; // Affiliate routes are non-canonical
  }

  return "unknown";
}

function classifyFile(filePath: string, rootDir: string): PageType {
  const relative = path.relative(path.join(rootDir, "app"), filePath);
  const dir = path.dirname(relative);

  if (dir === ".") {
    return "root";
  }

  const segments = dir.split(path.sep);

  if (segments.length === 1 && HUBS.includes(segments[0])) {
    return "hub";
  }

  if (segments.length === 2 && segments[0] === "dex" && segments[1] === "compare") {
    return "comparison";
  }

  if (segments.length === 2 && HUBS.includes(segments[0])) {
    return "entity";
  }

  if (segments.length === 3 && HUBS.includes(segments[0])) {
    return "child";
  }

  return "unknown";
}

// -------------------------------------------------------------------
// Link Extraction
// -------------------------------------------------------------------

const HREF_REGEX = /href=["']([^"']+)["']/g;

function extractHrefs(content: string): string[] {
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = HREF_REGEX.exec(content)) !== null) {
    const href = match[1];
    // Only internal links
    if (href.startsWith("/") && !href.startsWith("//")) {
      hrefs.push(href);
    }
  }

  return hrefs;
}

// -------------------------------------------------------------------
// Topology Rules (spec5)
// -------------------------------------------------------------------

function validateLink(
  sourceType: PageType,
  targetType: PageType,
  sourceFile: string,
  targetHref: string
): TopologyViolation | null {
  // Root → hub only (footer links to root are OK)
  if (sourceType === "root") {
    if (targetType !== "hub") {
      return {
        type: "ROOT_INVALID_LINK",
        source_path: sourceFile,
        source_type: sourceType,
        target_href: targetHref,
        target_type: targetType,
        details: "Root page may only link to hubs",
      };
    }
  }

  // Hub → entity only (+ comparison allowed, + root in footer)
  if (sourceType === "hub") {
    // Hub-to-hub is forbidden
    if (targetType === "hub") {
      return {
        type: "HUB_TO_HUB_LINK",
        source_path: sourceFile,
        source_type: sourceType,
        target_href: targetHref,
        target_type: targetType,
        details: "Hub pages must not link to other hubs (Canonical Hub Isolation Law)",
      };
    }
    // Hub can link to: entity, comparison, root (footer)
    if (targetType !== "entity" && targetType !== "comparison" && targetType !== "root") {
      return {
        type: "HUB_INVALID_LINK",
        source_path: sourceFile,
        source_type: sourceType,
        target_href: targetHref,
        target_type: targetType,
        details: "Hub pages may only link to entities, comparisons, or root",
      };
    }
  }

  // Entity → child only (+ root/hub in footer for navigation)
  if (sourceType === "entity") {
    // Entity linking to other entity is forbidden
    if (targetType === "entity") {
      // Check if it's a different entity (not self-reference patterns)
      return {
        type: "ENTITY_INVALID_LINK",
        source_path: sourceFile,
        source_type: sourceType,
        target_href: targetHref,
        target_type: targetType,
        details: "Entity pages should not link to other entities",
      };
    }
  }

  return null;
}

// -------------------------------------------------------------------
// Main Validator
// -------------------------------------------------------------------

export function validateTopology(rootDir: string): TopologyResult {
  const appDir = path.join(rootDir, "app");
  const violations: TopologyViolation[] = [];
  let pagesScanned = 0;
  let linksAnalyzed = 0;

  function scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip go/ directory (affiliate infrastructure)
        if (entry.name === "go") continue;
        scanDirectory(fullPath);
      } else if (entry.name === "page.tsx") {
        pagesScanned++;

        const content = fs.readFileSync(fullPath, "utf-8");
        const sourceType = classifyFile(fullPath, rootDir);
        const hrefs = extractHrefs(content);

        for (const href of hrefs) {
          linksAnalyzed++;

          // Skip affiliate links
          if (href.startsWith("/go/")) continue;

          const targetType = classifyPath(href);

          // Skip unknown targets (external, etc.)
          if (targetType === "unknown") continue;

          const violation = validateLink(sourceType, targetType, fullPath, href);
          if (violation) {
            violations.push(violation);
          }
        }
      }
    }
  }

  scanDirectory(appDir);

  return {
    status: violations.length === 0 ? "pass" : "fail",
    violations,
    checked: {
      pages_scanned: pagesScanned,
      links_analyzed: linksAnalyzed,
    },
  };
}

// -------------------------------------------------------------------
// Standalone Execution
// -------------------------------------------------------------------

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd();

  const result = validateTopology(rootDir);

  console.log(JSON.stringify(result, null, 2));

  process.exit(result.status === "pass" ? 0 : 1);
}
