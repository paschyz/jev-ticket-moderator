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

  describe('routing right after analysis', () => {
    const passing = {
      category: 'billing' as const,
      categoryConfidence: 0.9,
      urgency: 'low' as const,
      abusiveProbability: 0.01,
      humanReviewProbability: 0.1,
    };

    async function moderateWith(moderation: typeof passing | Record<string, unknown>) {
      const repository = new InMemoryTicketRepository();
      const moderator = new FakeTicketModerator();
      await repository.save(buildTicket());
      moderator.willReturn({ ...passing, ...moderation } as typeof passing);
      await new ModerateTicket(repository, moderator).execute('ticket-1');
      return repository.findById('ticket-1');
    }

    it('routes to the category queue when every gate passes', async () => {
      const ticket = await moderateWith({});

      expect(ticket?.status).toBe('routed');
      expect(ticket?.routing).toEqual({ action: 'route', queue: 'billing' });
      expect(ticket?.moderation?.category).toBe('billing');
    });

    it('waits for a person when classification confidence is low', async () => {
      const ticket = await moderateWith({ categoryConfidence: 0.5 });

      expect(ticket?.status).toBe('moderated');
      expect(ticket?.routing).toBeUndefined();
    });

    it('waits for a person when human review probability is high', async () => {
      const ticket = await moderateWith({ humanReviewProbability: 0.8 });

      expect(ticket?.status).toBe('moderated');
      expect(ticket?.routing).toBeUndefined();
    });

    it('still routes abusive tickets straight to the abusive queue', async () => {
      const ticket = await moderateWith({ abusiveProbability: 0.9 });

      expect(ticket?.status).toBe('routed');
      expect(ticket?.routing).toEqual({ action: 'route', queue: 'abusive' });
    });
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
