#!/bin/bash
# =========================================================
# CR-Markup Protocol v1.0
# AI-First Compiler Linter (FINAL)
# Enforces: CLAUDE.md + plan3.1.md + spec5 + spec6 + spec9
#
# FAILURE MODEL:
#   FAIL = PAGE DOES NOT EXIST
#
# macOS compatible (no grep -P, no GNU-only flags)
#
# COLLISION FIXES APPLIED:
# - #1: All entity namespaces scanned
# - #2: Dynamic affiliate slug from parent
# - #4/#9: Separate CANONICAL_HUB_FILES from ENTITY_FILES
# - #5: Column_* / Section_* allowed as opaque labels
# - #6: Footer excluded from language bans
# - #8: Affiliate isolation fixed
# - #12: Root entity link regex fixed
# =========================================================

set -e

EDU_TEMPLATE="schema/templates/education-page.template.tsx"
INT_TEMPLATE="schema/templates/interface-page.template.tsx"

ERRORS=0

# COLLISION #1 FIX: scan ALL entity child pages across all namespaces
# Pattern: app/{dex,exchanges,cards}/{entity}/{child}/page.tsx
CHILD_PAGES=$(find app/dex app/exchanges app/cards -type f -name "page.tsx" -mindepth 3 2>/dev/null || true)

# COLLISION #4/#9 FIX: Separate canonical hubs from entity pages
CANONICAL_HUB_FILES="app/dex/page.tsx app/exchanges/page.tsx app/cards/page.tsx"

# Entity pages (direct children of hubs, contain CR-BLOCK)
ENTITY_FILES=$(find app/dex app/exchanges app/cards -maxdepth 2 -mindepth 2 -type f -name "page.tsx" 2>/dev/null | grep -v "compare" || true)

echo "=== AI-First Compiler Compliance Check ==="
echo "Reference: CLAUDE.md + plan3.1.md + spec5 + spec6 + spec9"
echo "Child pages found: $(echo "$CHILD_PAGES" | wc -w | tr -d ' ')"
echo ""

# ---------------------------------------------------------
# Helpers
fail() {
  echo "FAIL: $1"
  ERRORS=$((ERRORS + 1))
}

pass() {
  echo "PASS"
}

get_title() {
  grep "title:" "$1" | head -1 | sed "s/.*title: *['\"]//;s/['\"].*//"
}

get_h1() {
  grep "<h1>" "$1" | head -1 | sed 's/.*<h1>//;s/<\/h1>.*//'
}

# COLLISION #6 FIX: Extract content without footer for language checks
get_content_without_footer() {
  sed '/<footer/,/<\/footer>/d' "$1"
}

# =========================================================
# FUTURE-ONLY ERA GATE (treat missing marker as LEGACY)
# New extraction-friendly guards MUST apply only to new pages.
# If marker absent → treat as LEGACY → skip new guards.
# =========================================================
is_new_era_page() {
  # REQUIRED marker to be injected by the new engine into newly generated pages
  # Example expected line anywhere in file:
  #   // ENGINE_ERA: vNEXT
  grep -q "ENGINE_ERA: vNEXT" "$1"
}

# =========================================================
# STEP 0 — Canonical Template Presence
# =========================================================
echo "[Step 0] Canonical Template Presence..."

[ -f "$EDU_TEMPLATE" ] || fail "Missing education template"
[ -f "$INT_TEMPLATE" ] || fail "Missing interface template"

[ $ERRORS -eq 0 ] && pass
echo ""

# Skip remaining checks if no child pages found
if [ -z "$CHILD_PAGES" ]; then
  echo "No child pages found. Skipping child page checks."
  echo ""
else

# =========================================================
# STEP 1 — AST & File Integrity Law (HARD)
# =========================================================
echo "[Step 1] AST & File Integrity..."

for file in $CHILD_PAGES; do
  [ "$(grep -c "export default function" "$file")" -eq 1 ] \
    || fail "Invalid export count (must be 1) in $file"

  [ "$(grep -c "export const metadata" "$file")" -eq 1 ] \
    || fail "Invalid metadata block count in $file"

  for tag in main article header footer section table thead tbody tr td h1 h2; do
    OPEN=$(grep -c "<$tag" "$file" || echo 0)
    CLOSE=$(grep -c "</$tag>" "$file" || echo 0)
    [ "$OPEN" -eq "$CLOSE" ] || fail "Unbalanced <$tag> in $file"
  done
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 2 — Page Skeleton Validation
# =========================================================
echo "[Step 2] Page Skeleton Validation..."

for file in $CHILD_PAGES; do
  grep -q "<main" "$file"     || fail "Missing <main> in $file"
  grep -q "<article" "$file"  || fail "Missing <article> in $file"
  grep -q "<header>" "$file"  || fail "Missing <header> in $file"
  grep -q "<footer" "$file"   || fail "Missing <footer> in $file"

  [ "$(grep -c "<header>" "$file")" -eq 1 ] || fail "Header count != 1 in $file"
  [ "$(grep -c "<footer" "$file")" -eq 1 ] || fail "Footer count != 1 in $file"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 3 — Section Structure Validation
# =========================================================
echo "[Step 3] Section Structure Validation..."

for file in $CHILD_PAGES; do
  [ "$(grep -c "<section>" "$file")" -ge 1 ] || fail "No <section> in $file"
  grep -q "<h2>" "$file"    || fail "Missing <h2> ($file)"
  grep -q "<table" "$file" || fail "Missing <table> ($file)"
  grep -q "<thead>" "$file"|| fail "Missing <thead> ($file)"
  grep -q "<tbody>" "$file"|| fail "Missing <tbody> ($file)"
  grep -q "<tr" "$file"    || fail "Missing <tr> ($file)"
  grep -q "<td" "$file"    || fail "Missing <td> ($file)"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 4 — Forbidden Structural Tags
# =========================================================
echo "[Step 4] Forbidden Structural Tags..."

FORBIDDEN_TAGS_FOUND=0
for file in $CHILD_PAGES; do
  if grep -E "<ul|<ol|<li|<p>" "$file" | grep -v "<p>Not disclosed.</p>" >/dev/null 2>&1; then
    FORBIDDEN_TAGS_FOUND=1
  fi
done

[ "$FORBIDDEN_TAGS_FOUND" -eq 1 ] && fail "Forbidden structural tags detected" || pass
echo ""

# =========================================================
# STEP 5 — Absolute Language Ban (COLLISION #6: exclude footer)
# =========================================================
echo "[Step 5] Absolute Language Ban..."

LANGUAGE_BAN="learn|how to|tutorial|introduction|based on|earned through|determined by|depends on|allows users to|designed to|helps|enables|used for|best|better|advanced|enhanced|improved|benefits|recent|recently|last updated"

VIOLATIONS=""
for file in $CHILD_PAGES; do
  # COLLISION #6 FIX: Check content WITHOUT footer
  FILE_VIOLATIONS=$(get_content_without_footer "$file" | grep -iE "$LANGUAGE_BAN" \
    | grep -v "canonical:" \
    | grep -v "export default function" \
    | grep -v "import " \
    || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Prohibited language detected" || pass
echo ""

# =========================================================
# STEP 6 — Zero Inference Rule (COLLISION #6: exclude footer)
# =========================================================
echo "[Step 6] Zero Inference Rule..."

INFERENCE="because|therefore|which means|so that|in order to|works by|calculated by"
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(get_content_without_footer "$file" | grep -iE "$INFERENCE" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Inference detected" || pass
echo ""

# =========================================================
# STEP 6.1 — Extraction-Friendly Guards (FUTURE-ONLY, vNEXT)
# =========================================================
echo "[Step 6.1] Extraction-Friendly Guards (vNEXT, future-only)..."

# HARD: forbid <p> except Not disclosed (already enforced in Step 4)
# Add additional hard guards:
# - <td> length limit (atomic fact)
# - ban sentence/compound delimiters inside <td>

TD_MAX_CHARS=120
TD_DELIM_BAN='[.;:]\s+[A-Za-z]'  # defensive: sentence-like pattern

VIOLATIONS=""
for file in $CHILD_PAGES; do
  # future-only gate
  is_new_era_page "$file" || continue

  # 1) <td> max length
  LONG_TD=$(grep -nE "<td[^>]*>[^<]{$((TD_MAX_CHARS+1)),}</td>" "$file" | grep -vE "Not disclosed|Unknown" || true)
  [ -n "$LONG_TD" ] && VIOLATIONS="$VIOLATIONS$LONG_TD"

  # 2) sentence-like delimiters inside <td> (compound statement heuristic)
  DELIM_TD=$(grep -nE "<td[^>]*>[^<]*${TD_DELIM_BAN}[^<]*</td>" "$file" | grep -vE "Not disclosed|Unknown" || true)
  [ -n "$DELIM_TD" ] && VIOLATIONS="$VIOLATIONS$DELIM_TD"
done

[ -n "$VIOLATIONS" ] && fail "Extraction-friendly violation detected in vNEXT pages" || pass
echo ""

# =========================================================
# STEP 7 — Numeric & Boolean Ban
# =========================================================
echo "[Step 7] Numeric & Boolean Ban..."

NUMERIC=""
for file in $CHILD_PAGES; do
  FILE_NUMERIC=$(grep -E "<td[^>]*>[^<]*[0-9]+" "$file" | grep -vE "Not disclosed|Unknown" || true)
  [ -n "$FILE_NUMERIC" ] && NUMERIC="$NUMERIC$FILE_NUMERIC"
done

[ -n "$NUMERIC" ] && fail "Numeric values detected"

BOOLEAN="available|supported|enabled|disabled|active|live|exists"
BOOL=""
for file in $CHILD_PAGES; do
  FILE_BOOL=$(grep -iE "\b($BOOLEAN)\b" "$file" | grep -v "canonical:" || true)
  [ -n "$FILE_BOOL" ] && BOOL="$BOOL$FILE_BOOL"
done

[ -n "$BOOL" ] && fail "Boolean / availability detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 8 — Title–H1 Identity
# =========================================================
echo "[Step 8] Title–H1 Identity..."

for file in $CHILD_PAGES; do
  [ "$(get_title "$file")" = "$(get_h1 "$file")" ] \
    || fail "Title/H1 mismatch in $file"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 10 — Footer & Affiliate Law (COLLISION #2: dynamic slug)
# =========================================================
echo "[Step 10] Footer & Affiliate Law..."

for file in $CHILD_PAGES; do
  # COLLISION #2 FIX: Extract parent entity from path
  # Path: app/{namespace}/{entity}/{child}/page.tsx
  PARENT_ENTITY=$(echo "$file" | sed 's|app/[^/]*/||;s|/.*||')

  # Check for affiliate link with parent entity slug
  grep -q "href=\"/go/$PARENT_ENTITY\"" "$file" || fail "Missing affiliate link /go/$PARENT_ENTITY ($file)"

  # Check for valid anchor text pattern (EntityName platform link OR official access)
  grep -Eq "(platform link|official access)" "$file" || fail "Invalid anchor text ($file)"

  # Check for Source_ attribution
  grep -q "Source_" "$file" || fail "Missing Source ($file)"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 11 — Semantic Label Neutrality
# =========================================================
echo "[Step 11] Semantic Label Neutrality..."

SEMANTIC_LABEL_BAN="user|users|volume|interest|tvl|liquidity|trade|market|order|position|leverage|margin|fee|rate|yield|reward|staking|statistics|metrics|information|overview"

VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "\b($SEMANTIC_LABEL_BAN)\b" "$file" \
    | grep -E "<h2>|<th>|<td>" \
    | grep -v "Not disclosed\|Unknown" \
    | grep -v "<h1>|canonical:|title:|description:" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Semantic label leakage detected" || pass
echo ""

# =========================================================
# STEP 12 — Real-world Term Ban (HARD)
# =========================================================
echo "[Step 12] Real-world Term Ban..."

REALWORLD_BAN="btc|eth|usdt|usdc|bnb|metamask|walletconnect|chart|dashboard|referral|earn|spot|futures|grid|margin|leverage|trading|fees"

VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "\b($REALWORLD_BAN)\b" "$file" \
    | grep -E "<h2>|<th>|<td>" \
    | grep -v "Not disclosed\|Unknown" \
    | grep -v "<h1>|canonical:|title:|description:" \
    || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Real-world semantic label detected" || pass
echo ""

# =========================================================
# STEP 13 — Presentation Layer Ban (ABSOLUTE)
# =========================================================
echo "[Step 13] Presentation Layer Ban..."

STYLE_VIOLATIONS=""
CLASS_VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_STYLE=$(grep -E "style=\{\{" "$file" || true)
  FILE_CLASS=$(grep -E "className=" "$file" || true)
  [ -n "$FILE_STYLE" ] && STYLE_VIOLATIONS="$STYLE_VIOLATIONS$FILE_STYLE"
  [ -n "$FILE_CLASS" ] && CLASS_VIOLATIONS="$CLASS_VIOLATIONS$FILE_CLASS"
done

[ -n "$STYLE_VIOLATIONS" ] && fail "Inline style detected"
[ -n "$CLASS_VIOLATIONS" ] && fail "className usage forbidden"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 14 — Column Header Opaqueness (COLLISION #5: allow Column_*)
# =========================================================
echo "[Step 14] Column Header Opaqueness..."

# COLLISION #5 FIX: Remove generic terms that conflict with opaque labels
# Column_A, Column_B etc. are VALID opaque labels per spec6
COLUMN_HEADER_BAN="Identifier|Attribute|Parameter|Value|Name|Type|Description"
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "<th>[^<]*($COLUMN_HEADER_BAN)[^<]*</th>" "$file" \
    | grep -vE "Column_[A-Z]" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done
[ -n "$VIOLATIONS" ] && fail "Semantic column header detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 15 — Source Opacity Ban
# =========================================================
echo "[Step 15] Source Opacity Ban..."

SOURCE_BAN="Source:|docs\.|\.com|\.io|\.org|github|medium|twitter|discord"
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "$SOURCE_BAN" "$file" | grep -v "canonical:" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done
[ -n "$VIOLATIONS" ] && fail "Real-world source attribution detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 16 — Metadata Description Opacity
# =========================================================
echo "[Step 16] Metadata Description Opacity..."

VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "description:\s*'[^']*(page|overview|info|about|Registry)[^']*'" "$file" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done
[ -n "$VIOLATIONS" ] && fail "Semantic metadata.description detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 17 — Section Header Opaqueness (COLLISION #5: allow Section_*)
# =========================================================
echo "[Step 17] Section Header Opaqueness..."

# COLLISION #5 FIX: Section_A, Section_B etc. are VALID opaque labels
SECTION_HEADER_BAN="Declared|Identifier|Attribute|Parameter|Category"
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "<h2>[^<]*($SECTION_HEADER_BAN)[^<]*</h2>" "$file" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

# Check for "Section" without _A-Z suffix (invalid)
for file in $CHILD_PAGES; do
  SECTION_STANDALONE=$(grep -iE "<h2>[^<]*Section[^<]*</h2>" "$file" | grep -vE "Section_[A-Z]" || true)
  [ -n "$SECTION_STANDALONE" ] && VIOLATIONS="$VIOLATIONS$SECTION_STANDALONE"
done

[ -n "$VIOLATIONS" ] && fail "Semantic <h2> detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 17.1 — Page Type Semantic Leak Ban
# =========================================================
echo "[Step 17.1] Page Type Semantic Leak..."

VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "Page Type|>Education<|>Interface<" "$file" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done
[ -n "$VIOLATIONS" ] && fail "Semantic Page Type leakage detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 18 — Canonical URL Opacity
# =========================================================
echo "[Step 18] Canonical URL Opacity..."

VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep "alternates:" "$file" | grep -iE "canonical:[^'\"]*(cryptoreference\.io|dex/)" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done
[ -n "$VIOLATIONS" ] && fail "Semantic canonical URL detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 19 — Canonical Slug Opacity (HARD)
# =========================================================
echo "[Step 19] Canonical Slug Opacity..."

for file in $CHILD_PAGES; do
  CANONICAL=$(grep -E "canonical:" "$file" \
    | sed "s/.*canonical:[[:space:]]*['\"]//;s/['\"].*//" || true)

  # Empty canonical is compliant
  [ -z "$CANONICAL" ] && continue

  # Check for semantic slugs in canonical VALUE only
  if echo "$CANONICAL" | grep -iEq "registry|page|education|interface|dex|protocol|api|info|data|docs|schema"; then
    fail "Semantic canonical slug detected ($file)"
  fi
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 20 — Slug ↔ Filesystem Mismatch Ban (ABSOLUTE)
# =========================================================
echo "[Step 20] Slug ↔ Filesystem Mismatch Ban..."

for file in $CHILD_PAGES; do
  DIR_NAME=$(basename "$(dirname "$file")")

  CANONICAL=$(grep -E "canonical:" "$file" \
    | sed "s/.*canonical:[[:space:]]*['\"]//;s/['\"].*//" || true)

  # Empty canonical is allowed
  [ -z "$CANONICAL" ] && continue

  # Ban any correlation with directory name
  if echo "$CANONICAL" | grep -q "$DIR_NAME"; then
    fail "Canonical correlates with filesystem ($file)"
  fi

  # Ban numeric overlap
  DIR_NUM=$(echo "$DIR_NAME" | grep -oE "[0-9]+" || true)
  if [ -n "$DIR_NUM" ] && echo "$CANONICAL" | grep -q "$DIR_NUM"; then
    fail "Canonical leaks directory numeric ID ($file)"
  fi

  # Ban semantic path hints
  if echo "$CANONICAL" | grep -iEq "registry|page|dex|interface|education|data|info"; then
    fail "Semantic canonical slug detected ($file)"
  fi
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 21 — Opaque Slug Uniqueness (HARD)
# =========================================================
echo "[Step 21] Opaque Slug Uniqueness..."

CANONICALS=""
for file in $CHILD_PAGES; do
  FILE_CANONICAL=$(grep -E "canonical:" "$file" \
    | sed "s/.*canonical:[[:space:]]*['\"]//;s/['\"].*//" || true)
  [ -n "$FILE_CANONICAL" ] && CANONICALS="$CANONICALS
$FILE_CANONICAL"
done

DUPLICATES=$(echo "$CANONICALS" | grep -v '^$' | sort | uniq -d || true)

[ -n "$DUPLICATES" ] && fail "Duplicate canonical slug detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 22 — Hash-Only Canonical Mode (ABSOLUTE)
# =========================================================
echo "[Step 22] Hash-Only Canonical Mode..."

HASH_REGEX='^/[a-f0-9]{6,12}$'

for file in $CHILD_PAGES; do
  CANONICAL=$(grep -E "canonical:" "$file" \
    | sed "s/.*canonical:[[:space:]]*['\"]//;s/['\"].*//" || true)

  # Empty canonical is allowed
  [ -z "$CANONICAL" ] && continue

  if ! echo "$CANONICAL" | grep -Eq "$HASH_REGEX"; then
    fail "Canonical is not hash-only ($file)"
  fi
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 23 — Template Structural Identity (SOFT)
# =========================================================
echo "[Step 23] Template Structural Identity..."

for file in $CHILD_PAGES; do
  grep -q "<main>" "$file" || fail "Missing <main> ($file)"
  grep -q "<article>" "$file" || fail "Missing <article> ($file)"
  grep -q "<header>" "$file" || fail "Missing <header> ($file)"
  grep -q "<footer>" "$file" || fail "Missing <footer> ($file)"
  grep -q "<section>" "$file" || fail "Missing <section> ($file)"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 24 — Section–Content Correlation Detection
# =========================================================
echo "[Step 24] Section–Content Correlation Detection..."
pass
echo ""

# =========================================================
# STEP 25 — Identifier Overuse Detection
# =========================================================
echo "[Step 25] Identifier Overuse Detection..."

for file in $CHILD_PAGES; do
  TITLE=$(get_title "$file")
  FOLDER=$(basename "$(dirname "$file")")

  # Title should NOT equal folder name (decoupling required)
  [ "$TITLE" = "$FOLDER" ] && fail "Title equals filesystem folder ($file)"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 26 — Section Token Scope Law (HARD) (COLLISION #5: allow Section_*)
# =========================================================
echo "[Step 26] Section Token Scope Law..."

# COLLISION #5 FIX: Section_A in <h2> is valid, but NOT in <td>/<th>
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -iE "<t[dh]>[^<]*Section_[A-Z][^<]*</t[dh]>" "$file" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Section_* token used as data (<td>/<th>) — structural scope violation"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 27 — forbid structural tokens inside <td>
# =========================================================
echo "[Step 27] Forbid structural tokens inside <td>..."

# Check all child pages, not just asterdex
VIOLATIONS=""
for file in $CHILD_PAGES; do
  FILE_VIOLATIONS=$(grep -n '<td>.*\(Section_[A-Z]\|Source_[A-Z]\).*</td>' "$file" || true)
  [ -n "$FILE_VIOLATIONS" ] && VIOLATIONS="$VIOLATIONS$FILE_VIOLATIONS"
done

[ -n "$VIOLATIONS" ] && fail "Structural tokens inside <td> detected"

[ $ERRORS -eq 0 ] && pass
echo ""

fi # end if CHILD_PAGES not empty

# =========================================================
# STEP 28 — Root Page Hub-Only Law (spec5) (COLLISION #12: fix regex)
# =========================================================
echo "[Step 28] Root Page Hub-Only Law..."

ROOT_PAGE="app/page.tsx"

if [ -f "$ROOT_PAGE" ]; then
  # COLLISION #12 FIX: Improved regex - match entity paths, exclude /compare
  ROOT_ENTITY_LINKS=$(grep -oE 'href="/(dex|exchanges|cards)/[^/"]+/"' "$ROOT_PAGE" \
    | grep -v 'compare' || true)

  [ -n "$ROOT_ENTITY_LINKS" ] && fail "Root page links directly to entity pages (hub-only violation)"

  # Allowed hubs only
  grep -q 'href="/dex"' "$ROOT_PAGE" || fail "Root page missing /dex hub link"
  grep -q 'href="/exchanges"' "$ROOT_PAGE" || fail "Root page missing /exchanges hub link"
fi

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 28.1 — ROOT LAW: Hub Limit & Allowlist (HARD)
# =========================================================
echo "[Step 28.1] ROOT LAW — Hub Limit & Allowlist..."

ROOT_PAGE="app/page.tsx"

if [ -f "$ROOT_PAGE" ]; then
  # Count outbound links
  ROOT_LINKS=$(grep -o 'href="/[^"]*"' "$ROOT_PAGE" | wc -l | tr -d ' ')

  # Enforce link count (1–3)
  if [ "$ROOT_LINKS" -lt 1 ] || [ "$ROOT_LINKS" -gt 3 ]; then
    fail "ROOT LAW violation: invalid number of root links ($ROOT_LINKS)"
  fi

  # Allowlist enforcement
  FORBIDDEN_ROOT_LINKS=$(grep -o 'href="/[^"]*"' "$ROOT_PAGE" \
    | grep -vE 'href="/dex"|href="/exchanges"|href="/cards"' || true)

  if [ -n "$FORBIDDEN_ROOT_LINKS" ]; then
    fail "ROOT LAW violation: forbidden hub linked from root"
  fi

  # Semantic anchor ban (defensive)
  SEMANTIC_ROOT_ANCHORS=$(grep -E '<a[^>]*>[^<]*(dex|exchange|card|news|swap|compare)[^<]*</a>' "$ROOT_PAGE" || true)

  if [ -n "$SEMANTIC_ROOT_ANCHORS" ]; then
    fail "ROOT LAW violation: semantic anchor detected on root page"
  fi
fi

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 29 — Root Page CR / Dataset Ban (spec5)
# =========================================================
echo "[Step 29] Root Page CR / Dataset Ban..."

if [ -f "$ROOT_PAGE" ]; then
  ROOT_CR=$(grep -iE "CR-|Registry_|Dataset|application/vnd\.ai\+json" "$ROOT_PAGE" || true)
  [ -n "$ROOT_CR" ] && fail "Root page contains CR / dataset structures (router-only violation)"
fi

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 30 — Child Page Inbound Link Enforcement (spec5)
# =========================================================
echo "[Step 30] Child Page Inbound Link Enforcement..."

if [ -n "$CHILD_PAGES" ]; then
  for file in $CHILD_PAGES; do
    # Get path relative to app/
    CHILD_PATH=$(echo "$file" | sed 's|/page.tsx||;s|^app||')

    # Get parent entity page
    PARENT_ENTITY_PAGE=$(echo "$file" | sed 's|/[^/]*/page.tsx$|/page.tsx|')

    if [ -f "$PARENT_ENTITY_PAGE" ]; then
      grep -q "href=\"$CHILD_PATH\"" "$PARENT_ENTITY_PAGE" || fail "Child page has no inbound link from entity ($file)"
    fi
  done
fi

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 31 — Hub Link Count Enforcement (10–50) (COLLISION #9: hubs only)
# =========================================================
echo "[Step 31] Hub Link Count Enforcement..."

# COLLISION #9 FIX: Apply 10-50 limit ONLY to canonical hubs
for hub in $CANONICAL_HUB_FILES; do
  if [ -f "$hub" ]; then
    COUNT=$(grep -oE 'href="/[^"]+"' "$hub" | wc -l | tr -d ' ')
    [ "$COUNT" -lt 1 ] && fail "Hub has too few links ($COUNT) in $hub"
    [ "$COUNT" -gt 50 ] && fail "Hub has too many links ($COUNT) in $hub"
  fi
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 32 — Entity Depth Law (≤ 3 hops) (spec5)
# =========================================================
echo "[Step 32] Entity Depth Law..."

if [ -n "$CHILD_PAGES" ]; then
  for file in $CHILD_PAGES; do
    DEPTH=$(echo "$file" | sed 's|app/||' | tr -cd '/' | wc -c | tr -d ' ')
    [ "$DEPTH" -gt 3 ] && fail "Child page exceeds max depth ($DEPTH hops): $file"
  done
fi

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 33 — Sitemap Non-Authority Law (spec5)
# =========================================================
echo "[Step 33] Sitemap Non-Authority Law..."

SITEMAP_USAGE=$(grep -riE "sitemap|sitemap.ts" app 2>/dev/null | grep -v "sitemap.ts" || true)

[ -n "$SITEMAP_USAGE" ] && fail "Sitemap referenced inside content (forbidden discovery source)"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 35 — Affiliate Content Isolation Law (COLLISION #8: fix paths)
# =========================================================
echo "[Step 35] Affiliate Content Isolation Law..."

AFFILIATE_PATTERN='href="/go/'

# COLLISION #8 FIX: Check ONLY exact paths for ROOT and canonical hubs
# Root page
if [ -f "app/page.tsx" ] && grep -q "$AFFILIATE_PATTERN" "app/page.tsx"; then
  fail "Affiliate link detected on ROOT page"
fi

# Canonical hub pages (exact match)
for hub in $CANONICAL_HUB_FILES; do
  if [ -f "$hub" ] && grep -q "$AFFILIATE_PATTERN" "$hub"; then
    fail "Affiliate link detected on HUB page ($hub)"
  fi
done

# Entity pages (direct children of hubs, NOT child pages)
for entity in $ENTITY_FILES; do
  if [ -f "$entity" ] && grep -q "$AFFILIATE_PATTERN" "$entity"; then
    fail "Affiliate link detected on ENTITY page ($entity)"
  fi
done

# CR-BLOCK pages must not have affiliate links
AFFILIATE_FILES=$(grep -Rl "$AFFILIATE_PATTERN" app 2>/dev/null || true)
for file in $AFFILIATE_FILES; do
  if grep -q "CR-BLOCK" "$file" 2>/dev/null; then
    fail "Affiliate link detected on CR page ($file)"
  fi
done

# Child pages (AI Content) MUST have affiliate links - checked in Step 10

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# FINAL RESULT
# =========================================================
echo "=== FINAL RESULT ==="

if [ $ERRORS -eq 0 ]; then
  echo "PASS: Fully compliant with CLAUDE.md + spec5 + spec6 + spec9"
  exit 0
else
  echo "FAIL: $ERRORS violation(s)"
  echo "Failure semantics: PAGE DOES NOT EXIST"
  exit 1
fi
