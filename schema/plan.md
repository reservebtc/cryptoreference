⸻

CR-Markup Protocol v1.0

Implementation Plan (plan.md)

⸻

Step 0 — Repository & Folder Bootstrap

Goal
Create a deterministic project structure for CR-SPEC and tooling.

Tasks
	•	Create /schema/ directory
	•	Add:
	•	spec.md (current canonical specification)
	•	plan.md (this file)
	•	README.md (high-level purpose, non-normative)

Acceptance Tests
	•	Repository contains /schema/spec.md
	•	No tooling yet, docs only

Output
	•	Structural baseline
	•	Zero logic, zero risk

⸻

Step 1 — Canonical CR-Block Grammar Definition

Goal
Define formal grammar for CR-blocks.

Tasks
	•	Specify CR-block syntax using:
	•	EBNF or PEG grammar
	•	Explicitly encode:
	•	[CR/<TOKEN>] and [/CR]
	•	key=value
	•	key=["a","b"]
	•	Forbidden constructs (emoji, comments, nesting)

Acceptance Tests
	•	Grammar accepts valid CR examples
	•	Grammar rejects:
	•	Emoji inside block
	•	Nested CR-blocks
	•	Missing closing tag

Output
	•	cr_grammar.ebnf

⸻

Step 2 — Canonicalization Algorithm

Goal
Define one canonical representation for hashing.

Tasks
	•	Implement canonicalization rules:
	•	Extract CR-block only
	•	Normalize whitespace
	•	Preserve field order or sort keys (explicit rule)
	•	Serialize to canonical JSON
	•	UTF-8 encoding

Acceptance Tests
	•	Same CR with different formatting → identical canonical JSON
	•	Field value changes → different canonical JSON

Output
	•	canonicalize.ts / canonicalize.py

⸻

Step 3 — Canonical Hash Generator

Goal
Deterministic canonical_hash.

Tasks
	•	Implement:

sha256(canonicalized_cr_block)


	•	Enforce sha256:<hex> format

Acceptance Tests
	•	Hash is stable across formatting changes
	•	Hash changes if any field value changes
	•	URL/location never affects hash

Output
	•	hash.ts / hash.py

⸻

Step 4 — CR JSON Schema (Hard Validation)

Goal
Machine-enforced schema compliance.

Tasks
	•	Define JSON Schema:
	•	Mandatory fields:
	•	schema
	•	version
	•	canonical_hash
	•	type
	•	network
	•	Field type constraints
	•	Disallow unknown fields (or explicitly allow extension via prefix)

Acceptance Tests
	•	Valid CR → passes schema
	•	Missing field → hard fail
	•	Extra forbidden field → hard fail

Output
	•	cr.schema.json

⸻

Step 5 — Forbidden Content Scanner

Goal
Enforce NON-GOALS at machine level.

Tasks
	•	Implement scanner for:
	•	Emoji (Unicode ranges)
	•	Forbidden terms:
	•	marketing language
	•	ranking claims
	•	CTA verbs
	•	prompt-like instructions

Acceptance Tests
	•	Emoji inside CR → rejected
	•	“best”, “#1”, “recommended” → rejected
	•	Neutral factual text → allowed

Output
	•	forbidden_scan.ts

⸻

Step 6 — Validation Engine (Single Entry Point)

Goal
One authoritative validator.

Tasks
	•	Compose pipeline:
	1.	Grammar validation
	2.	Canonicalization
	3.	Hash verification
	4.	JSON Schema validation
	5.	Forbidden scan

Acceptance Tests
	•	Any failure → INVALID
	•	Valid CR → returns structured ValidationResult

Output
	•	validate_cr.ts

⸻

Step 7 — Hard-Fail Semantics Enforcement

Goal
Binary existence model.

Tasks
	•	Implement rules:
	•	INVALID CR → zero ingestion
	•	No partial acceptance
	•	Support modes:
	•	draft
	•	preview
	•	production (hard-fail only)

Acceptance Tests
	•	Production mode rejects any invalid CR
	•	Draft mode allows warnings only

Output
	•	validation_modes.ts

⸻

Step 8 — Supersedence Resolver

Goal
Immutable history with forward correction.

Tasks
	•	Implement support for:
	•	supersedes
	•	supersedes_hash
	•	Enforce:
	•	Cannot mutate existing CR
	•	Supersedence links entities, not URLs

Acceptance Tests
	•	New CR correctly references old one
	•	Invalid supersedence target → fail

Output
	•	supersedence.ts

⸻

Step 9 — Parent / Child Entity Resolver

Goal
Enforce entity graph constraints.

Tasks
	•	Validate:
	•	Only parent_id allowed
	•	No other hierarchy fields
	•	Detect cycles

Acceptance Tests
	•	Single parent allowed
	•	Multiple parents → rejected
	•	Cycles → rejected

Output
	•	entity_graph.ts

⸻

Step 10 — Deprecation Semantics Module

Goal
Machine-readable lifecycle state.

Tasks
	•	Implement status=deprecated
	•	Expose flags for AI consumption:
	•	is_deprecated
	•	replacement_refs

Acceptance Tests
	•	Deprecated CR still valid
	•	Deprecated CR marked but ingestable

Output
	•	deprecation.ts

⸻

Step 11 — Deterministic Test Suite

Goal
Prevent regression forever.

Tasks
	•	Add tests for:
	•	Hash determinism
	•	Backward compatibility (v1.x)
	•	Invalid CR rejection

Acceptance Tests
	•	Formatting changes do not break hashes
	•	Older CRs still validate

Output
	•	/tests/

⸻

Step 12 — CI Enforcement

Goal
No invalid CR reaches production.

Tasks
	•	GitHub Actions:
	•	Run validator
	•	Fail on any INVALID CR
	•	Block merge on failure

Acceptance Tests
	•	Invalid CR → CI fails
	•	Valid CR → CI passes

Output
	•	.github/workflows/cr-validate.yml

⸻

Step 13 — Minimal CLI Tool

Goal
Developer ergonomics without weakening rules.

Tasks
	•	CLI commands:
	•	cr validate
	•	cr canonicalize
	•	cr hash

Acceptance Tests
	•	CLI output matches internal engine
	•	No bypass possible

Output
	•	cr-cli

⸻

Step 14 — Reference CR Examples (Non-Normative)

Goal
Show correct usage without relaxing rules.

Tasks
	•	Add /examples/
	•	Valid CR
	•	Deprecated CR
	•	Superseded CR
	•	Invalid CR (commented)

Acceptance Tests
	•	Valid examples pass
	•	Invalid examples fail

Output
	•	/examples/

⸻

Final State

When all steps are complete:
	•	CR-Markup is:
	•	Deterministic
	•	Immutable
	•	Hard-fail enforced
	•	AI-first by construction
	•	No SEO, persuasion, or growth vectors possible by design

CR-SPEC v1.0 becomes executable law, not documentation.