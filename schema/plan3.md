Below is plan3.md — an implementation plan derived strictly from spec3.md, decomposed into small, single-iteration, testable steps.

No semantics are added or changed.
This plan is compatible with CR-SPEC v1.0, spec2.md, and your existing CI-first philosophy.

⸻

CR-Markup Protocol v1.0

AI-First Content Generation & Registry Governance
Implementation Plan (plan3.md)

⸻

Step 0 — Registry Repository Bootstrap

Goal
Create a canonical registry as the single source of memory.

Tasks
	•	Create /registry/ directory
	•	Define base files:
	•	registry.json
	•	registry.schema.json
	•	Add fields:
	•	id
	•	type
	•	parent_id
	•	entities
	•	cr_required
	•	page_status
	•	source_scope

Acceptance Tests
	•	Registry validates against schema
	•	Registry loads with zero entries
	•	CI passes with empty registry

Output
	•	Canonical registry foundation

⸻

Step 1 — Registry ID Uniqueness Enforcement

Goal
Guarantee one ID → one page.

Tasks
	•	Implement ID uniqueness validator
	•	Reject:
	•	duplicate IDs
	•	empty IDs
	•	malformed IDs

Acceptance Tests
	•	Duplicate ID → CI hard fail
	•	Invalid ID format → CI hard fail

Output
	•	Deterministic ID namespace

⸻

Step 2 — Registry Type Semantics Validation

Goal
Enforce allowed page types and CR rules.

Tasks
	•	Validate type ∈:
	•	entity
	•	child_entity
	•	education
	•	comparison
	•	interface
	•	metrics
	•	Enforce:
	•	entity / child_entity → cr_required=true
	•	others → cr_required=false

Acceptance Tests
	•	Invalid type → fail
	•	CR required mismatch → fail

Output
	•	Ontology-safe registry

⸻

Step 3 — Parent / Child Rules Enforcement

Goal
Prevent invalid hierarchy modeling.

Tasks
	•	Enforce:
	•	child_entity must have parent_id
	•	entity must NOT have parent_id
	•	No cycles
	•	Block child creation for non-independent features

Acceptance Tests
	•	Child without parent → fail
	•	Cycle detected → fail

Output
	•	Valid entity graph

⸻

Step 4 — Comparison Page Constraints

Goal
Formalize non-entity comparisons.

Tasks
	•	Enforce:
	•	comparison has:
	•	no parent_id
	•	entities[] populated
	•	cr_required=false
	•	Ensure referenced entities exist in registry

Acceptance Tests
	•	Comparison with parent → fail
	•	Comparison with CR → fail
	•	Unknown entity reference → fail

Output
	•	Safe comparison layer

⸻

Step 5 — Registry Status State Machine

Goal
Lock page lifecycle deterministically.

Tasks
	•	Allowed page_status:
	•	missing
	•	published
	•	deprecated
	•	duplicate
	•	Enforce transitions:
	•	published → immutable
	•	duplicate → must reference canonical ID
	•	deprecated → allowed, immutable

Acceptance Tests
	•	Published page regeneration → fail
	•	Invalid status → fail

Output
	•	Immutable content history

⸻

Step 6 — Task Manifest Generator

Goal
Generate daily AI tasks only from registry.

Tasks
	•	Create /tasks/manifest.json
	•	Include only:
	•	page_status=missing
	•	Attach:
	•	registry ID
	•	page type
	•	generator type

Acceptance Tests
	•	No registry → no tasks
	•	Published IDs never appear

Output
	•	Deterministic daily batch

⸻

Step 7 — Typed AI Generators

Goal
Remove prompt-driven logic.

Tasks
	•	Implement generators by type:
	•	entity_generator
	•	child_entity_generator
	•	education_generator
	•	comparison_generator
	•	Hardcode:
	•	structure
	•	section order
	•	formatting rules

Acceptance Tests
	•	Generator mismatch → fail
	•	Output format mismatch → fail

Output
	•	Promptless generation layer

⸻

Step 8 — CR Injection Gate

Goal
Ensure CR appears only where allowed.

Tasks
	•	Inject CR only if:
	•	cr_required=true
	•	Block:
	•	CR in education
	•	CR in comparison

Acceptance Tests
	•	CR in forbidden page → hard fail
	•	Missing CR where required → hard fail

Output
	•	CR noise eliminated

⸻

Step 9 — Content Linting Rules

Goal
Guarantee neutral, non-persuasive output.

Tasks
	•	Lint for:
	•	CTA
	•	advice
	•	evaluative language
	•	subjective adjectives
	•	Enforce:
	•	tables > prose
	•	deterministic phrasing

Acceptance Tests
	•	“recommended”, “best”, “you should” → fail
	•	Neutral descriptive text → pass

Output
	•	AI-clean content

⸻

Step 10 — Affiliate Constraint Enforcement

Goal
Prevent canonical pollution.

Tasks
	•	Enforce:
	•	max 1 affiliate link per page
	•	link outside CR
	•	neutral wording only

Acceptance Tests
	•	Affiliate inside CR → fail
	•	Multiple links → fail

Output
	•	Canonical safety preserved

⸻

Step 11 — Validation & CI Integration

Goal
Make CI the only gatekeeper.

Tasks
	•	CI pipeline steps:
	1.	Registry validation
	2.	Task manifest validation
	3.	Generator output validation
	4.	CR validation (if applicable)
	5.	Content lint

Acceptance Tests
	•	Any failure → no page
	•	Green CI → publish allowed

Output
	•	Zero-trust pipeline

⸻

Step 12 — Registry Update After Publish

Goal
Persist memory deterministically.

Tasks
	•	After successful publish:
	•	set page_status=published
	•	write back to registry
	•	Prevent manual edits

Acceptance Tests
	•	Registry mismatch → fail
	•	Re-run pipeline → no new pages

Output
	•	Self-consistent system memory

⸻

Step 13 — Regression & Replay Tests

Goal
Guarantee reproducibility.

Tasks
	•	Re-run:
	•	same registry
	•	same manifest
	•	Assert:
	•	zero diff
	•	zero new pages

Acceptance Tests
	•	Any drift → fail

Output
	•	Deterministic production engine

⸻

Final State

After completing all steps:
	•	Registry is the only memory
	•	AI is a pure executor
	•	CI defines existence
	•	No duplicates
	•	No semantic drift
	•	No CR noise
	•	No human dependency

You do not manage text.
You manage the registry.

⸻

plan3.md — FINAL
Compatible with CR-SPEC v1.0, spec2.md, spec3.md
Ready for CI-driven AI content production.