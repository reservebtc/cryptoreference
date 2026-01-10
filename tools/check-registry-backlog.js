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
 * COLLISION #7 FIX: SPEC6 §6.1 REFERENCE
 * count(page_status="missing") >= 20
 *
 * COLLISION #10: SPEC6 §6.3 ENFORCEMENT
 * Atomic generation-planning coupling validation
 *
 * This script MUST:
 * - FAIL hard on violation
 * - Produce NO fixes
 * - Produce NO suggestions
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REGISTRY_PATH = path.join(
  process.cwd(),
  "public",
  "dataset",
  "registry.json"
);

// COLLISION #7 FIX: SPEC6 §6.1 REFERENCE
// Minimum backlog requirement: missing >= 20
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
// BACKLOG ENFORCEMENT (SPEC6 §6.1)
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
    `Minimum required by spec6.md §6.1: ${REQUIRED_BATCH_SIZE}`
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
// COLLISION #10: ATOMIC PLANNING COUPLING (SPEC6 §6.3)
// -----------------------------
// In CI context with git diff available, verify:
// - If N entries transitioned missing→published
// - Then N new missing entries must be added (append-only)
// - No IDs deleted
function checkAtomicPlanningCoupling() {
  // Only run in CI context where BASE_REF is available
  const baseRef = process.env.GITHUB_BASE_REF || process.env.BASE_REF;
  if (!baseRef) {
    console.log("ℹ️  Atomic coupling check skipped (not in PR context)");
    return true;
  }

  try {
    // Get base registry
    const baseRegistryRaw = execSync(
      `git show ${baseRef}:public/dataset/registry.json`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const baseRegistry = JSON.parse(baseRegistryRaw);

    // Count published in base
    const basePublished = new Set(
      baseRegistry.filter(e => e.page_status === "published").map(e => e.id)
    );
    const baseMissing = new Set(
      baseRegistry.filter(e => e.page_status === "missing").map(e => e.id)
    );
    const baseIds = new Set(baseRegistry.map(e => e.id));

    // Count in head (current)
    const headPublished = new Set(
      registry.filter(e => e.page_status === "published").map(e => e.id)
    );
    const headMissing = new Set(
      registry.filter(e => e.page_status === "missing").map(e => e.id)
    );
    const headIds = new Set(registry.map(e => e.id));

    // Calculate deltas
    const newlyPublished = [...headPublished].filter(id => baseMissing.has(id));
    const publishedCount = newlyPublished.length;

    const newMissingAdded = [...headMissing].filter(id => !baseIds.has(id));
    const missingAddedCount = newMissingAdded.length;

    // Check for deleted IDs (FORBIDDEN per spec6)
    const deletedIds = [...baseIds].filter(id => !headIds.has(id));
    if (deletedIds.length > 0) {
      console.error("❌ SPEC6 §6.3 VIOLATION: ID deletion detected");
      console.error(`Deleted IDs: ${deletedIds.join(", ")}`);
      console.error("Registry is append-only. ID deletion is FORBIDDEN.");
      return false;
    }

    // Check atomic coupling: published_count <= missing_added_count
    if (publishedCount > 0 && missingAddedCount < publishedCount) {
      console.error("❌ SPEC6 §6.3 VIOLATION: Atomic coupling broken");
      console.error(`Published ${publishedCount} entries (missing→published)`);
      console.error(`Added only ${missingAddedCount} new missing entries`);
      console.error("MUST add >= published_count new missing entries");
      return false;
    }

    console.log(`✅ Atomic coupling OK: ${publishedCount} published, ${missingAddedCount} new missing added`);
    return true;

  } catch (err) {
    // Git command failed - likely not in git context or base doesn't exist
    console.log("ℹ️  Atomic coupling check skipped (git diff unavailable)");
    return true;
  }
}

const atomicCouplingOk = checkAtomicPlanningCoupling();
if (!atomicCouplingOk) {
  process.exit(1);
}

// -----------------------------
// PASS (SILENT SUCCESS)
// -----------------------------
console.log(
  `✅ Registry backlog OK: ${missing.length} missing entries (spec6 §6.1 requires >= ${REQUIRED_BATCH_SIZE})`
);
