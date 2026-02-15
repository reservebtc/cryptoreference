# Landing Style Memo (Reference Look)

Goal: replicate the visual language from the provided reference screenshot (Hyperliquid-style) when building future landing pages in this repo.

This memo is intentionally practical: colors, type direction, layout patterns, and component styling notes.

## Palette (Approx)

Primary background direction:
- Deep green / teal base (very dark, near-black green)
- Large soft gradient washes (teal to green)
- Subtle vignette / depth via blurred shapes ("blobs")

Accent:
- Mint / aqua (used for primary CTA and highlights)

Neutrals:
- Near-white text on dark backgrounds
- Soft, translucent whites for surfaces (header pill)

Suggested CSS variables (tune when implementing):
- `--bg-0: #041b16;`   /* very dark green */
- `--bg-1: #053326;`   /* deep teal */
- `--bg-2: #0b5a45;`   /* mid green */
- `--accent: #7fffe1;` /* mint/aqua */
- `--text: #f3fffb;`   /* near-white */
- `--muted: rgba(243, 255, 251, 0.72);`
- `--surface: rgba(255, 255, 255, 0.88);` /* header pill */
- `--stroke: rgba(255, 255, 255, 0.22);`

## Typography Direction

Reference look uses two distinct type roles:
- Display serif for the hero headline (high contrast, elegant, large size, generous tracking).
- Clean sans for UI (nav items, buttons, small copy).

In this repo today:
- `app/layout.tsx` uses `Geist` + `Geist Mono`.
- `app/globals.css` defines `--font-sans` system stack (but body uses the Geist CSS variable class).

Landing implementation should:
- Keep UI/body on Geist (or the existing sans).
- Add a single display serif for the hero H1 only (via `next/font/google`), or a local serif if already available.

## Layout / Composition (Hero)

Key visual composition cues from the reference:
- Full-viewport hero with an atmospheric gradient background + large blurred blobs.
- Centered hero stack:
  1. Logo mark above H1 (small, centered).
  2. Very large H1 (2 lines typical).
  3. Small 1-line subheadline (muted).
  4. CTA row of pill buttons.

Header pattern:
- Top header is a rounded white "pill" spanning content width.
- Left: logo + brand text.
- Center/right: lightweight nav links.
- Right: primary CTA as mint pill.

Note for our landing spec: we cannot ship nav/extra links; we can keep the pill header (logo + single CTA only), or drop the header entirely.

## Buttons

Primary CTA:
- Pill shape (large border radius)
- Mint fill (`--accent`)
- Dark text
- Subtle hover: slightly brighter + lift + shadow

Secondary CTA (if allowed by spec):
- Outline pill on dark background
- Thin white/teal stroke + transparent fill

Important: the landing spec we follow requires exactly ONE main CTA string repeated; if a secondary button is not allowed, the secondary style becomes a non-clickable chip or is removed.

## Background Recipe

Implementation approach:
- Use `background: radial-gradient(...)` layers for the big washes.
- Add a few absolutely-positioned blurred circles (blobs) with `filter: blur(...)` and low opacity.
- Keep animation minimal (slow drift on blobs is OK; avoid heavy motion).

Example layer stack (concept):
- radial mint wash top-left
- deep green wash center
- darker vignette right side

## Spacing / Feel

- Lots of negative space.
- Large type scale for H1.
- Tight subheadline width (centered, max-width ~ 520px).
- Button row centered with comfortable gap.

## Mobile Notes

- CTA visible without scroll.
- Sticky CTA bar on mobile can reuse mint pill styling.
- Keep hero height flexible; reduce blob intensity on small screens for readability.

