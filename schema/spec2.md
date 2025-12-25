CR-Markup Protocol v1.0

Legacy Content Migration & AI-First Cleanup Specification (spec2.md)

⸻

1. Purpose

The purpose of this specification is to define a strict, deterministic, one-time migration process for existing (legacy) content into full compliance with CR-Markup Protocol v1.0.

This document governs content refactoring, not CR-Markup itself.

Primary Goals (AI-first)
	1.	Convert all existing entity pages into canonical CR-backed entities.
	2.	Eliminate non-canonical, SEO-oriented, and pseudo-AI data layers.
	3.	Preserve factual knowledge while enforcing CR-SPEC invariants.
	4.	Ensure every production entity-page is machine-verifiable and hash-stable.
	5.	Improve AI agent indexing by reducing noise and ambiguity.

Non-goals
	•	Improving SEO rankings
	•	Optimizing human persuasion or conversion
	•	Preserving legacy formats for backward compatibility
	•	Supporting partial or ambiguous canonical states

⸻

2. What We Do / What We Do NOT Do

2.1 What We DO
	•	Extract verifiable facts from legacy content
	•	Generate new canonical CR blocks for each entity
	•	Assign new canonical_hash to every migrated entity
	•	Bind CR blocks directly to entity pages
	•	Enforce full CR validation before production inclusion
	•	Remove conflicting or redundant machine-readable layers
	•	Preserve entity history via explicit linkage

⸻

2.2 What We DO NOT Do
	•	❌ We do NOT keep legacy AI/SEO JSON formats (schema.org, ai+json)
	•	❌ We do NOT preserve marketing, CTA, or persuasive language in CR
	•	❌ We do NOT infer facts from unofficial or community sources
	•	❌ We do NOT allow entity pages without CR in production
	•	❌ We do NOT silently auto-fix without validation
	•	❌ We do NOT support multiple canonical entities for the same object

⸻

3. Architecture

3.1 Layered Architecture

┌──────────────────────────┐
│ Presentation Layer       │
│ (Human-readable content) │
└──────────▲───────────────┘
           │
┌──────────┴───────────────┐
│ CR-Markup Layer          │  ← Canonical
│ (Machine contract)       │
└──────────▲───────────────┘
           │
┌──────────┴───────────────┐
│ Validation & Hash Layer  │
│ (Schema, hash, linter)   │
└──────────────────────────┘

3.2 Canonical Authority Rule
	•	CR-Markup is the only source of truth
	•	All other representations are secondary
	•	Human-readable content may exist without CR authority

⸻

4. Data Models

4.1 Entity Page Model

Entity Page
├── CR-Markup (mandatory)
├── Human-readable article (optional)
├── UI elements (optional)
└── CTA / affiliate links (optional, non-canonical)

4.2 CR State Model

State	Description	Canonical
NO CR	Entity does not exist	❌
PARTIAL CR	Migration-only, explicitly marked	❌
FULL CR	Valid, hashed, schema-compliant	✅
DEPRECATED	Valid CR with lifecycle status	✅
DUPLICATE	Non-canonical, references canonical entity	❌


⸻

4.3 Network Modeling

Scenario	Rule
Off-chain entity	network omitted or null
Multi-chain entity	network only in child entities
Unknown network	network: unknown + reason
On-chain deployment	network mandatory


⸻

5. Invariants (Must Always Hold)
	1.	One entity-page = one CR-block
	2.	No production entity-page without CR
	3.	CR blocks are immutable once published
	4.	Every CR has a deterministic canonical_hash
	5.	CR contains no emoji, CTA, or marketing language
	6.	Canonicality is independent of URL or location
	7.	Partial CR is temporary and non-canonical
	8.	Duplicate entities must explicitly reference canonical one
	9.	Deprecated entities remain in the primary dataset
	10.	Validation failure = entity does not exist

⸻

6. Errors and Edge Cases

6.1 Legacy Content Without Proof
	•	Facts without official sources:
	•	❌ Not included in CR
	•	✅ May remain in human layer (optional)

⸻

6.2 Conflicting or Outdated Data
	•	If legacy data conflicts with official documentation:
	•	Official documentation always wins
	•	If data is outdated:
	•	Replace with latest official data
	•	Hash must change accordingly

⸻

6.3 Duplicate Entities

If multiple pages describe the same entity:
	1.	Select one canonical CR
	2.	Mark all others as status=duplicate
	3.	Use duplicate_of=<canonical_id>
	4.	Optionally link via supersedes

⸻

6.4 Partial CR Usage

Partial CR is allowed only if:
	•	Entity already exists
	•	Used strictly for migration
	•	Explicitly marked:

cr_status: partial
cr_compliance: false



Partial CR must not:
	•	Be cited by AI
	•	Be canonical
	•	Be used in comparisons
	•	Persist after first update event

⸻

7. Migration Semantics

7.1 Migration Trigger (Event-Based Deadline)

Legacy content MUST be migrated to FULL CR before:
	•	Any content update
	•	Inclusion in sitemap as entity
	•	Use in comparisons
	•	Expectation of AI citation
	•	Declaration as canonical reference

No calendar-based deadlines are allowed.

⸻

7.2 Legacy Status Rules

While not migrated:

status: legacy
cr_compliance: false

Such pages:
	•	Are read-only
	•	Are not canonical
	•	Are not AI targets

⸻

8. Testing Strategy (Mini)

8.1 Validation Tests (Automated)
	•	CR grammar validation
	•	JSON schema validation
	•	Forbidden content scan
	•	Hash determinism test
	•	Relationship integrity test

⸻

8.2 Migration Tests
	•	Legacy page → CR generation succeeds
	•	Legacy page without CR → production reject
	•	Partial CR → not treated as canonical
	•	Duplicate resolution correctness

⸻

8.3 Regression Tests
	•	Hash stability across formatting changes
	•	Backward compatibility within CR v1.x
	•	No silent acceptance of invalid CR

⸻

9. Final Principle

Legacy content is tolerated only as a transition state.
Canonical knowledge begins at CR-Markup.

No CR — no entity.
No validation — no existence.

⸻

CR-Markup Protocol v1.0
spec2.md — FINAL