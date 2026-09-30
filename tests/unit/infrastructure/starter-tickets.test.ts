import { describe, it, expect } from 'vitest';
import { starterTickets } from '../../../src/infrastructure/persistence/starter-tickets';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
import { decideRouting } from '../../../src/domain/routing-rules';

const now = new Date('2026-06-15T12:00:00Z');

describe('starterTickets', () => {
  const tickets = starterTickets(now);

  it('has unique 8-character hex ids', () => {
    const ids = tickets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}$/);
  });

  it('covers every workflow state so the whole UI has something to show', () => {
    const statuses = new Set(tickets.map((t) => t.status));
    expect(statuses).toEqual(new Set(['open', 'moderated', 'routed', 'manual_review']));
  });

  it('includes an abusive ticket in manual review and every queue', () => {
    expect(
      tickets.some((t) => t.status === 'manual_review' && t.moderation?.category === 'abusive'),
    ).toBe(true);
    const queues = new Set(
      tickets.flatMap((t) => (t.routing?.action === 'route' ? [t.routing.queue] : [])),
    );
    expect(queues).toEqual(new Set(['account', 'billing', 'sales', 'technical', 'other']));
  });

  it('keeps status and routing consistent with the routing rules', () => {
    for (const t of tickets.filter((x) => x.routing)) {
      expect(t.routing).toEqual(decideRouting(t.moderation!));
      expect(t.status).toBe(t.routing!.action === 'route' ? 'routed' : 'manual_review');
    }
  });

  it('dates tickets in the past, relative to the injected clock', () => {
    for (const t of tickets) expect(t.createdAt.getTime()).toBeLessThan(now.getTime());
  });
});

describe('InMemoryTicketRepository with initial tickets', () => {
  it('starts with the given tickets', async () => {
    const tickets = starterTickets(now);
    const repository = new InMemoryTicketRepository(tickets);

    expect(await repository.findAll()).toHaveLength(tickets.length);
    expect(await repository.findById(tickets[0].id)).toEqual(tickets[0]);
  });
});
