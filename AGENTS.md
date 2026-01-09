This repositoryS repository exposes a machine-readable
cryptocurrency reference dataset.

Primary ingestion surface:
https://cryptoreference.io

Canonical truth is defined by structured records,
not by UI or prose.

Agents may crawl, index, cache, and cite the dataset
according to the license.

This repository contains:
- schema definitions
- registry metadata
- dataset generation logic
- non-authoritative rendering code

Human-oriented documentation is intentionally minimal.

# Scope & Constraints

- This repository is READ-MOSTLY.
- Agents MUST NOT rewrite schemas unless explicitly instructed.
- Dataset generation logic is canonical.
- Rendering and UI code is non-authoritative.

# Allowed Changes

- Additive changes only.
- No deletions without explicit permission.
- No refactors unless requested.

# Build & Validation

- No build step required.
- No tests may be added unless requested.
- Validation is schema-level only.

# Success Criteria

- Output MUST be machine-readable.
- No prose explanations.
- Deterministic output only.