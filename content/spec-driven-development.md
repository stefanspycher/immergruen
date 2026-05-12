---
type: technique
tags:
  - specification
  - ai-development
  - software-governance
  - architecture
  - evergreen
---

# Spec-Driven Development with AI

In AI-assisted software development, the specification, not the codebase, is the primary artifact. Code is cheap and regenerable. Intent is not.

## Spec as Governance Artifact

When AI can generate code quickly and cheaply, the constraint in software development shifts from _writing code_ to _knowing what to build_. A change that modifies behavior without updating the spec bypasses governance. The spec is the handoff artifact: complete enough that a different engineer, team, or AI agent could rebuild from scratch without asking questions.

**Specs age better than code.** A well-written spec from years ago still communicates intent. A codebase without a spec often does not.

This reframes the developer's role: from someone who writes code to someone who **architects solutions and validates correctness.** [[specification-craft-and-domain-expert-engineering|The Specification Craft: What Comes After AI Writes the Code]] examines what that shift demands in practice — boundary definition, negative space, and test imagination as learnable skills.

## The Workflow

1. **Write a comprehensive specification**: define inputs, outputs, behavior, error conditions, and examples before opening an editor
2. **Feed the spec to an AI coding assistant**: the AI translates spec into implementation
3. **Review for correctness, not for effort**: the question is not "did the AI write good code?" but "does this implementation match the spec?"
4. **Refine the spec when gaps appear**: if the AI output is wrong, the spec was incomplete, not the AI

The spec becomes the source of truth. Code is a derivation of it.

## Why Specs Work Better Than Code for Governance

|                              | Code      | Spec   |
| ---------------------------- | --------- | ------ |
| Expresses intent             | Sometimes | Always |
| Readable by non-engineers    | Rarely    | Yes    |
| Survives team changes        | Partially | Better |
| Can be rebuilt from scratch  | No        | Yes    |
| Shows _why_, not just _what_ | No        | Yes    |

## Where This Applies

Works best for well-defined problems (APIs, data transformers, utilities, integrations), prototype handoffs where a different team or agent will implement, and governance contexts where behavior changes need to be traceable.

Works less well for exploratory or creative work where requirements are discovered through implementation, and problems where a spec cannot be written until something is built.

## Practical Consequences

- Requiring a spec change alongside every behavior change creates a governance trail
- A prototype is done when the spec is complete enough for independent reconstruction, not when the demo works
- The spec is the document that survives; treat it accordingly

See also: [[context-engineering|Context Engineering]] for how the AI assistant's context is managed in this workflow, and [[ai-human-value-and-opportunity|AI, Human Value, and the Translation Opportunity]] for how the developer's role evolves in an AI-assisted world.
