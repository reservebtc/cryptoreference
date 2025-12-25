CR-Markup Protocol v1.0

spec3.md — AI-First Content Generation & Registry Governance Specification

⸻

1. Purpose

The purpose of this document is to formalize large-scale AI-generated content production (1,000–3,000 pages) on top of CR-Markup Protocol v1.0 without violating canonical invariants, with guarantees of:
	•	absence of duplicates,
	•	absence of semantic drift,
	•	absence of CR noise,
	•	full determinism,
	•	scalability without human involvement.

This document governs:
	•	how content is created,
	•	how scale is controlled,
	•	how the system “remembers” what has already been done.

This document does NOT modify CR-SPEC or spec2.md.
It is a production-governance–level extension.

⸻

2. What We Do / What We Do NOT Do

2.1 What We DO
	•	Use AI for large-scale content generation (20+ pages per day)
	•	Manage content through a registry (entity and topic registry), not through prompts
	•	Strictly separate:
	•	entities (with CR)
	•	child-entities (with CR, strictly)
	•	educational / analytical pages (without CR)
	•	comparison pages (without CR, separate type)
	•	Ensure:
	•	deterministic format,
	•	AI-first structure,
	•	CI-enforced rules,
	•	a zero-duplication model

⸻

2.2 What We DO NOT Do
	•	❌ Do not write content “from memory”
	•	❌ Do not use a master prompt for everything
	•	❌ Do not optimize for SEO keywords
	•	❌ Do not generate pages without a registry ID
	•	❌ Do not add CR to educational / comparison pages
	•	❌ Do not rewrite already published facts
	•	❌ Do not allow persuasion / CTA / advice anywhere
	•	❌ Do not treat texts as a source of truth

Content is a byproduct.
Truth is the registry + CR.

⸻

3. Architecture

3.1 Overall Architecture

┌─────────────────────────────┐
│ Topic / Entity Registry     │  ← Canonical memory
│ (IDs + status)              │
└─────────────▲───────────────┘
              │
┌─────────────┴───────────────┐
│ Task Manifest (daily batch) │
└─────────────▲───────────────┘
              │
┌─────────────┴───────────────┐
│ AI Generation Layer         │
│ (typed generators)          │
└─────────────▲───────────────┘
              │
┌─────────────┴───────────────┐
│ Validation & CI             │
│ (CR, lint, rules)           │
└─────────────▲───────────────┘
              │
┌─────────────┴───────────────┐
│ Publication Layer           │
│ + Registry Update           │
└─────────────────────────────┘

⸻

3.2 Architectural Principles
	•	Registry = the only memory
	•	AI = executor, not decision-maker
	•	CI = the only gatekeeper
	•	Human = exception, not a flow participant
	•	Pages cannot exist outside the registry

⸻

4. Data Models

4.1 Topic / Entity Registry (canonical model)

id: asterdex-futures-funding-rate
type: education | entity | child_entity | comparison
parent_id: asterdex        # optional
entities: [asterdex, hyperliquid] # only for comparison
cr_required: true | false
page_status: missing | published | deprecated | duplicate
source_scope:
  - official_docs
  - official_site
  - dune

⸻

4.2 Registry Entry Types

Type	CR	Purpose
entity	YES	Canonical entity
child_entity	YES	Real sub-entity
education	NO	Mass content
interface	NO	UI walkthrough
comparison	NO	Entity comparison
metrics	NO	Data description

⸻

4.3 Page Model (logical)

Page
├── registry_id (required)
├── page_type
├── CR-Markup (optional, only if allowed)
├── Structured content
├── Affiliate reference (optional, non-canonical)
└── Metadata (non-authoritative)

⸻

5. Invariants (MUST ALWAYS HOLD)
	1.	No registry ID → the page does not exist
	2.	One registry ID → one page
	3.	CR is present only where explicitly allowed
	4.	Educational / comparison pages never contain CR
	5.	Registry status = published → regeneration is forbidden
	6.	Comparison pages:
	•	do not have parent_id
	•	are not entities
	7.	Affiliate:
	•	one link per page
	•	outside CR
	•	neutral
	8.	Content is always:
	•	descriptive
	•	non-persuasive
	•	deterministic
	9.	History is never rewritten
	10.	CI fail = page does not exist

⸻

6. Errors and Edge Cases

6.1 Attempt to Generate Without Registry

Behavior:
→ Hard fail
→ Page is not generated
→ CI error

⸻

6.2 Attempt to Regenerate a Published ID

Behavior:
→ Hard fail
→ Requires:
	•	either a new ID
	•	or supersedes (if entity)

⸻

6.3 Attempt to Add CR to an Educational Page

Behavior:
→ Hard fail
→ Ontology violation

⸻

6.4 Feature Without Independent Identity

Behavior:
→ Creating a child_entity is forbidden
→ Must be modeled as an attribute of the parent

⸻

6.5 Fact Changes
	•	Meaning changed → new ID / supersedes
	•	Formatting / typo → allowed without new ID
	•	Retroactive adjustment → forbidden

⸻

6.6 Undefined Data

Allowed:
	•	Unknown
	•	Not disclosed

Forbidden:
	•	assumptions
	•	“typically”, “often” without a source

⸻

7. Mini Testing Strategy

7.1 Registry Tests
	•	No duplicate IDs
	•	No published page without registry
	•	No registry entry without a page (if published)
	•	Valid statuses only

⸻

7.2 Generation Tests
	•	ID → correct generator
	•	CR added only where allowed
	•	Page format matches type
	•	Volume and structure respected

⸻

7.3 Content Lint Tests
	•	No persuasion
	•	No CTA
	•	No advice
	•	No evaluative language
	•	Tables > text

⸻

7.4 CR Consistency Tests (if applicable)
	•	Schema valid
	•	Hash deterministic
	•	Supersedes valid
	•	Parent/child relations valid

⸻

7.5 Regression Tests
	•	Re-running a batch → does not create new pages
	•	Registry changes → affect only new IDs
	•	Existing pages remain unchanged

⸻

8. Final Principle

You do not manage texts.
You manage the registry.
Everything else is an automatic, verifiable, reproducible output.

⸻

spec3.md — FINAL
Compatible with CR-SPEC v1.0 and spec2.md
Ready for integration into CI and the AI production pipeline.