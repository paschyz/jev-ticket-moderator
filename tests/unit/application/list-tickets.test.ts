import { describe, it, expect } from 'vitest';
import { ListTickets } from '../../../src/application/list-tickets';
import { InMemoryTicketRepository } from '../../../src/infrastructure/persistence/in-memory-ticket-repository';
import { CreateTicket } from '../../../src/application/create-ticket';

describe('ListTickets', () => {
  it('returns empty array when no tickets exist', async () => {
    const repository = new InMemoryTicketRepository();
    const listTickets = new ListTickets(repository);

    const tickets = await listTickets.execute();

    expect(tickets).toEqual([]);
  });

  it('returns all saved tickets', async () => {
    const repository = new InMemoryTicketRepository();
    const createTicket = new CreateTicket(repository);
    const listTickets = new ListTickets(repository);

    const t1 = await createTicket.execute({ message: 'a' });
    const t2 = await createTicket.execute({ message: 'b' });

    const tickets = await listTickets.execute();

    expect(tickets).toHaveLength(2);
    expect(tickets).toEqual(expect.arrayContaining([t1, t2]));
  });
});
