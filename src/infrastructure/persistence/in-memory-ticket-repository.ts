import { Ticket } from '../../domain/ticket';
import { TicketRepository } from '../../ports/ticket-repository';

export class InMemoryTicketRepository implements TicketRepository {
  private tickets = new Map<string, Ticket>();

  async save(ticket: Ticket): Promise<void> {
    this.tickets.set(ticket.id, ticket);
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) ?? null;
  }

  async findAll(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async deleteById(id: string): Promise<void> {
    this.tickets.delete(id);
  }
}
