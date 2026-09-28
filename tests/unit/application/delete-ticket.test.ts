import { describe, it, expect } from 'vitest';
import { DeleteTicket } from '../../../src/application/delete-ticket';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
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

describe('DeleteTicket', () => {
  it('removes the ticket from the repository', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new DeleteTicket(repository);

    await repository.save(buildTicket());
    await useCase.execute('ticket-1');

    expect(await repository.findById('ticket-1')).toBeNull();
  });

  it('throws when ticket not found', async () => {
    const repository = new InMemoryTicketRepository();
    const useCase = new DeleteTicket(repository);

    await expect(useCase.execute('nonexistent')).rejects.toThrow('Ticket not found');
  });
});
