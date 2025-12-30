/**
 * REGISTRY BACKLOG ENFORCEMENT
 *
 * Canonical CI guard for spec6.md
 *
 * HARD LAWS:
 * - Registry is append-only
 * - IDs are globally unique
 * - Planning backlog MUST exist
 * - Generation without backlog is FORBIDDEN
 *
 * This script MUST:
 * - FAIL hard on violation
 * - Produce NO fixes
 * - Produce NO suggestions
 */

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(
  process.cwd(),
  "public",
  "dataset",
  "registry.json"
);

const REQUIRED_BATCH_SIZE = 20;

// -----------------------------
// LOAD & PARSE
// -----------------------------
if (!fs.existsSync(REGISTRY_PATH)) {
  console.error("❌ REGISTRY VIOLATION");
  console.error("registry.json not found");
  process.exit(1);
}

let registry;
try {
  registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
} catch {
  console.error("❌ REGISTRY VIOLATION");
  console.error("registry.json is not valid JSON");
  process.exit(1);
}

if (!Array.isArray(registry)) {
  console.error("❌ REGISTRY VIOLATION");
  console.error("registry.json MUST be a JSON array");
  process.exit(1);
}

// -----------------------------
// SCHEMA VALIDATION (MINIMAL)
// -----------------------------
const seenIds = new Set();

for (let i = 0; i < registry.length; i++) {
  const entry = registry[i];

  if (
    typeof entry !== "object" ||
    entry === null ||
    typeof entry.id !== "string" ||
    typeof entry.type !== "string" ||
    typeof entry.page_status !== "string" ||
    !("parent_id" in entry)
  ) {
    console.error("❌ REGISTRY VIOLATION");
    console.error(
      `Invalid registry entry at index ${i}`
    );
    process.exit(1);
  }

  if (seenIds.has(entry.id)) {
    console.error("❌ REGISTRY VIOLATION");
    console.error(
      `Duplicate registry id detected: ${entry.id}`
    );
    console.error(
      "spec6.md violation: ID reuse is forbidden forever"
    );
    process.exit(1);
  }

  seenIds.add(entry.id);
}

// -----------------------------
// BACKLOG ENFORCEMENT (SPEC6)
// -----------------------------
const missing = registry.filter(
  (e) => e.page_status === "missing"
);

if (missing.length < REQUIRED_BATCH_SIZE) {
  console.error("❌ REGISTRY BACKLOG VIOLATION");
  console.error(
    `Found ${missing.length} entries with page_status="missing"`
  );
  console.error(
    `Minimum required by spec6.md: ${REQUIRED_BATCH_SIZE}`
  );
  console.error(
    "Generation is FORBIDDEN without sufficient pre-allocated IDs"
  );
  process.exit(1);
}

// -----------------------------
// PARENT CONSISTENCY (SPEC6 + SPEC5)
// -----------------------------
const invalidParent = missing.filter(e => {
  if (e.type === "child_entity") {
    return !e.parent_id;
  }
  if (e.type === "entity") {
    return e.parent_id !== null;
  }
  return false;
});

if (invalidParent.length > 0) {
  console.error("❌ REGISTRY VIOLATION");
  console.error(
    "Invalid parent_id / type combination detected in missing entries"
  );
  process.exit(1);
}

// -----------------------------
// PASS (SILENT SUCCESS)
// -----------------------------
console.log(
  `✅ Registry backlog OK: ${missing.length} missing entries`
);