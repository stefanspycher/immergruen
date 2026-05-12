---
title: "The Specification Craft: What Comes After AI Writes the Code"
status: draft
aliases:
  - "Specification Craft"
  - "Domain Expert Engineering"
created: 2026-05-12
modified: 2026-05-12
url: "https://www.youtube.com/watch?v=SlGRN8jh2RI"
publish-date: 2026-05-12
tags:
  - ai-architecture
  - specification
  - domain-expertise
  - agentic-engineering
  - ai-maturity
  - software-engineering
  - skill-development
  - quality-control
summary: "As AI moves coding toward a solved problem for standard stacks, the bottleneck shifts from syntax to specification — and a new craft emerges: structured intent articulation, the ability to translate tacit domain knowledge into rigorous, agent-executable specs including test definitions."
related:
  - "[[2026-05-11-1818-process-malcolm-jones-slack|Malcolm Jones Slack — Boris Cherny AI Ascent Talk]]"
---

# Notes on a Talk by Boris Cherny (AI Ascent 2026)

Boris Cherny, creator of Claude Code, argued that for standard technology stacks, coding is effectively a solved problem — the bottleneck has relocated from syntax and implementation to domain expertise and product vision. That claim is largely credible. What the talk leaves open is the harder question: if domain experts are now the engineers, what do they actually need to do that well?


# The Capability Progression

AI-assisted engineering unfolds across levels. At the early levels, AI is autocomplete — faster keystrokes, the engineer still doing all the thinking. A few levels in, it becomes a pair programmer: you describe, it drafts, you review. The cognitive work is still mostly yours, but output-per-hour climbs.

Further along, AI becomes an autonomous contributor. You hand it a scoped task and it returns a working implementation. You are reviewing outcomes, not keystrokes.

At the frontier — where Cherny operates — the human is a fleet manager. Dozens or hundreds of agent sessions run in parallel, filing pull requests, monitoring their own outputs, communicating across systems. The engineer's work is no longer implementation. It is direction: what to build, what done looks like, whether the agents got it right.

Each level shifts more execution to the machine and more judgment to the human. Worth understanding what opens up at each stage — and what skills become load-bearing.


# Where the Bottleneck Relocates

As coding approaches solved for standard stacks, the constraint doesn't disappear.

First relocation: from syntax to architecture. When anyone can generate correct code for a function, the question shifts to whether the functions are the right ones, whether the abstractions will hold. Many practitioners have already made this move.

Second relocation: from architecture to correctness. When agents can propose architectures as well as implement them, the question becomes whether what was built is actually correct — edge cases, adversarial input, behavior under load. This is where human review still lives for most teams.

Third relocation — the one Cherny points toward but doesn't fully name: from correctness to intent. When AI-controlled testing handles correctness verification, the last human constraint is whether the specification accurately captured what you actually wanted. The bottleneck is no longer "can this be built" or "was it built right" but "did I ask for the right thing."

That shift moves the critical skill from execution to articulation. Articulating intent precisely, completely, and verifiably turns out to be hard.


# On the Verification Problem

The most common objection to fully agentic engineering: if AI writes the code, who checks it? Specification-driven testing is the mechanism that closes the loop.

The key observation: the same person who specifies what correct behavior looks like is best positioned to specify what a passing test looks like. Both draw on the same domain knowledge.

The accountant who understands correct accounting behavior — edge cases, regulatory requirements, failure modes — can write a test spec that captures that knowledge as verification logic. The agent runs both the implementation and the tests. If the tests pass, the domain expert's judgment has been exercised and confirmed, without a human reviewing a single line of code.

The trust circle closes because human judgment is encoded twice: once in the behavioral specification, and once in the test specification. The agent executes against both. The human reviews outputs, not code.

A residual gap worth holding onto: specification-driven testing works well for known-correct behavior — things you already understand well enough to specify. It is weaker at the edges: emergent behaviors, interactions between independently agent-built components, performance characteristics under conditions no individual spec anticipated. Tests verify what you thought to ask about. The question of how to ask about more stays open.


# A Possible Name for the Craft

What the domain expert seems to need — and what is currently being discovered without a shared vocabulary — is a cluster of skills sitting between domain knowledge and engineering practice. A working name: structured intent articulation.

Not just "writing clearly." Something more specific.

**Boundary definition:** knowing where your intent ends. Most domain experts think in prototypes — an invoice looks like this, a valid session feels like this. Prototypes are useful for communication but inadequate as specifications. A specification requires rules: an invoice is valid when all of these conditions hold. The move from prototype-thinking to boundary-thinking is learned.

**Negative space specification:** defining what should not happen, not just what should. Almost entirely absent from how most people communicate requirements. In human workflows, someone uses judgment to handle the weird edge case. In an agentic workflow, that judgment has to have been written down in advance. Engineers learned to ask "what's the error case?" automatically. Domain experts generally haven't needed to.

**Decomposition without over-prescription:** knowing how far down to specify before constraining the agent unnecessarily. Spec too high: ambiguity, the agent fills gaps with its own assumptions. Spec too low: you're writing code by another name, just in natural language. The right level of abstraction is a judgment call that develops through failure. No formula; only calibration.

**Test imagination:** asking "what would a wrong answer look like?" before seeing one. The discipline of imagining failure modes during design, not after. Some practitioners have this instinct. Most don't. It can be developed, but it has to become an explicit part of the specification process.

**Iterative tightening:** treating the first specification as a hypothesis, and reading agent output as feedback about spec quality rather than task quality. When an agent does something unexpected, the instinct is to correct the output. The more useful question is: what did my spec allow that I did not intend? Asked consistently, that builds a personal taxonomy of your own specification failure modes. Those patterns are yours alone — no two practitioners share the same blind spots.

These sub-skills combine capabilities that were previously distributed: engineers owned decomposition and boundary definition, product managers owned intent, QA owned test imagination. The new spec author holds all of it, in natural language — expressive but imprecise — rather than code, which forces precision through syntax.

Neither domain experts nor engineers are starting from a strong position here. Domain experts have the knowledge but not the decomposition habits. Engineers have the decomposition habits but may lack the domain depth to know where the real boundaries are. The people likely to be exceptional are those who have operated at the seam: technical product managers, senior engineers who went deep on a domain, domain experts who learned to code.


# On Developing It

The conditions for developing this craft are present in any daily AI practice. What seems to be missing is a deliberate practice layer on top of existing work.

## Locating Yourself

Three exercises that seem worth trying before investing in development.

**The gap audit.** Review your last 10–15 AI interactions where the output needed correction. For each one: was this a model failure — the agent could not do what I asked — or a spec failure — it did what I asked, but I asked for the wrong thing? The difficulty of distinguishing them is itself diagnostic. Most practitioners who do this are surprised by how often the spec is the cause.

**The negative space test.** Take a specification you've written recently — a task description, a prompt you use regularly. Try to generate five outputs that would technically satisfy it but violate your intent. Concrete, plausible outputs, not absurdist edge cases. Struggling to generate them suggests negative space instincts need work. Generating them easily and finding them surprising suggests the spec needs tightening.

**The blind pass.** Write a specification for something you know well, then run it in a completely fresh session with no prior context. Treat every surprising output as a data point about the spec, not the model. Count the surprises. That number is a baseline.

## Practices Worth Trying

**A reflection layer on existing work.** Before any non-trivial prompt, take thirty seconds to write down what a wrong-but-plausible output would look like. Then run it. Then check. Builds test imagination without requiring separate time — only a reflection habit attached to work already happening.

**Write constraints before instructions.** For any non-trivial task, write the "do not" section before the "do X" section. What are the boundaries? What failure modes would a plausible agent produce? What would technically satisfy the request but miss the point? Most people don't know their constraints until they try to write them. That discomfort is where the useful work is.

**Spec post-mortems.** When an agent surprises you, before correcting and moving on: which word, or which absence, in the specification allowed this? Over time this builds a personal taxonomy of your own failure modes — the ambiguity you consistently leave open, the negative space you consistently forget. No training course surfaces these. Reflection does.

**Domain transfer practice.** Take something you understand deeply and write a complete specification as if handing it to someone with zero domain context. No assumed knowledge, no shorthand, every implicit rule made explicit. Where you have to stop and think is where tacit knowledge lives — and tacit knowledge is what is hard to specify.

**Invert the order.** Write the test specification before the task specification. Define what done looks like, and what wrong looks like, before telling the agent what to do. This forces intent clarification before execution begins, surfaces ambiguity while it is still cheap to resolve, and produces a verification mechanism as a byproduct of the specification process.


# What Stays Open

The Cherny talk frames this as a printing press moment — literacy moving from a specialized few to the general population. Just as the printing press eliminated the scribe class without eliminating writing, AI may relocate who the engineer needs to be without eliminating engineering.

What the analogy doesn't reach: whether structured intent articulation can be taught, or whether it is mostly discovered through repeated failure. The printing press created literacy through instruction. It is not clear that specification craft works the same way — the failure modes are personal and the calibration is built through practice that no curriculum can shortcut.

That question seems worth sitting with.
