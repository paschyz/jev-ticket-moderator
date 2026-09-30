import { describe, it, expect } from 'vitest';
import { ChangeUrgency } from '../../../src/application/change-urgency';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
import { Ticket } from '../../../src/domain/ticket';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    message: 'Need help',
    status: 'routed',
    createdAt: new Date('2026-01-01'),
    moderation: {
      category: 'billing',
      categoryConfidence: 0.9,
      urgency: 'low',
      abusiveProbability: 0.02,
      humanReviewProbability: 0.1,
    },
    routing: { action: 'route', queue: 'billing' },
    ...overrides,
  };
}

describe('ChangeUrgency', () => {
  it('updates the urgency and leaves the rest of the ticket untouched', async () => {
    const repository = new InMemoryTicketRepository();
    const original = buildTicket();
    await repository.save(original);

    await new ChangeUrgency(repository).execute('ticket-1', 'critical');

    const saved = await repository.findById('ticket-1');
    expect(saved).toEqual({
      ...original,
      moderation: { ...original.moderation, urgency: 'critical' },
    });
  });

  it('throws when the ticket is not found', async () => {
    const useCase = new ChangeUrgency(new InMemoryTicketRepository());

    await expect(useCase.execute('nope', 'high')).rejects.toThrow('Ticket not found');
  });

  it('throws when the ticket has not been analyzed yet', async () => {
    const repository = new InMemoryTicketRepository();
    await repository.save(
      buildTicket({ status: 'open', moderation: undefined, routing: undefined }),
    );

    await expect(
      new ChangeUrgency(repository).execute('ticket-1', 'high'),
    ).rejects.toThrow('Ticket has not been analyzed');
  });

  it('rejects an unknown urgency', async () => {
    const repository = new InMemoryTicketRepository();
    await repository.save(buildTicket());

    await expect(
      new ChangeUrgency(repository).execute('ticket-1', 'urgent!' as never),
    ).rejects.toThrow('Invalid urgency');
  });
});
