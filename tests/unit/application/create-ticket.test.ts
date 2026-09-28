import { describe, it, expect } from 'vitest';
import { CreateTicket } from '../../../src/application/create-ticket';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';

describe('CreateTicket', () => {
  it('creates a ticket with open status', async () => {
    const repository = new InMemoryTicketRepository();
    const createTicket = new CreateTicket(repository);

    const ticket = await createTicket.execute({
      message: 'I get an error when trying to login',
    });

    expect(ticket.message).toBe('I get an error when trying to login');
    expect(ticket.status).toBe('open');
    expect(ticket.id).toBeTruthy();
    expect(ticket.createdAt).toBeInstanceOf(Date);
  });

  it('persists the ticket in the repository', async () => {
    const repository = new InMemoryTicketRepository();
    const createTicket = new CreateTicket(repository);

    const ticket = await createTicket.execute({
      message: 'Need help',
    });

    const saved = await repository.findById(ticket.id);
    expect(saved).toEqual(ticket);
  });
});
