plan2.md

CR-Markup Protocol v1.0
Legacy Content Migration & AI-First Cleanup — Implementation Plan

⸻

Step 0 — Inventory Legacy Content

Goal
Obtain a complete, fixed list of legacy pages.

Tasks
	•	Scan the repository / CMS
	•	Build a list including:
	•	URL
	•	entity_name (if present)
	•	page type (entity / article / comparison / misc)
	•	CR presence (yes/no)

Acceptance Tests
	•	100% of pages are present in the inventory
	•	Each page has exactly one status:
	•	legacy
	•	non-entity

Output
	•	legacy_inventory.json

⸻

Step 1 — Classify Entity Pages

Goal
Separate entity pages from everything else.

Tasks
	•	For each legacy page:
	•	determine whether it describes a single concrete entity
	•	Mark:
	•	entity_candidate=true|false

Acceptance Tests
	•	No pages with undefined status
	•	All comparison / blog / misc → entity_candidate=false

Output
	•	Updated legacy_inventory.json

⸻

Step 2 — Lock Legacy Pages (Read-Only)

Goal
Prevent non-canonical changes.

Tasks
	•	For all entity_candidate=true without FULL CR:
	•	set:

status=legacy
cr_compliance=false

	•	Block:
	•	editing
	•	use in comparisons
	•	inclusion in sitemap as an entity

Acceptance Tests
	•	Legacy entity cannot be updated without CR
	•	CI / build fails on publish attempt

Output
	•	Enforcement rule in the pipeline

⸻

Step 3 — Extract Verifiable Facts

Goal
Extract only admissible facts.

Tasks
	•	For each entity page:
	•	extract facts
	•	specify the source:
	•	official docs / GitHub / blog
	•	Mark:
	•	verified=true|false

Acceptance Tests
	•	No fact without a source is marked as verified
	•	Telegram / aggregators are not used

Output
	•	fact_sheet/<entity>.json

⸻

Step 4 — Draft Partial CR (Migration-Only)

Goal
Create a temporary CR skeleton.

Tasks
	•	Generate a CR block:
	•	verified facts only
	•	mandatory fields
	•	Add:

cr_status=partial
cr_compliance=false

Acceptance Tests
	•	Partial CR is grammar-valid
	•	Partial CR does NOT pass canonical validation

Output
	•	cr_drafts/<entity>.cr

⸻

Step 5 — Resolve Network Semantics

Goal
Remove network ambiguity.

Tasks
	•	For each entity:
	•	apply rules:
	•	off-chain → network omitted/null
	•	multi-chain → network only in child entities
	•	unknown → network=unknown + reason
	•	on-chain → network mandatory

Acceptance Tests
	•	No entity has unresolved network semantics
	•	Multi-chain parent does not contain network

Output
	•	Updated partial CRs

⸻

Step 6 — Detect Duplicates

Goal
Guarantee exactly one canonical entity.

Tasks
	•	Compare entity candidates by:
	•	name
	•	aliases
	•	official URLs
	•	For duplicates:
	•	select canonical
	•	mark the rest:

status=duplicate
duplicate_of=<canonical_id>

Acceptance Tests
	•	No object has two canonical entities
	•	All duplicates reference an existing canonical entity

Output
	•	duplicate_map.json

⸻

Step 7 — Promote to FULL CR

Goal
Create a canonical entity.

Tasks
	•	Remove migration flags
	•	Generate:
	•	canonicalized CR
	•	canonical_hash
	•	Run the full validator

Acceptance Tests
	•	FULL CR passes:
	•	grammar
	•	schema
	•	forbidden scan
	•	hash determinism

Output
	•	cr_entities/<entity>.cr

⸻

Step 8 — Bind CR to Entity Page

Goal
Make CR the source of truth.

Tasks
	•	Embed CR into the entity page
	•	Ensure:
	•	one CR = one page
	•	no other machine-readable layers exist

Acceptance Tests
	•	Page without CR does not deploy
	•	Two CR blocks on one page → hard fail

Output
	•	CR-backed entity page

⸻

Step 9 — Remove Legacy Machine Layers

Goal
Remove conflicting formats.

Tasks
	•	Remove:
	•	schema.org
	•	JSON-LD
	•	ai+json
	•	custom SEO blocks

Acceptance Tests
	•	No alternative machine schemas remain in HTML
	•	CR remains the sole contract

Output
	•	Clean entity pages

⸻

Step 10 — Handle Deprecated Entities

Goal
Preserve history without canonical noise.

Tasks
	•	For dead / closed entities:

status=deprecated

	•	If a replacement exists:
	•	specify replacement references

Acceptance Tests
	•	Deprecated CR is valid
	•	Deprecated ≠ duplicate

Output
	•	Deprecated CRs in the primary dataset

⸻

Step 11 — Migration Validation Suite

Goal
Lock in migration correctness.

Tasks
	•	Tests:
	•	legacy → FULL CR success
	•	legacy without CR → reject
	•	partial CR → non-canonical
	•	duplicate resolution

Acceptance Tests
	•	All tests are green
	•	Any regression → fail

Output
	•	/tests/migration/

⸻

Step 12 — Enforce Event-Based Gate

Goal
Prevent “eternal legacy.”

Tasks
	•	Any event:
	•	update
	•	comparison
	•	sitemap inclusion
	•	AI citation intent
	•	Check:
	•	FULL CR is mandatory

Acceptance Tests
	•	Any event without FULL CR → hard fail

Output
	•	Production gate rules

⸻

Final State

After all steps are completed:
	•	❌ Legacy entity without CR does not exist
	•	✅ Every entity is CR-backed
	•	✅ Duplicates are formally allowed
	•	✅ History is preserved, noise removed
	•	✅ AI receives a clean, deterministic dataset

No CR — no entity.
No validation — no existence.
