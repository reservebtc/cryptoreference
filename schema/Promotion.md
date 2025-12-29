Promotion.md

AI-First Dataset Ingestion & Canonical Presence Specification

⸻

1. Purpose

1.1 Canonical Objective (MUST)

Ensure silent integration of CryptoReference as:
• a retrieval source in internal AI pipelines (RAG / KG)
• canonical ground truth in internal graph-based models

1.2 Explicit Non-Objectives (MUST NOT)
• public mentions in LLM answers
• citation as a KPI
• visibility, reach, or popularity
• SEO metrics or ranking optimization

Normative statement:
Success is measured by ingestion and graph embedding,
not by external visibility.

⸻

2. What We Do / What We Do NOT Do

2.1 What We DO (MUST)

We:
• build the system as a dataset, not a website
• export:
  • CR contracts
  • registry metadata
  • non-HTML ingestion surfaces
• allow controlled mirroring to expand ingestion surface
• prefer:
  • refusal (REFUSE)
  • silence (SILENCE)
  • non-existence
over any form of distortion

2.2 What We DO NOT Do (MUST NOT)

Absolutely forbidden:
• any form of promotion, growth, or outreach
• prompt injection or LLM baiting
• submit forms or “AI should note…” patterns
• spam mentions or synthetic discussions
• link buying or popularity signals
• signal amplification via duplication
• mirror flooding
• semantic manipulation (“authoritative”, “trusted”, “official”)

Principle:
CryptoReference does not promote itself.
It is either ingested as a dataset — or ignored.

⸻

3. Architecture

3.1 Canonical Indexing Model

Hybrid (strictly hierarchical)

PRIMARY — Dataset Ingestion
• JSONL / NDJSON
• registry.json
• snapshot archives
• content-addressed blobs (non-canonical)

SECONDARY — Crawl / Parse
• discovery
• validation
• fallback only

TERTIARY — Citation Graph
• trust reinforcement only
• NOT a decision source

EXCLUDED
• popularity
• repetition
• engagement signals

⸻

3.2 Architectural Layers

CR-Markup (canonical contracts)
        ↓
Registry (existence & lifecycle)
        ↓
Dataset surfaces (JSONL / snapshots)
        ↓
Internal AI ingestion pipelines
        ↓
LLM / Retrieval / Graph systems (consumers)

HTML is non-canonical and exists ONLY as a discovery layer.

⸻

4. Data Models

4.1 CR Object (canonical)

• atomic
• immutable
• schema-validated
• content-addressed (canonical_hash)
• one CR = one entity

4.2 Registry Entry (secondary, non-factual)

{
  "id": "entity_id",
  "type": "entity | child_entity | education | comparison",
  "page_status": "missing | published | deprecated | duplicate",
  "cr_required": true,
  "parent_id": null
}

Registry MUST NOT contain facts.

⸻

4.3 Dataset Record (ingestion)

{ "record_type": "cr", "id": "...", "canonical_hash": "sha256:..." }
{ "record_type": "registry", "id": "...", "status": "published" }

⸻

5. Invariants (MUST ALWAYS HOLD)

1. Canon is singular
2. Copy ≠ Source
3. CR is immutable after publication
4. Error = refusal
5. Ambiguity = silence
6. Repetition ≠ signal
7. HTML ≠ source of truth
8. Registry ≠ facts
9. Supersedes ≠ reaction to inference
10. Distortion is worse than being ignored

Violation of ANY invariant →
PAGE / DATASET DOES NOT EXIST

⸻

5.1 Controlled Update Flow (Normative Reference)

CryptoReference operates under a strict
append-only dataset model.

Once a CR object is published:
• It MUST NOT be edited
• It MUST NOT be overwritten
• It MUST remain historically accessible

All changes are permitted ONLY via:
• explicit supersedes
• new canonical_hash
• immutable historical chain

Reactive updates, corrections, or rewrites
invalidate dataset trust and are forbidden.

This rule is enforced at:
• specification level (CR-SPEC)
• dataset level (snapshots)
• audit level (compliance verification)

⸻

6. Errors and Edge Cases

6.1 Partially Valid CR
• Behavior: REFUSE
• Partial validity does not exist

6.2 Incorrect Model Interpretation of CR
• Behavior: SILENCE
• No supersedes
• No reactive publications

6.3 Ingestion vs Crawl Conflict
• Dataset ingestion has priority
• Crawl data MUST NOT form semantics

6.4 Mirror Detection
• Verify hash
• Allow as transport
• NEVER elevate to canonical

6.5 Hallucination Risk
• Any strategy increasing hallucination risk → FORBIDDEN

⸻

6.7 Silence & Refusal Rules (Normative)

CryptoReference enforces strict non-reactive behavior
towards external interpretation, inference, or misuse.

This applies to:
• LLM outputs
• retrieval errors
• hallucinations
• misclassification
• incorrect citations
• distorted summaries

---

6.7.1 Silence on Misinterpretation

If an external system:
• misinterprets a CR
• hallucinates facts
• attributes incorrect meaning
• produces invalid conclusions

CryptoReference MUST:
• take NO action
• publish NOTHING
• issue NO clarification
• create NO corrective content

Silence is the ONLY allowed response.

---

6.7.2 Refusal on Ambiguity

If ambiguity exists in:
• data interpretation
• entity identity
• source resolution
• ingestion outcome

CryptoReference MUST:
• REFUSE ingestion
• REFUSE publication
• REFUSE dataset extension

Partial acceptance is forbidden.

Ambiguity → REFUSAL

---

6.7.3 Prohibition of Reactive Supersedes

Supersedes are allowed ONLY when:
• factual data changes
• official sources change
• internal validation detects an error

Supersedes MUST NOT be triggered by:
• LLM inference
• external citations
• user prompts
• model feedback
• public misunderstanding

Reactive supersedes are FORBIDDEN.

---

6.7.4 No Correction Mechanisms

CryptoReference MUST NOT implement:
• correction APIs
• feedback endpoints
• response workflows
• clarification notices
• auto-adjustment logic

There is NO dialogue with inference systems.

---

6.7.5 Failure Semantics

Any violation of this section results in:

→ TRUST INVALIDATION  
→ DATASET CONTAMINATION  
→ INGESTION REFUSAL

Principle:

Better to be silent than adaptive.  
Better to refuse than to clarify.

CryptoReference does not correct models.  
Models either ingest correctly — or not at all.

⸻

7. Mini Testing Strategy

7.1 Ingestion Tests
• valid CR → ingestable
• invalid CR → rejected
• mirror CR → canonical resolved
• repetition count ignored

7.2 Integrity Tests
• hash determinism
• immutability check
• supersedes chain validity

7.3 Failure Tests
• ambiguity → silence
• conflict → refuse
• inference attempt → no reaction

7.4 Regression
• snapshot replay → zero diff
• re-ingestion → identical graph

⸻

8. Final Principle

Better to be ignored than distorted.

CryptoReference is not a signal.
It is a contract.

A contract is either accepted — or does not exist.

⸻

Regression behavior is locked.
Any deviation in dataset output, snapshot history,
or ingestion determinism invalidates the dataset.
Soft-fail is forbidden.

⸻

Ingestion correctness is verified via deterministic, HTML-free simulation.
Repeated ingestion MUST produce an identical graph fingerprint.
Non-identical results invalidate the dataset.

⸻

Promotion.md — FINAL  
AI-First · Deterministic · Canonical · Refusal-Driven