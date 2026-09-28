# ADR-002: Jev as Moderation Adapter

**Status:** Accepted  
**Date:** 2026-09-28

## Context

The system needs a ticket classification service. Jev is a probabilistic classifier that analyzes ticket text and returns category, confidence, urgency, abuse probability, etc. Initially, we won't integrate real Jev; we'll use a Fake implementation.

## Decision

1. Define `TicketModerator` interface (port) that abstracts moderation logic
2. Implement `FakeTicketModerator` with realistic, deterministic responses
3. Implement `JevTicketModerator` as a stub (throws "pending OpenRouter integration")
4. Application uses the port; infrastructure provides the implementation

**Fake responses are deterministic (seeded by ticket.id)** so tests are reproducible.

## Consequences

✅ **Benefits:**
- Tests run without Jev API, no network calls
- Easy to test edge cases (low confidence, high abuse probability)
- Swapping Jev for another classifier requires ONE adapter change
- Application/domain unchanged when Jev integration arrives

⚠️ **Costs:**
- Must maintain fake responses (but provides value as integration documentation)
- Extra interface layer (minor complexity, huge testability gain)

## Implementation Notes

- `FakeTicketModerator` analyzes ticket subject/message to generate category + confidence
- Abusive content triggers high `abusiveProbability`
- Special characters, unicode, empty messages → valid (no crashes)
- Seeds PRNG with ticket.id for reproducibility (same ticket → same response across runs)
