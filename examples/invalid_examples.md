# Invalid CR Examples (Non-Normative)

This file contains examples of INVALID CR-blocks with explanations.
These examples are for educational purposes and will NOT pass validation.

---

## 1. Missing Required Fields

```
[CR/INVALID1]
name=Missing Required Fields
[/CR]
```

**Error:** Missing required fields: `schema`, `version`, `canonical_hash`, `type`, `network`

---

## 2. Invalid Schema Version

```
[CR/INVALID2]
schema=CR2.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
[/CR]
```

**Error:** Schema must be exactly `CR1.0`

---

## 3. Invalid Hash Format

```
[CR/INVALID3]
schema=CR1.0
version=1.0
canonical_hash=md5:abc123
type=exchange
network=ethereum
[/CR]
```

**Error:** Hash must be `sha256:<64-hex-chars>`

---

## 4. Emoji in Content (Forbidden)

```
[CR/INVALID4]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=RocketExchange 🚀
[/CR]
```

**Error:** Emoji characters are forbidden in CR-blocks

---

## 5. Marketing Language (Forbidden)

```
[CR/INVALID5]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=The Best Exchange
[/CR]
```

**Error:** Marketing terms like "best", "top", "#1" are forbidden

---

## 6. Nested CR-Blocks (Forbidden)

```
[CR/OUTER]
schema=CR1.0
version=1.0
type=exchange
[CR/INNER]
type=token
[/CR]
[/CR]
```

**Error:** Nested CR-blocks are forbidden

---

## 7. Missing Closing Tag

```
[CR/INVALID7]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
```

**Error:** Missing closing tag `[/CR]`

---

## 8. Unknown Field (Without x_ Prefix)

```
[CR/INVALID8]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
custom_field=value
[/CR]
```

**Error:** Unknown fields must use `x_` prefix (e.g., `x_custom_field`)

---

## 9. Invalid Status Value

```
[CR/INVALID9]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
status=unknown
[/CR]
```

**Error:** Status must be one of: `active`, `deprecated`, `beta`, `inactive`

---

## 10. Prompt-Like Instructions (Forbidden)

```
[CR/INVALID10]
schema=CR1.0
version=1.0
canonical_hash=sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
type=exchange
network=ethereum
name=You should use this Exchange
[/CR]
```

**Error:** Prompt-like instructions are forbidden

---

## Validation Command

To validate any CR-block, use:

```bash
npx tsx schema/cr-cli.ts validate <file>
```

All examples above will return exit code 1 (INVALID).
