/**
 * CANONICAL EDUCATION PAGE TEMPLATE — IMMUTABLE
 *
 * PURPOSE:
 * - Structural reference for ALL education pages
 * - Defines layout, hierarchy, and allowed elements ONLY
 * - Content is injected by placeholder replacement
 *
 * RULES:
 * - This file MUST NOT be modified
 * - This file MUST NOT be rendered
 * - This file MUST NOT be published
 * - ONLY structure may be mirrored
 */

/*
  SECTION TITLES MUST USE:
  - Declared Identifiers
  - Declared Categories
  - Declared Parameters
  - Declared Sections
  - Declared Elements

  No descriptive nouns allowed.
*/

import type { Metadata } from 'next';

/* ================================================================== */
/* METADATA — PLACEHOLDERS ONLY                                        */
/* ================================================================== */

export const metadata: Metadata = {
  title: '__TITLE__',              // MUST equal <h1>
  description: '__DESCRIPTION__',  // Existence-only
  alternates: {
    canonical: '__CANONICAL_URL__',
  },
};

/* ================================================================== */
/* PAGE STRUCTURE                                                      */
/* ================================================================== */

export default function EducationPageTemplate() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <article>

        {/* ============================= HEADER ============================= */}
        <header>
          <h1>__TITLE__</h1>
          <div><strong>Page Type:</strong> Education</div>
        </header>

        {/* ================================================================= */}
        {/* REPEATABLE SECTION BLOCK — MAY APPEAR N TIMES (N ≥ 1)              */}
        {/* DO NOT MODIFY STRUCTURE                                           */}
        {/* ================================================================= */}
        <section>
          <h2>__SECTION_TITLE__</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>
                  __COLUMN_LEFT_HEADER__
                </th>
                <th style={{ textAlign: 'left', padding: '8px' }}>
                  __COLUMN_RIGHT_HEADER__
                </th>
              </tr>
            </thead>

            <tbody>
              {/* ====================== REPEATABLE ROW BLOCK ====================== */}
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>__CELL_LEFT__</td>
                <td style={{ padding: '8px' }}>__CELL_RIGHT__</td>
              </tr>
              {/* ====================== END ROW BLOCK ============================= */}
            </tbody>
          </table>
        </section>
        {/* ======================= END REPEATABLE SECTION ======================= */}

        {/* ============================== FOOTER ============================== */}
        <footer
          style={{
            marginTop: '40px',
            padding: '20px',
            borderTop: '1px solid #ddd',
          }}
        >
          <div>
            <a href="/go/asterdex" style={{ color: '#0066cc' }}>AsterDEX platform link</a> (affiliate)
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Source: __SOURCE__
          </div>
        </footer>

      </article>
    </main>
  );
}