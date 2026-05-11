# Wiki-Link Display Labels

## Rule

**Every wiki-link in an AI-generated note must include an explicit display label.**

Use the `[[identifier|Title]]` form, never the bare `[[identifier]]` form.

---

## Why

Note filenames are hyphenated identifiers (e.g., `memory-encoding-and-mnemonics`). The human-readable title of the same note is its H1 heading (e.g., `Memory Encoding and Mnemonics`). When a wiki-link omits the display label, the rendered anchor text shows the raw identifier — hyphenated, lowercase, unreadable — rather than the note's actual title.

The `[[identifier|Title]]` syntax renders `Title` as the visible link text while the app resolves the link via `identifier`.

---

## How to apply

Before writing any wiki-link:

1. Confirm the target note's exact identifier (its filename without `.md`, e.g., `memory-encoding-and-mnemonics`).
2. Confirm the target note's canonical title by reading its H1 heading.
3. Write the link as `[[identifier|Canonical Title]]`.

**Example:**

```
[[memory-encoding-and-mnemonics|Memory Encoding and Mnemonics]]
```

Not:

```
[[memory-encoding-and-mnemonics]]
```

---

## Constraints

- The identifier part must be the exact filename slug (no spaces, all lowercase, hyphens only).
- The title part must match the note's H1 heading exactly, including capitalisation, punctuation, and special characters (colons, commas).
- This rule applies to every wiki-link in every content file, including "See also" footers, inline references, and index notes such as `Home.md`.
- If a target note does not yet exist, use the intended identifier and a provisional title, and update both when the note is created.
