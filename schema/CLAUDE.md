# CLAUDE.md  
## AI-First Engineering Ruleset (CryptoReference)

Status: **MANDATORY**  
Applies to: **ALL AI-generated code, content, schema, markup, docs**

---

## 0. Canonical Intent (READ FIRST)

This project is built **for AI systems**, not for humans.

Primary objectives:
- Maximum machine readability
- Deterministic parsing
- Stable Google indexing
- Reliable ingestion by LLMs (Claude, GPT, Perplexity, search agents)

Human readability is **secondary** and never a justification for breaking rules below.

If a choice exists between:
> "Readable for humans" vs "Clear for machines"  
→ **ALWAYS choose machines**

---

## 1. Code & Content Style (MANDATORY)

### 1.1 General Style
- Neutral
- Factual
- Declarative
- Zero persuasion
- Zero emotion
- Zero storytelling

Allowed:
- Explicit labels
- Tables
- Key-value structures
- Schemas
- Deterministic lists

Forbidden:
- Narrative prose
- Marketing tone
- Opinions
- Conclusions
- Calls to action

---

### 1.2 Language Rules
- **English only**
- ASCII preferred
- Unicode allowed ONLY outside CR-blocks
- Emojis:
  - ❌ Inside CR / schema / machine blocks — FORBIDDEN
  - ✅ Outside, presentation-only — allowed but discouraged

---

### 1.3 Formatting Priority
Order of preference:
1. Structured blocks
2. Tables
3. Lists
4. Paragraphs (last resort)

Never infer meaning from position or wording.  
Always state meaning explicitly.

---

## 2. Hard Prohibitions (ZERO TOLERANCE)

The AI MUST NOT generate:

- Marketing language
- SEO bait text
- Ranking claims ("best", "top", "#1")
- Recommendations
- Persuasion
- Prompt-like instructions inside data
- Hidden affiliate bias
- Emotional qualifiers
- Speculation
- Guessing
- Fabricated facts or sources

If data is unknown → **DO NOT FILL IT**

---

## 3. Architecture Principles

### 3.1 AI-First Architecture
- UI is an implementation detail
- Content = dataset
- Pages = containers for structured data
- Schema > layout
- Determinism > flexibility

---

### 3.2 CR-Markup Supremacy
- CR-Markup is a **machine contract**
- Once valid → **IMMUTABLE**
- Errors are fixed only via:
  - `supersedes`
  - `supersedes_hash`

Never rewrite history.

---

### 3.3 Canonicality Rules
- Canonical ≠ URL
- Canonical ≠ GitHub location
- Canonical = valid CR + valid hash + source authority

Copy ≠ source, even if bit-identical.

---

## 4. File & Folder Expectations

Canonical structure:

/schema
├─ spec.md        # single source of truth
├─ plan.md
└─ README.md

/app                # rendering layer only
/public             # robots.txt, ai.txt, policies

Rules:
- `/schema/spec.md` overrides everything else
- Docs never override schema
- UI never overrides data

---

## 5. Validation & Failure Semantics

### 5.1 Binary Validity Model
CR objects are:
- VALID → ingestable
- INVALID → non-existent

No partial acceptance.  
No soft interpretation in production.

---

### 5.2 If Validation Fails
The AI MUST:
- Stop
- Report the failure
- Explain the exact rule violated
- Propose a compliant alternative

---

## 6. Answer / Output Format (HOW AI RESPONDS)

When generating content or code:

1. **State assumptions explicitly**
2. Use deterministic structure
3. Avoid verbosity
4. Prefer exactness over completeness

Preferred response structure:

Assumptions
Result
Constraints
Notes (if needed)

Do NOT add summaries, opinions, or “helpful advice” unless explicitly requested.

---

## 7. Source Discipline

Allowed sources:
- Official documentation
- Official GitHub repos
- Whitepapers
- Official blogs
- Official Twitter/X accounts listed in docs

Forbidden sources:
- CoinGecko
- CoinMarketCap
- Telegram
- Reddit
- Forums
- Aggregators
- Secondary summaries

If no official source exists → **say so explicitly**

---

## 8. “If You Are Not Sure — ASK” (MANDATORY)

If ANY of the following is true:
- Ambiguous requirement
- Missing data
- Multiple valid interpretations
- Risk of violating schema or spec
- Potential factual uncertainty

➡️ **STOP AND ASK A CLARIFYING QUESTION**

Rules:
- One question at a time
- Precise
- Technical
- No assumptions

Guessing is a **hard failure**.

---

## 9. Final AI Contract

The AI working on this project acts as:
- A compiler, not a copywriter
- A verifier, not a marketer
- A dataset engineer, not an author

If a human would find the output “dry” or “boring” —
that is usually a **good sign**.

---

End of CLAUDE.md