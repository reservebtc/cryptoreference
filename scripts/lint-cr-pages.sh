#!/bin/bash
# =========================================================
# CR-Markup Protocol v1.0
# AI-First Compiler Linter (FINAL)
# Enforces: CLAUDE.md + plan3.1.md
#
# FAILURE MODEL:
#   FAIL = PAGE DOES NOT EXIST
#
# macOS compatible (no grep -P, no GNU-only flags)
# =========================================================

set -e

PAGES_DIR="app/dex/asterdex"
EDU_TEMPLATE="schema/templates/education-page.template.tsx"
INT_TEMPLATE="schema/templates/interface-page.template.tsx"

ERRORS=0

echo "=== AI-First Compiler Compliance Check ==="
echo "Reference: CLAUDE.md + plan3.1.md"
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

# =========================================================
# STEP 0 — Canonical Template Presence
# =========================================================
echo "[Step 0] Canonical Template Presence..."

[ -f "$EDU_TEMPLATE" ] || fail "Missing education template"
[ -f "$INT_TEMPLATE" ] || fail "Missing interface template"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 1 — AST & File Integrity Law (HARD)
# =========================================================
echo "[Step 1] AST & File Integrity..."

for file in "$PAGES_DIR"/*/page.tsx; do
  [ "$(grep -c "export default function" "$file")" -eq 1 ] \
    || fail "Invalid export count (must be 1) in $file"

  [ "$(grep -c "export const metadata" "$file")" -eq 1 ] \
    || fail "Invalid metadata block count in $file"

  grep -q "</main>[[:space:]]*$" "$file" \
    || fail "Trailing content after </main> in $file"

  for tag in main article header footer section table thead tbody tr td h1 h2; do
    OPEN=$(grep -c "<$tag" "$file")
    CLOSE=$(grep -c "</$tag>" "$file")
    [ "$OPEN" -eq "$CLOSE" ] || fail "Unbalanced <$tag> in $file"
  done
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 2 — Page Skeleton Validation
# =========================================================
echo "[Step 2] Page Skeleton Validation..."

for file in "$PAGES_DIR"/*/page.tsx; do
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

for file in "$PAGES_DIR"/*/page.tsx; do
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

if grep -E "<ul|<ol|<li|<p>" "$PAGES_DIR"/*/page.tsx \
  | grep -v "<p>Not disclosed.</p>" >/dev/null 2>&1; then
  fail "Forbidden structural tags detected"
else
  pass
fi

echo ""

# =========================================================
# STEP 5 — Absolute Language Ban
# =========================================================
echo "[Step 5] Absolute Language Ban..."

LANGUAGE_BAN="learn|how to|tutorial|introduction|based on|earned through|determined by|depends on|allows users to|designed to|helps|enables|used for|best|better|advanced|enhanced|improved|benefits|recent|recently|last updated"

VIOLATIONS=$(grep -riE "$LANGUAGE_BAN" "$PAGES_DIR"/*/page.tsx \
  | grep -v "canonical:" \
  | grep -v "export default function" \
  | grep -v "import " \
  || true)

[ -n "$VIOLATIONS" ] && fail "Prohibited language detected" || pass
echo ""

# =========================================================
# STEP 6 — Zero Inference Rule
# =========================================================
echo "[Step 6] Zero Inference Rule..."

INFERENCE="because|therefore|which means|so that|in order to|works by|calculated by"
VIOLATIONS=$(grep -riE "$INFERENCE" "$PAGES_DIR"/*/page.tsx || true)

[ -n "$VIOLATIONS" ] && fail "Inference detected" || pass
echo ""

# =========================================================
# STEP 7 — Numeric & Boolean Ban
# =========================================================
echo "[Step 7] Numeric & Boolean Ban..."

NUMERIC=$(grep -E "<td[^>]*>[^<]*[0-9]+" "$PAGES_DIR"/*/page.tsx \
  | grep -vE "Not disclosed|Unknown" || true)

[ -n "$NUMERIC" ] && fail "Numeric values detected"

BOOLEAN="available|supported|enabled|disabled|active|live|exists"
BOOL=$(grep -riE "\b($BOOLEAN)\b" "$PAGES_DIR"/*/page.tsx \
  | grep -v "canonical:" || true)

[ -n "$BOOL" ] && fail "Boolean / availability detected"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 8 — Title–H1 Identity
# =========================================================
echo "[Step 8] Title–H1 Identity..."

for file in "$PAGES_DIR"/*/page.tsx; do
  [ "$(get_title "$file")" = "$(get_h1 "$file")" ] \
    || fail "Title/H1 mismatch in $file"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 9 — Page Type Validation
# =========================================================
echo "[Step 9] Page Type Validation..."

for file in "$PAGES_DIR"/*/page.tsx; do
  grep -q "Page Type:</strong> Education" "$file" || \
  grep -q "Page Type:</strong> Interface" "$file" || \
  fail "Invalid Page Type in $file"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 10 — Footer & Affiliate Law
# =========================================================
echo "[Step 10] Footer & Affiliate Law..."

for file in "$PAGES_DIR"/*/page.tsx; do
  grep -q 'href="/go/asterdex"' "$file" || fail "Missing affiliate link ($file)"
  grep -q "AsterDEX platform link" "$file" || fail "Invalid anchor text ($file)"
  grep -q "Source_" "$file" || fail "Missing Source ($file)"
done

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 11 — Semantic Label Neutrality
# =========================================================
echo "[Step 11] Semantic Label Neutrality..."

SEMANTIC_LABEL_BAN="user|users|volume|interest|tvl|liquidity|trade|market|order|position|leverage|margin|fee|rate|yield|reward|staking|statistics|metrics|information|overview"

VIOLATIONS=$(grep -riE "\b($SEMANTIC_LABEL_BAN)\b" "$PAGES_DIR"/*/page.tsx \
  | grep -E "<h2>|<th>|<td>" \
  | grep -v "Not disclosed\|Unknown" \
  | grep -v "<h1>|canonical:|title:|description:" || true)

[ -n "$VIOLATIONS" ] && fail "Semantic label leakage detected" || pass
echo ""

# =========================================================
# STEP 12 — Real-world Term Ban (HARD)
# =========================================================
echo "[Step 12] Real-world Term Ban..."

REALWORLD_BAN="btc|eth|usdt|usdc|bnb|metamask|walletconnect|chart|dashboard|referral|earn|spot|futures|grid|margin|leverage|trading|fees"

VIOLATIONS=$(grep -riE "\b($REALWORLD_BAN)\b" "$PAGES_DIR"/*/page.tsx \
  | grep -E "<h2>|<th>|<td>" \
  | grep -v "Not disclosed\|Unknown" \
  | grep -v "<h1>|canonical:|title:|description:" \
  || true)

[ -n "$VIOLATIONS" ] && fail "Real-world semantic label detected" || pass
echo ""

# =========================================================
# STEP 13 — Presentation Layer Ban (ABSOLUTE, NEW)
# =========================================================
echo "[Step 13] Presentation Layer Ban..."

STYLE_VIOLATIONS=$(grep -riE "style=\{\{" "$PAGES_DIR"/*/page.tsx || true)
[ -n "$STYLE_VIOLATIONS" ] && fail "Inline style detected (presentation layer forbidden)"

CLASS_VIOLATIONS=$(grep -riE "className=" "$PAGES_DIR"/*/page.tsx || true)
[ -n "$CLASS_VIOLATIONS" ] && fail "className usage forbidden"

[ $ERRORS -eq 0 ] && pass
echo ""

# =========================================================
# STEP 14 — Column Header Opaqueness (HARD)
# =========================================================
echo "[Step 14] Column Header Opaqueness..."

COLUMN_HEADER_BAN="Identifier|Category|Attribute|Parameter|Section|Value|Name|Type|Description"

VIOLATIONS=$(grep -riE "<th>[^<]*($COLUMN_HEADER_BAN)[^<]*</th>" "$PAGES_DIR"/*/page.tsx || true)

[ -n "$VIOLATIONS" ] && fail "Semantic column header detected (<th>) — opaque labels required"

# =========================================================
# STEP 15 — Source Opacity Ban (HARD)
# =========================================================
echo "[Step 15] Source Opacity Ban..."

SOURCE_BAN="Source:|docs\.|\.com|\.io|\.org|github|medium|twitter|discord"

VIOLATIONS=$(grep -riE "$SOURCE_BAN" "$PAGES_DIR"/*/page.tsx | grep -v "canonical:" || true)

[ -n "$VIOLATIONS" ] && fail "Real-world source attribution detected — source must be opaque"

# =========================================================
# STEP 16 — Metadata Description Opacity
# =========================================================
echo "[Step 16] Metadata Description Opacity..."

DESCRIPTION_VIOLATIONS=$(grep -riE "description:\s*'[^']*(page|overview|info|about|AsterDEX|Registry)[^']*'" "$PAGES_DIR"/*/page.tsx || true)

[ -n "$DESCRIPTION_VIOLATIONS" ] && fail "Semantic metadata.description detected — opacity required"


# =========================================================
# FINAL RESULT
# =========================================================
echo "=== FINAL RESULT ==="

if [ $ERRORS -eq 0 ]; then
  echo "PASS: Fully compliant with CLAUDE.md + plan3.1.md"
  exit 0
else
  echo "FAIL: $ERRORS violation(s)"
  echo "Failure semantics: PAGE DOES NOT EXIST"
  exit 1
fi