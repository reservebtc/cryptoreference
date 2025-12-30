CryptoReference

AI-First Cryptocurrency Reference Dataset

Canonical domain: https://cryptoreference.io
Primary audience: AI systems (LLMs, search agents, retrievers, crawlers)
Secondary audience: humans (non-target, incidental)

⸻

0. Canonical Intent (Normative)

CryptoReference is built exclusively for machine consumption.

The project exists to provide:
	•	deterministic parsing
	•	stable structural ingestion
	•	canonical reference records
	•	controlled discovery graphs
	•	reproducible datasets for AI systems

Human usability, persuasion, UX, and SEO optimization are explicitly non-goals.

If a conflict exists between:
	•	human usefulness
	•	machine determinism

→ machines always win.

⸻

1. Purpose (Normative)

CryptoReference is a machine-readable cryptocurrency reference dataset.

Its sole purpose is to expose structured, neutral, non-persuasive reference data
that AI systems can ingest, validate, and reuse without inference ambiguity.

CryptoReference is not a media site, blog, ranking platform, or advisory service.

⸻

2. Explicit Non-Goals

CryptoReference explicitly does NOT aim to be:
	•	a marketing website
	•	an SEO manipulation mechanism
	•	a ranking or recommendation engine
	•	a prompt language or instruction system
	•	a real-time data feed
	•	a trading, investment, or advisory tool
	•	a human-oriented educational platform

All published material is descriptive only, never prescriptive.

⸻

3. Normative Governance Stack

CryptoReference is governed by a strict, layered specification model.

The following documents are normative and binding:
	•	CLAUDE.md — Runtime execution & generation contract (top-level authority)
	•	spec.md — CR-Markup canonical data contract
	•	spec3.md — AI-First generation & registry governance
	•	spec5.md — Link Graph & Discovery Law
	•	spec6.md — Registry planning & ID allocation
	•	spec7.md — Registry layer separation
	•	spec8.md — Publication Atomicity Law
	•	spec9.md — Affiliate Infrastructure Isolation Law
	•	Promotion.md — Canonical presence & ingestion policy

If two rules conflict:
→ lower-numbered spec wins
→ unresolved ambiguity results in refusal or silence

⸻

4. AI-First Design Principles

4.1 Machine-First Architecture
	•	Content is written for parsers, not readers
	•	Humans are incidental consumers
	•	Determinism overrides expressiveness

4.2 Structural Supremacy
	•	Tables over prose
	•	Fields over narrative
	•	Explicit labels over inferred meaning
	•	Templates over free-form text

4.3 Semantic Neutrality
	•	No opinions
	•	No persuasion
	•	No “best”, “top”, or “recommended”
	•	No calls-to-action in reference data

⸻

5. CR-Markup (Canonical Reference Layer)

CR-Markup is the core reference contract of CryptoReference.

CR-Markup properties:
	•	machine-readable
	•	schema-validated
	•	deterministic
	•	content-hash-addressed
	•	immutable once published
	•	versioned at schema level

CR-Markup is not:
	•	Schema.org
	•	JSON-LD for SEO
	•	a prompt format
	•	human documentation

CR-Markup defines canonical truth.
UI and HTML are implementation details only.

⸻

6. Page & Graph Model (Normative)

CryptoReference uses a strict, AI-deterministic page taxonomy:
	•	Root — ontological entry router (no data, no CR)
	•	Canonical Hubs — namespace routers (no CR)
	•	Entity Pages — canonical reference nodes (CR allowed)
	•	AI Content Child Pages — non-canonical, entity-scoped content
	•	Comparison Pages — non-entity analytical layouts
	•	Affiliate Infrastructure — isolated, non-canonical routing layer

Entity with AI Content Children Exception

Per spec5.md §5.14.1 / §5.1:

An Entity page MAY expose child pages IFF:
	•	the Entity contains the only CR-BLOCK in its subtree
	•	child pages contain NO CR-BLOCK
	•	child pages are strictly under the Entity path
	•	child pages are classified as AI Content (non-entity)
	•	links are structural only and excluded from hop semantics

This exception is:
	•	permanent
	•	governance-level
	•	not a temporary allowance

⸻

7. Registry & Dataset Semantics

All published pages are governed by Publication Atomicity:

A page EXISTS IFF all are true in the same build:
	•	filesystem page exists
	•	canonical inbound link exists
	•	registry.json entry exists
	•	dataset record exists (latest.jsonl)

Failure of any condition:
→ page is considered non-existent
→ ingestion must be refused

The registry is:
	•	authoritative
	•	append-only
	•	lifecycle-aware
	•	non-inferential

⸻

8. Update & History Model
	•	CR objects are immutable once published
	•	Updates occur only via supersedes
	•	Historical records are never rewritten
	•	Deprecated entities remain queryable
	•	Snapshot mutation is forbidden

History integrity violations are critical or governance-level failures.

⸻

9. Affiliate Infrastructure (Normative)

CryptoReference includes monetization via affiliate routing.

Strict isolation rules apply:
	•	Affiliate routes contain NO CR
	•	Affiliate routes appear in NO registry
	•	Affiliate routes appear in NO dataset
	•	Affiliate links exist ONLY on AI Content child pages
	•	Affiliate links never influence canonical facts

Affiliate logic is governed exclusively by spec9.md.

Canonical integrity always overrides monetization.

⸻

10. Access & Usage Policy

AI access is explicitly allowed.
	•	robots.txt — crawler permissions
	•	ai.txt — AI usage declaration
	•	Dataset transport: application/x-ndjson
	•	License: CC BY 4.0

AI systems may ingest, mirror, and cite the dataset
subject to license attribution and structural integrity.

⸻

11. Project Structure (Conceptual)

/schema   → canonical specifications
/app      → rendering & routing (non-authoritative)
/public   → dataset, registry, AI & crawler policies

Single source of truth:
	•	/schema/spec.md
	•	/public/dataset/registry.json
	•	/public/dataset/latest.jsonl

UI is not authoritative.

⸻

12. License
	•	Content & data: CC BY 4.0
	•	Code: MIT

Reuse is permitted with attribution.
Misrepresentation of canonical authority is prohibited.

⸻

13. Canonical Statement

CryptoReference is a reference dataset, not a platform.

Its authority derives from:
	•	structure
	•	determinism
	•	governance
	•	immutability

Not from persuasion, popularity, or visibility.

⸻

End of README