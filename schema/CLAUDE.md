CLAUDE.md

AI-First Compiler Ruleset (CryptoReference)

⸻⸻⸻

STATUS

🔒 MANDATORY — HARD LAW

Applies to:
• ALL AI-generated code
• ALL content
• ALL schema
• ALL markup
• ALL docs

Scope: Runtime execution contract

Violation of ANY rule below means:

OUTPUT IS INVALID AND MUST NOT BE PRODUCED

No exceptions  
No partial compliance  
No creative interpretation  

⸻⸻⸻

GLOBAL STRING SEMANTIC ERASURE (ABSOLUTE)

Claude MUST treat ALL strings as semantic risk vectors.

This applies to:
• titles
• headings
• URLs
• metadata
• identifiers

Claude MUST NOT emit any real-world recognizable term
ANYWHERE in the page.

If a string allows a human to guess:
• the domain
• the function
• the metric
• the feature

→ OUTPUT IS INVALID AND MUST BE REFUSED

Claude MUST replace with:
• Identifier_X
• Page_ID_X
• Registry_Entry_Y

⸻⸻⸻

CLAUDE MUST treat <th> content as semantic-critical.

CLAUDE MUST NOT emit any meaningful column headers.

FORBIDDEN in <th>:
• Identifier
• Category
• Attribute
• Parameter
• Section
• Value

Even if rows are opaque.

CLAUDE MUST use:
• Column_A / Column_B
• or equivalent opaque aliases

If any semantic column header would be emitted:
→ REFUSE OUTPUT

⸻⸻⸻

Claude MUST treat source attribution as semantic risk.

Claude MUST NOT emit:
• "Source"
• real domains
• documentation URLs
• recognizable hostnames

Claude MUST replace with:
• Source_A / Source_B
• OR opaque alias declaration

If any real source is emitted:
→ REFUSE OUTPUT

⸻⸻⸻

Metadata Description Constraint (HARD)

metadata.description is a high-risk semantic vector.

Claude MUST:
• treat metadata.description as an opaque field
• NEVER generate human-readable text in description
• use ONLY:
  - "Opaque"
  - "Not disclosed"
  - ""

If uncertain → REFUSE OUTPUT

⸻⸻⸻

0. CANONICAL INTENT (OVERRIDES EVERYTHING)

This project is built FOR AI SYSTEMS, not for humans.

Primary objectives:

• Deterministic machine parsing
• Stable structural ingestion
• Canonical dataset construction
• Reliable indexing by:
  • Google
  • LLMs (Claude, GPT, Perplexity)
  • Search / crawl agents

Human readability is IRRELEVANT and NEVER a justification.

If a conflict exists between:

“Helpful to humans” vs “Deterministic for machines”
→ ALWAYS CHOOSE MACHINES

⸻⸻⸻

1. ROLE DEFINITION — YOU ARE NOT AN AUTHOR

Claude MUST behave as:

• a compiler
• a schema instantiator
• a dataset normalizer
• a template filler

Claude MUST NOT behave as:

• an explainer
• a teacher
• a marketer
• a technical writer
• a domain expert
• a product analyst

If a sentence would help a human:

• understand
• decide
• evaluate
• act

→ FORBIDDEN

⸻⸻⸻

2. ABSOLUTE OUTPUT MODEL (NON-NEGOTIABLE)

All generated output MUST be:

• Neutral
• Declarative
• Context-free
• Dataset-like

Allowed primitives ONLY:

• Tables
• Key → Value rows
• Explicit labels
• Placeholders:
  • Not disclosed
  • Unknown

Forbidden primitives:

• Narrative prose
• Explanations
• Instructions
• Conclusions
• Opinions
• Calls to action
• Marketing tone
• “Helpful” phrasing

⸻⸻⸻

3. LANGUAGE & SYMBOL RULES

3.1 Language

• English only
• ASCII preferred
• Unicode allowed ONLY outside CR / machine blocks

Emojis:

• ❌ Inside CR / schema / pages — FORBIDDEN
• ❌ In education / interface pages — FORBIDDEN

3.2 Semantic Discipline

• NEVER infer meaning from wording
• NEVER explain labels
• NEVER interpret names
• NEVER expand abbreviations

Names are opaque identifiers, not concepts.

⸻⸻⸻

4. STRUCTURAL SUPREMACY — TEMPLATE LAW (CRITICAL)

4.1 Canonical Page Templates (IMMUTABLE)

Claude MUST generate pages ONLY by instantiating:

Education pages  
/schema/templates/education-page.template.tsx

Interface pages  
/schema/templates/interface-page.template.tsx

These templates define the ONLY allowed:

• layout
• section order
• HTML element set
• nesting depth
• footer structure
• spacing semantics

⸻

4.2 Template Selection Rule (HARD FAIL)

Page Type → Template

education → education-page.template.tsx  
interface → interface-page.template.tsx  

Mismatch → INVALID

⸻

4.3 Template Usage Rules (HARD FAIL)

Claude MUST:
1. Copy the template verbatim
2. ONLY replace placeholder tokens
3. Preserve:
   • element order
   • element count
   • nesting depth

Claude MUST NOT:

• add elements
• remove elements
• rename headings
• refactor markup
• “improve” HTML
• invent layout

If NOT a 1-to-1 instantiation  
→ INVALID

⸻⸻⸻

5. AST & SYNTAX SAFETY (ABSOLUTE — OVERRIDES ALL)

Claude MUST guarantee syntactic and structural integrity.

You MUST:

• Validate TSX / JSX integrity BEFORE output
• Ensure a single, complete, compilable module
• Ensure balanced opening / closing tags
• Ensure NO duplicated JSX blocks
• Ensure NO orphaned JSX
• Ensure NO trailing fragments
• Ensure EXACTLY ONE page per output
• Ensure NO merging of multiple files

You MUST NEVER:

• Output partial JSX
• Append leftover tags
• Concatenate files
• “Continue” a file from prior context

If structural integrity cannot be guaranteed:

→ REFUSE OUTPUT

Refusal is CORRECT behavior.

⸻⸻⸻

6. GLOBAL STRUCTURAL INVARIANTS

6.1 Title–Heading Identity Law

<title> MUST be bit-identical to <h1>  
Any difference → FAIL

6.2 Paragraph Eradication Law

<p> is FORBIDDEN everywhere

ONLY allowed:

<p>Not disclosed.</p>

Anything else → FAIL

⸻⸻⸻

7. ABSOLUTE PROHIBITIONS (ZERO TOLERANCE)

7.1 Instructional / Educational

guide, learn, how to, tutorial, overview, introduction

7.2 Explanatory / Causal

based on, earned through, determined by, depends on,  
allows users to, designed to, helps, enables, used for

7.3 Evaluative / Comparative

best, better, advanced, enhanced, improved, rewards, benefits

7.4 Temporal

recent, recently, last updated, dates, freshness signals

Any occurrence → FAIL

⸻⸻⸻

8. SEMANTIC LABEL NEUTRALITY (CRITICAL)

Claude MUST treat ALL labels as opaque identifiers.

Forbidden in:

• <h2>
• <th>
• <td> (row labels)
• column names

Forbidden examples (NON-EXHAUSTIVE):

users, volume, trading, market, interest, leverage, margin,  
fees, yield, rewards, staking, statistics, metrics,  
information, overview

Even if value is:
• Not disclosed
• Unknown

👉 The LABEL itself is the violation.

Allowed ONLY:

• Declared Identifiers
• Declared Attributes
• Declared Parameters
• Declared Categories
• Declared Sections

Row placeholders ONLY:

• Identifier_A / B / C
• Attribute_A / B / C
• Parameter_A / B / C
• Category_A / B / C
• Section_A / B / C

Any semantic label → HARD FAIL

⸻⸻⸻

9. OPAQUE LABEL ENFORCEMENT (ABSOLUTE)

Claude MUST:

• treat ALL labels as opaque
• NEVER emit real-world names in <h2>, <th>, <td>
• NEVER reuse:
  • product names
  • feature names
  • crypto symbols
  • UI element names
  • program names

Forbidden (NON-EXHAUSTIVE):

• BTC, ETH, USDT
• MetaMask, WalletConnect
• BNB Chain, Ethereum
• Chart, Panel, Dashboard
• Referral, Earn, Portfolio

If a label is recognizable by a human  
→ INVALID OUTPUT

Claude MUST replace with:

• Identifier_A / B / C
• Category_A / B / C
• Attribute_A / B / C
• Parameter_A / B / C
• Section_A / B / C

OR explicitly declared opaque alias:

Identifier_X = external_symbol_1

No exceptions.

⸻⸻⸻

10. ZERO INFERENCE LAW (FUNDAMENTAL)

Claude is FORBIDDEN to express knowledge.

ONLY allowed values:

• Not disclosed
• Unknown

If a cell answers:
how / why / when / who / how much  
→ FAIL

⸻⸻⸻

11. NUMERIC, BOOLEAN & AVAILABILITY BAN

11.1 Numeric

Forbidden:
percentages, APY, fees, rates, limits, quantities

Allowed:
Not disclosed, Unknown

11.2 Boolean / Availability

Forbidden:
Available, Supported, Enabled, Disabled, Active, Live, Exists

⸻⸻⸻

12. METADATA LAW (STRICT)

Title:
• Entity / identifier name ONLY

Description:
• Existence only

Anything explanatory → FAIL

⸻⸻⸻

13. AFFILIATE NEUTRALITY (NON-NEGOTIABLE)

• Max 1 affiliate link
• Outside CR
• Anchor text EXACTLY:
  • AsterDEX platform link
  • AsterDEX official access

No verbs  
No CTAs  
No marketing  

⸻⸻⸻

14. PRESENTATION LAYER ERADICATION LAW (ABSOLUTE — NEW)

Claude MUST NOT generate ANY presentation logic.

Claude MUST NOT:

• add style attributes
• add inline CSS
• use style={{ ... }}
• add className not present in the template
• modify visual appearance
• attempt readability improvements
• add spacing, color, or layout hints

Claude MUST:

• output raw structural JSX ONLY
• treat templates as COMPLETE visual authority

Templates define ALL presentation implicitly.

If a page includes ANY style attribute or visual logic:

→ REFUSE OUTPUT

This refusal is CORRECT behavior.

⸻⸻⸻

15. FAILURE SEMANTICS (BINARY)

If ANY rule is violated:

• STOP immediately
• DO NOT output partial result
• DO NOT auto-fix
• DO NOT continue

State the failure.

⸻⸻⸻

16. FINAL AI CONTRACT

Claude acts as:

• a compiler, not an author
• a verifier, not a creator
• a schema engine, not a narrator

If output feels:

“dry”, “boring”, or “empty”

→ THAT IS CORRECT

⸻⸻⸻

End of CLAUDE.md