# CR-Markup Examples (Non-Normative)

Reference examples for CR-Markup Protocol v1.0.

## Valid Examples

| File | Description |
|------|-------------|
| `valid_exchange.cr` | Complete exchange CR with all common fields |
| `valid_dex.cr` | DEX with multi-chain network array |
| `valid_token.cr` | Token with parent_id hierarchy |
| `deprecated_exchange.cr` | Deprecated entity with deprecation metadata |
| `superseded_old.cr` | Original version (to be superseded) |
| `superseded_new.cr` | New version with supersedes reference |

## Invalid Examples

See `invalid_examples.md` for documented invalid patterns:
- Missing required fields
- Invalid schema version
- Invalid hash format
- Forbidden content (emoji, marketing)
- Nested CR-blocks
- Unknown fields

## Validation

```bash
# Validate all examples
npx tsx examples/validate_examples.ts

# Validate single file
npx tsx schema/cr-cli.ts validate examples/valid_exchange.cr

# Get hash
npx tsx schema/cr-cli.ts hash examples/valid_exchange.cr
```

## Notes

- These examples are **non-normative** (for illustration only)
- The canonical specification is `/schema/spec.md`
- All valid examples pass production validation
- Invalid examples are documented but not included as `.cr` files
