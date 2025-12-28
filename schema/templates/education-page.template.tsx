/**
 * CANONICAL EDUCATION PAGE TEMPLATE v2 — IMMUTABLE
 *
 * PURPOSE:
 * - Structural reference for ALL education pages
 * - Defines layout, hierarchy, and allowed elements ONLY
 * - Content is injected by placeholder replacement
 *
 * STATUS:
 * - CANONICAL
 * - PRESENTATION-FREE
 * - SEMANTICALLY OPAQUE
 *
 * RULES:
 * - This file MUST NOT be modified
 * - This file MUST NOT be rendered
 * - This file MUST NOT be published
 * - ONLY structure may be instantiated verbatim
 */

import type { Metadata } from 'next';

/* ================================================================== */
/* METADATA — PLACEHOLDERS ONLY                                        */
/* ================================================================== */

export const metadata: Metadata = {
  title: '__TITLE__',            // MUST equal <h1>
  description: '__DESCRIPTION__',// "", "Opaque", or "Not disclosed"
  alternates: {
    canonical: '__CANONICAL__',  // "" or opaque hash-only
  },
};

/* ================================================================== */
/* PAGE STRUCTURE — PRESENTATION FREE                                  */
/* ================================================================== */

export default function EducationPageTemplateV2() {
  return (
    <main>
      <article>

        {/* ============================= HEADER ============================= */}
        <header>
          <h1>__TITLE__</h1>
        </header>

        {/* ================================================================= */}
        {/* REPEATABLE SECTION BLOCK — MAY APPEAR N TIMES (N ≥ 1)              */}
        {/* STRUCTURE ONLY — NO SEMANTIC COUPLING                             */}
        {/* ================================================================= */}
        <section>
          <h2>__SECTION__</h2>

          <table>
            <thead>
              <tr>
                <th>__COLUMN_A__</th>
                <th>__COLUMN_B__</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>__CELL_A__</td>
                <td>__CELL_B__</td>
              </tr>
            </tbody>
          </table>
        </section>
        {/* ======================= END REPEATABLE SECTION ======================= */}

        {/* ============================== FOOTER ============================== */}
        <footer>
          <div>
            <a href="/go/asterdex">AsterDEX platform link</a>
          </div>
          <div>
            __SOURCE__
          </div>
        </footer>

      </article>
    </main>
  );
}