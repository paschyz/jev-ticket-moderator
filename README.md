# Ticket Moderator

AI-powered support ticket moderation and routing system. Classifies incoming tickets by category and urgency using [Jev](https://openrouter.ai/) (via OpenRouter), then routes them to the appropriate queue or flags them for manual review based on deterministic rules.

Built as a portfolio project demonstrating hexagonal architecture, strict TDD, and clean separation between business logic and AI providers.

<img width="1092" height="482" alt="image" src="https://github.com/user-attachments/assets/0bd1dd92-ca8b-4e2b-94ac-5ac9fbd7408d" />
After Jev analysis :
<img width="1115" height="465" alt="image" src="https://github.com/user-attachments/assets/d461ca63-4bde-4e33-a74f-e4b9766e72be" />

## Features

- **Ticket Creation** — Submit support tickets via REST API
- **AI Moderation** — Jev classifies category (billing, technical, account, sales, other), urgency, and confidence scores
- **Deterministic Routing** — Rules-based routing with clear thresholds:
  - Classification confidence < 70% → manual review
  - Human review probability >= 60% → manual review
  - Otherwise → routed to category queue
- **React Dashboard** — Visual 3-step flow: create → analyze → route

## Architecture

Hexagonal (Ports & Adapters) with strict dependency direction:

```
Domain (types, routing rules)         ← zero dependencies
   ↑
Ports (TicketModerator, TicketRepository)  ← interfaces only
   ↑
Application (CreateTicket, ModerateTicket, RouteTicket)  ← orchestration
   ↑
Infrastructure (Jev adapter, persistence)  ← implements ports
Presentation (Express HTTP, React frontend)
```

Domain never imports from infrastructure. Enforced by [dependency-cruiser](https://github.com/sverweij/dependency-cruiser).

## Stack

**Backend:** TypeScript, Express, Vitest, dependency-cruiser
**AI:** OpenRouter SDK with `typesafe/jev-router` model (tool use for structured output)
**Frontend:** React 19, Vite, Tailwind CSS v4

## Quick Start

```bash
# Install
npm install
cd frontend && npm install && cd ..

# Configure
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

# Run
make dev        # Backend on :3000 (terminal 1)
make frontend   # Frontend on :5173 (terminal 2)
```

## Commands

```bash
make test             # All tests (29 unit/acceptance + 1 integration)
make test-unit        # Unit tests only
make test-acceptance  # HTTP end-to-end tests
make check            # typecheck + lint + architecture + test
make frontend         # Frontend dev server
make frontend-build   # Frontend production build
```

## API

| Endpoint | Description |
|---|---|
| `POST /tickets` | Create ticket `{ subject, message }` |
| `POST /tickets/:id/moderate` | Classify ticket with Jev |
| `POST /tickets/:id/route` | Route based on moderation `{ moderation }` |

## Testing

- **Unit tests** — Domain logic, use cases, fakes (no network)
- **Acceptance tests** — Full HTTP flow with `FakeTicketModerator` and DI via `createApp()`
- **Integration test** — Real Jev API call (skipped without `OPENROUTER_API_KEY`)
- **Architecture tests** — dependency-cruiser enforces no domain → infrastructure imports

## Project Structure

```
src/
  domain/           Pure types, entities, routing rules
  ports/            Interfaces (TicketModerator, TicketRepository)
  application/      Use cases (CreateTicket, ModerateTicket, RouteTicket)
  infrastructure/   Jev adapter, InMemoryTicketRepository
  presentation/     Express HTTP server

frontend/           React dashboard (Vite + Tailwind)
tests/              Unit, integration, acceptance, fakes
docs/adr/           Architecture Decision Records
```

## ADRs

- [ADR-001](docs/adr/ADR-001-hexagonal-architecture.md) — Hexagonal Architecture
- [ADR-002](docs/adr/ADR-002-jev-as-moderation-adapter.md) — Jev as Moderation Adapter
- [ADR-003](docs/adr/ADR-003-human-review-threshold.md) — Human Review Threshold

## License

MIT
