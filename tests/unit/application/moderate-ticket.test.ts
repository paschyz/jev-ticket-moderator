import { describe, it, expect } from 'vitest';
import { ModerateTicket } from '../../../src/application/moderate-ticket';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
import { FakeTicketModerator } from '../../fakes/fake-ticket-moderator';
import { Ticket } from '../../../src/domain/ticket';

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    message: 'Need help',
    status: 'open',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('ModerateTicket', () => {
  it('returns moderation from the moderator port', async () => {
    const repository = new InMemoryTicketRepository();
    const moderator = new FakeTicketModerator();
    const useCase = new ModerateTicket(repository, moderator);

    await repository.save(buildTicket());
    moderator.willReturn({
      category: 'technical',
      categoryConfidence: 0.9,
      urgency: 'medium',
      abusiveProbability: 0.05,
      humanReviewProbability: 0.1,
    });

    const moderation = await useCase.execute('ticket-1');

    expect(moderation.category).toBe('technical');
    expect(moderation.categoryConfidence).toBe(0.9);
  });

  it('updates ticket status to moderated', async () => {
    const repository = new InMemoryTicketRepository();
    const moderator = new FakeTicketModerator();
    const useCase = new ModerateTicket(repository, moderator);

    await repository.save(buildTicket());
    moderator.willReturn({
      category: 'billing',
      categoryConfidence: 0.8,
      urgency: 'low',
      abusiveProbability: 0.01,
      humanReviewProbability: 0.05,
    });

    await useCase.execute('ticket-1');

    const ticket = await repository.findById('ticket-1');
    expect(ticket?.status).toBe('moderated');
  });

  it('throws when ticket not found', async () => {
    const repository = new InMemoryTicketRepository();
    const moderator = new FakeTicketModerator();
    const useCase = new ModerateTicket(repository, moderator);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Ticket not found',
    );
  });
});
