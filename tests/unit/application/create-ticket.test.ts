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

  it('generates an 8-character hex id', async () => {
    const createTicket = new CreateTicket(new InMemoryTicketRepository());

    const ticket = await createTicket.execute({ message: 'Need help' });

    expect(ticket.id).toMatch(/^[0-9a-f]{8}$/);
  });

  it('never reuses an id already taken', async () => {
    const repository = new InMemoryTicketRepository();
    const ids = ['aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', 'bbbbbbbb'];
    const createTicket = new CreateTicket(repository, () => ids.shift()!);

    const first = await createTicket.execute({ message: 'one' });
    const second = await createTicket.execute({ message: 'two' });

    expect(first.id).toBe('aaaaaaaa');
    expect(second.id).toBe('bbbbbbbb');
    expect(await repository.findAll()).toHaveLength(2);
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
