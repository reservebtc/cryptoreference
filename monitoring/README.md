# Monitoring

Internal Canonical Integrity & Distortion Detection

STATUS: READ-ONLY / NON-DESTRUCTIVE

---

## Purpose

Monitoring detects canonical distortions without mutation.

- Compares: CR-BLOCKs, dataset records, registry entries
- Validates: link-graph topology (root → hub → entity → child)
- Detects: divergence between filesystem, registry.json, latest.jsonl

---

## Structure

```
/monitoring
├─ reports/       (append-only JSON reports)
├─ snapshots/     (filesystem + rendered output)
└─ README.md
```

---

## Invariants

- Monitoring is read-only
- Reports are append-only
- No historical artifact is modified
- Same input → byte-identical report

---

## Governance

Governed by: `/schema/monitoring-spec.md`

END.
