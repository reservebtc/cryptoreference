// tools/ingestion-test.js
// PURPOSE: Ingestion Simulation Test (Step 12)
// HARD RULES: no HTML, deterministic, dataset-only

import fs from "fs";
import crypto from "crypto";

const DATASET_PATH = "./public/dataset/latest.jsonl";
const REGISTRY_PATH = "./public/dataset/registry.json";

function hashObject(obj) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex");
}

// 1. Fetch dataset (file-based, no HTML)
const lines = fs
  .readFileSync(DATASET_PATH, "utf8")
  .trim()
  .split("\n");

// 2. Parse NDJSON
const records = lines.map((line) => JSON.parse(line));

// 3. Build minimal graph
const graph = {
  cr: {},
  registry: {}
};

for (const r of records) {
  if (r.record_type === "cr") {
    if (!r.id || !r.canonical_hash) {
      throw new Error("Invalid CR record");
    }
    graph.cr[r.id] = r.canonical_hash;
  }

  if (r.record_type === "registry") {
    graph.registry[r.id] = {
      parent_id: r.parent_id ?? null,
      page_status: r.page_status
    };
  }
}

// 4. Load registry.json (secondary check)
const registryFile = JSON.parse(
  fs.readFileSync(REGISTRY_PATH, "utf8")
);

// 5. Deterministic graph fingerprint
const fingerprint = hashObject({
  cr: Object.keys(graph.cr).sort(),
  registry: Object.keys(graph.registry).sort()
});

console.log("INGESTION GRAPH FINGERPRINT:");
console.log(fingerprint);