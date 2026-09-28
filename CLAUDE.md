# CLAUDE.md — Development Guidelines

## Architecture Principles

### Hexagonal (Ports & Adapters)

```
DOMAIN (pure logic, zero dependencies)
   ↑ ↓
PORTS (interfaces: TicketModerator, TicketRepository)
   ↑ ↓
ADAPTERS (Jev, HTTP, persistence)
```

**Direction of dependencies:** Infrastructure → Application → Domain (never reverse).

**Domain invariant:** Domain code imports ONLY from domain. Never infrastructure, never HTTP.

### Separation of Concerns

- **Domain:** Entities, types, rules (routing). Pure functions.
- **Application:** Use cases, orchestration. No business logic.
- **Infrastructure:** Jev SDK, Express, persistence. Implements ports.
- **Presentation:** HTTP controllers. Maps DTO ↔ domain entities.

### No Speculative Abstractions

Only add interfaces when:
1. Multiple implementations exist or will soon (e.g., JevModerator + FakeTicketModerator)
2. Replacing the implementation requires no code changes elsewhere

No "for later" scaffolding. No unused types.

## TDD Workflow

1. **RED:** Write test for unimplemented behavior
2. **Verify RED:** Run test, confirm it fails for the right reason
3. **GREEN:** Minimal code to pass test
4. **REFACTOR:** Extract, simplify, improve (never change test)
5. **Commit:** Small, atomic commits per feature

**Forbidden:** Modifying tests to make bad code pass.

## Definition of Done

- [ ] Tests written first (RED)
- [ ] Code passes tests (GREEN)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript strict (`npm run typecheck`)
- [ ] Architecture enforced (`npm run architecture`)
- [ ] All tests pass (`npm run test`)
- [ ] Meaningful commit message
- [ ] Code reviewed (if complex, call `architect` or `reviewer` agent)

## Code Review Checklist

Before committing:
1. **Correctness:** Do tests cover the behavior? Edge cases?
2. **Architecture:** Any domain → infrastructure leaks?
3. **Clarity:** Is the code easy to understand?
4. **Simplicity:** Any unnecessary complexity?
5. **Duplication:** Could this reuse existing code?

## Rules

1. **Domain is pure.** No Jev imports, no HTTP, no dates from Date.now(). Inject time.
2. **Ports are thin.** Only interface definitions, no logic.
3. **Adapters are focused.** One adapter, one external system.
4. **Tests are observable.** Test what the code does, not how it does it.
5. **Commits are small.** One feature per commit, easy to review.

## Agents

- **architect** — checks diffs for architecture violations (domain→infrastructure)
- **test-writer** — designs test scenarios, edge cases, before coding
- **reviewer** — audits final code for correctness, missing tests, regressions

Use agents when:
- A change affects boundaries (when? call architect)
- A feature needs careful test design (complex logic)
- A PR is large or complex (full review)

Never call agents for trivial changes (typo fixes, comment updates).

## Useful Commands

```bash
make dev              # Run dev server (tsx)
make test             # Run all tests
make test-unit        # Unit tests only
make test-integration # Integration tests only
make lint             # Run ESLint
make typecheck        # TypeScript strict
make architecture     # Check dependency rules
make check            # All validations (lint + typecheck + architecture + test)
```

## Jev Integration

Jev is isolated behind the `TicketModerator` port (`src/ports/ticket-moderator.ts`).
- `JevTicketModerator` — real adapter, not yet implemented (TODO)
- `FakeTicketModerator` — test fake in `tests/fakes/`

When ready to connect Jev:
1. Implement `JevTicketModerator` in `src/infrastructure/jev/`
2. No other code changes needed (port abstraction protects the rest)

## Project Structure

```
src/
  domain/              (types, entities, routing rules — zero dependencies)
  ports/               (interfaces: TicketRepository, TicketModerator)
  application/         (use cases: CreateTicket, ModerateTicket, RouteTicket)
  infrastructure/
    jev/               (Jev adapter — implements TicketModerator)
    persistence/       (InMemoryTicketRepository)
  presentation/
    http/              (Express server — thin controllers)

tests/
  unit/                (domain + application, no network)
  integration/         (adapters with real dependencies)
  acceptance/          (HTTP endpoints end-to-end)
  fakes/               (FakeTicketModerator)

docs/adr/              (decision records)
.claude/agents/        (architect, test-writer, reviewer)
.claude/commands/      (/feature workflow)
```
