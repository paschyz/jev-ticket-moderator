import { describe, it, expect } from 'vitest';
import { RouteTicket } from '../../../src/application/route-ticket';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
import { Ticket, TicketModeration } from '../../../src/domain/ticket';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    subject: 'Help',
    message: 'Need help',
    status: 'moderated',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildModeration(
  overrides: Partial<TicketModeration> = {},
): TicketModeration {
  return {
    category: 'billing',
    categoryConfidence: 0.85,
    urgency: 'medium',
    abusiveProbability: 0.05,
    humanReviewProbability: 0.1,
    ...overrides,
  };
}

describe('RouteTicket', () => {
  it('routes ticket to category queue', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new RouteTicket(repository);

    await repository.save(buildTicket());
    const decision = await useCase.execute('ticket-1', buildModeration());

    expect(decision).toEqual({ action: 'route', queue: 'billing' });
  });

  it('updates ticket status to routed', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new RouteTicket(repository);

    await repository.save(buildTicket());
    await useCase.execute('ticket-1', buildModeration());

    const ticket = await repository.findById('ticket-1');
    expect(ticket?.status).toBe('routed');
  });

  it('sends to manual review and updates status', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new RouteTicket(repository);

    await repository.save(buildTicket());
    const decision = await useCase.execute(
      'ticket-1',
      buildModeration({ categoryConfidence: 0.5 }),
    );

    expect(decision.action).toBe('manual_review');
    const ticket = await repository.findById('ticket-1');
    expect(ticket?.status).toBe('manual_review');
  });

  it('throws when ticket not found', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new RouteTicket(repository);

    await expect(
      useCase.execute('nonexistent', buildModeration()),
    ).rejects.toThrow('Ticket not found');
  });
});
