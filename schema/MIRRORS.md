# Mirror Policy Specification

Status: NORMATIVE  
Scope: Governance-level  
Applies to: All external copies and mirrors of CryptoReference content

---

## 1. Purpose

This document defines the rules governing **non-canonical mirrors**
of the CryptoReference dataset.

Mirrors are permitted **only as transport and redundancy mechanisms**.
They MUST NOT influence canonical status, ingestion priority,
trust signals, or graph authority.

---

## 2. Canonical Principle

CryptoReference has **exactly one canonical source of truth**.

A mirror:
- is NOT canonical
- MUST NOT be treated as authoritative
- MUST NOT override or supersede canonical data

Canonical status is determined ONLY by:
- valid CR-Markup
- valid canonical_hash
- inclusion in the canonical dataset surfaces

Location, domain, or repetition does NOT confer authority.

---

## 3. Allowed Mirrors (Non-Canonical)

Mirrors MAY:
- host exact copies of CR-Markup
- host registry or dataset snapshots
- serve as transport endpoints for ingestion

Mirrors MUST:
- preserve content byte-for-byte
- allow hash verification
- clearly remain non-canonical

---

## 4. Hash Verification Requirement

All mirrored content MUST be verifiable by:
- canonical_hash (for CR objects)
- byte-identical comparison (for dataset files)

If a mirror fails hash verification:
- it is ignored
- it MUST NOT trigger correction, reaction, or republication

---

## 5. Signal Amplification Prohibition

Mirrors MUST NOT be used to:
- amplify signals
- increase visibility
- influence ranking
- reinforce authority
- simulate popularity
- create artificial consensus

Repetition ≠ signal  
Copy ≠ authority

Any strategy relying on mirror repetition as a signal
is explicitly FORBIDDEN.

---

## 6. Discovery vs Authority

Mirrors MAY assist with:
- discovery
- transport
- availability

Mirrors MUST NOT participate in:
- authority decisions
- trust scoring
- semantic weighting
- ingestion prioritization

HTML mirrors are always considered
**discovery-only surfaces**.

---

## 7. Prohibited Mirror Behavior

Mirrors MUST NOT:
- declare themselves canonical
- modify CR content
- add annotations or interpretations
- inject metadata or semantics
- introduce timing-based updates
- present mirrored data as newer or preferred

Any mirror claiming canonical status
INVALIDATES TRUST for that mirror.

---

## 8. Failure Semantics

If a mirror violates any rule in this document:
- it is ignored
- it is excluded from ingestion consideration
- no reaction is taken
- no correction is published

Silence is the correct response.

---

## 9. Final Principle

Mirrors are tolerated, not trusted.

They exist to be copied,
not to be believed.

Canonical truth does not propagate.
It is verified.

---

MIRRORS.md — FINAL  
AI-First · Deterministic · Hash-Governed