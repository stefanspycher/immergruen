# Spec-First Development

## Rule

**No code change may be made unless the relevant specification file explicitly endorses it.**

This project is governed by two specification files and one supplementary rule:

- `SPEC.md` — behavioral specification (what the app does, technology-independent)
- `IMPL.md` — implementation reference (stack, file structure, module responsibilities)
- `.claude/rules/dependency-free.md` — the dependency-free invariant. This rule overrides spec endorsement: if either spec file appears to permit a third-party dependency, treat that section as out of compliance and revise it before writing code.

---

## What "endorses" means

A specification file endorses a code change when it contains language that:

1. **Describes the behavior** the change implements, or
2. **Names the module, file, or pattern** the change introduces or modifies, or
3. **Explicitly permits** the approach (e.g., lists an animation file, names a CSS layer, defines a data property)

If the code change introduces something not described in either spec file, the spec must be updated first. The spec update and the code change may be in the same session, but the spec update comes first.

---

## Before writing any code, verify:

1. Open `SPEC.md` and find the section governing the behavior being changed or added.
2. Open `IMPL.md` and find the section governing the module, file, or pattern being changed or added.
3. If no such section exists: **stop, update the spec, confirm with the user, then proceed to code.**
4. If a section exists but conflicts with the intended change: **stop, surface the conflict, update the spec, confirm with the user, then proceed to code.**

Never skip this check. Never assume a change is "too small" to require spec endorsement.

---

## When to update specs

Update `SPEC.md` when:
- A new behavior is being added or an existing behavior is changing
- A user-visible property, interaction, or data model is modified
- A constraint or invariant is being relaxed or tightened

Update `IMPL.md` when:
- A new file, module, or CSS layer is being added
- An existing module's responsibility is expanding or shifting
- A structural pattern (e.g., animation file convention, layer order) is changing

Both files may need updating for a single change. Update both before writing code.

---

## Congruence requirement

`SPEC.md` and `IMPL.md` must remain congruent at all times. A change to either file requires a corresponding review of the other.

**When updating `SPEC.md`:** check whether the behavioral change affects any module, file, or structural pattern described in `IMPL.md`. If it does, update `IMPL.md` in the same session before writing code.

**When updating `IMPL.md`:** check whether the structural change reflects or enables a behavior described in `SPEC.md`. If it introduces a new capability not covered by `SPEC.md`, update `SPEC.md` first.

**Both files must be committed together.** Never leave a session where one file describes something the other file contradicts or omits.

The only exception is purely editorial fixes (typos, formatting) that do not change meaning — these do not require a corresponding update to the other file.

---

## Prohibited patterns

- Do not create a new script file not listed in `IMPL.md`
- Do not add a new CSS layer not declared in `IMPL.md`
- Do not implement a behavior not described in `SPEC.md`
- Do not rename or split a module without first updating `IMPL.md`
- Do not add a config property, data model field, or index field without first adding it to `SPEC.md`

---

## Constraints

- This rule applies to all code files: `.js`, `.css`, `.html`, `config.json`, `build/index.js`
- This rule does not apply to content files (`content/*.md`) or generated output (`notes.json`)
- Spec updates must be semantically complete — a vague sentence added to satisfy the rule does not count as endorsement
- If the user asks to skip the spec update, confirm explicitly before proceeding
