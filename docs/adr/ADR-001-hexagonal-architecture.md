# ADR-001: Hexagonal Architecture

**Status:** Accepted  
**Date:** 2026-09-28

## Context

The system needs to integrate an external AI service (Jev) for ticket classification while maintaining clean, testable code. Different layers have different stability requirements:
- Domain logic must be stable, testable offline, independent of external services
- Infrastructure (Jev, HTTP) changes frequently
- Testing should not require external API calls

## Decision

Adopt hexagonal (ports & adapters) architecture:

**Core layers (inside-out):**
1. **Domain:** Pure business logic, entities, rules. Zero external dependencies.
2. **Ports:** Interface definitions (e.g., TicketModerator, TicketRepository)
3. **Application:** Use case orchestration. Calls domain + ports, no infrastructure details.
4. **Infrastructure:** External integrations (Jev, HTTP, persistence). Implements ports.

**Dependencies:** Always point inward (infrastructure → application → domain). Never outward (domain → infrastructure).

## Consequences

✅ **Benefits:**
- Domain testable without Jev SDK or network
- Jev can be swapped (real → fake → other classifier) with zero domain/app changes
- Clear boundaries reduce coupling
- Easy to understand responsibilities per layer

⚠️ **Costs:**
- More files, more interfaces (but clearer structure)
- Requires discipline not to let infrastructure leak into domain

## Examples

**Allowed dependency:**
```typescript
// src/application/usecases/ModerateTicketUseCase.ts
import { TicketModerator } from '@/ports/TicketModerator'; // ✅ port
import { Ticket } from '@/domain/entities/Ticket'; // ✅ domain

// src/infrastructure/jev/JevTicketModerator.ts
import { TicketModerator } from '@/ports/TicketModerator'; // ✅ implements port
// (may import Jev SDK here)
```

**Forbidden dependency:**
```typescript
// src/domain/rules/routingRules.ts
import { JevTicketModerator } from '@/infrastructure/jev'; // ❌ NEVER
```
