---
title: "Who Should Test the Specification?"
status: draft
created: 2026-05-13
modified: 2026-05-13
tags:
  - specification
  - quality
  - testing
  - ai-architecture
  - agentic-engineering
related:
  - "[[specification-craft-and-domain-expert-engineering|The Specification Craft: What Comes After AI Writes the Code]]"
---

# Who Should Test the Specification?

There is a passage in [[specification-craft-and-domain-expert-engineering|Notes on a Talk by Boris Cherny (AI Ascent 2026)]] that deserves a harder look:

> The same person who specifies what correct behavior looks like is best positioned to specify what a passing test looks like. Both draw on the same domain knowledge.

The claim is intuitive. The accountant who wrote the spec knows accounting. Of course they know what a passing test looks like.

But this conflates two different kinds of knowing. Knowing a domain is not the same as knowing the gaps in your articulation of it — a distinction [[leader-judgment-and-people-typology|Leader Judgment: Reading People and Knowing Your Limits]] frames through the circle of competence: what you operate on confidently and what you actually understand are not the same boundary.


# The Author's Blind Spot

In software quality, there is an old and well-supported principle: a developer should not test their own code. The reason is not competence. The developer is probably the most competent person available. The reason is that writing the code and testing the code require opposite cognitive stances.

Writing code means committing to a model: this is how the problem works, these are the cases that matter, this is what the edge looks like. Testing code means attacking that model: what did the author assume, what did they forget to consider, where is the boundary drawn wrong?

The same person cannot hold both stances at once. The assumptions that shaped the original work become invisible to the author — not absent, but unexaminable from inside them. [[systems-thinking-foundations|Systems Thinking: Foundations]] names this directly: untested mental models are not gaps you can see and fill; they are the frame through which you see everything else. They test what they believe is correct, and they believe it because they already committed to it when they wrote the spec.

Myers put this plainly in *The Art of Software Testing*: you cannot find errors in your own thinking by re-examining the same thinking. Someone else has to bring a different model of the problem.


# The Spec-Test Symbiosis Trap

The scenario in the specification-craft argument is: domain expert writes behavioral spec, domain expert writes test spec, agent runs both, trust circle closes.

The trap: when spec and tests share an author, the tests verify conformance to the spec's assumptions, not correctness beyond them. The tests will pass exactly when the spec's model of the world is self-consistent. They cannot catch the cases the spec didn't think to model.

An accountant who omitted a tax treatment from the behavioral spec will also omit it from the test spec. Not from ignorance of accounting, but because the omission is invisible to them — it was invisible in the first place. The tests confirm the spec. They don't interrogate it.

This is the same failure mode that makes code review by the author nearly useless. You look at what you wrote and see what you meant. The spec author looks at the test and sees whether it matches their intent. That is not verification; it is re-reading.


# What Independent Testing Actually Catches

The separation of specification and verification roles in quality engineering is not bureaucratic caution. It is a correction mechanism for a specific and predictable failure: the spec author's mental model is incomplete in exactly the ways they cannot see.

Independent testing catches three categories the spec author misses.

**Model disagreement:** a second domain expert may hold a different mental model of the same behavior. The difference is diagnostic. If two accountants disagree about what a passing test looks like, the spec is underdetermined, not the test.

**Unstated assumptions:** the spec author uses shorthand, assumes shared context, leaves implicit what seems obvious. An independent tester does not share the context. Every gap in the spec becomes a question they cannot answer. Those questions identify exactly what the spec failed to articulate.

**Adversarial framing:** the spec author is trying to make the system work. An independent tester is, or should be, trying to break it. That is a different activity. It surfaces edge cases the spec author never generated because they were never in the frame of "what could go wrong."


# The Accountability Gap

There is also an accountability structure at stake, separate from cognition.

In regulated industries, the separation between specification and verification is often mandatory. An auditor who audits their own work is not an auditor; they are a re-reader. The value of independent verification is that it creates accountability: someone whose job is to find what you missed, not confirm what you did.

When the spec author is also the test author, there is no accountability surface. A passing test tells you the spec is self-consistent. It tells you nothing about whether the spec was right. The system may conform perfectly to a specification that was wrong from the start.


# What This Means for the Agentic Scenario

The pipeline [[spec-driven-development|Spec-Driven Development with AI]] formalizes — spec as primary artifact, tests as verification layer, agent as executor — is a strong model for how to work. The note that started this argument places the trust closure at: "The agent executes against both. The human reviews outputs, not code."

If spec and tests share an author, what the human is reviewing is whether the agent faithfully executed their own assumptions. That is a useful check, but it is not the check being claimed. It does not close the gap between the spec and the actual desired behavior. It only confirms the spec is internally consistent.

The harder question is: who tests the specification itself?

In traditional software, this role is distributed across code review, QA, user acceptance testing, production monitoring, and eventually users. The spec is never fully verified by the person who wrote it. It gets tested by contact with a world that doesn't share the author's mental model.

In the agentic scenario, none of those correction mechanisms are named. The domain expert writes the spec, writes the tests, and reviews the outputs. If their mental model was wrong at the start, the pipeline confirms the error with high confidence and no friction.

A different accountant reviewing the test spec before the agent runs it would be more valuable than a faster feedback loop on a closed system.


# What Stays Open

This is not an argument against domain experts as spec authors. The original claim — that domain knowledge is the critical input and that domain experts are best positioned to supply it — is probably right.

The gap is the separation of roles, not the elimination of domain knowledge. The person who writes the spec and the person who writes the tests probably need to be different people, or at minimum need to approach the same specification from different starting assumptions.

Whether that separation survives the economics of agentic workflows is unclear. Independent testing has always been expensive: it requires a second person who knows enough to test but was not part of the original design. That may be harder to maintain when the entire loop is supposed to run autonomously.

The question the specification-craft argument doesn't reach: if the agent is running the tests, who is testing the tests?
