# Ticket Moderator — Frontend

React dashboard for the ticket moderation system. Demonstrates the full flow: create a support ticket, analyze it with Jev (AI classification), and route it based on deterministic rules.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4

## Quick Start

```bash
# From project root
make frontend-install   # Install dependencies
make dev                # Start backend (terminal 1)
make frontend           # Start frontend (terminal 2)
```

Open http://localhost:5173

## How It Works

The UI is a single-page 3-step flow:

1. **Create Ticket** — Submit subject + message → `POST /tickets`
2. **Analyze with Jev** — AI classifies category, urgency, confidence scores → `POST /tickets/:id/moderate`
3. **Route Ticket** — Deterministic routing based on moderation result → `POST /tickets/:id/route`
   - Confidence < 70% → manual review
   - Human review probability >= 60% → manual review
   - Otherwise → routed to category queue

Vite proxies `/tickets` requests to the backend at `localhost:3000`.

## Build

```bash
make frontend-build     # Production build → frontend/dist/
```
