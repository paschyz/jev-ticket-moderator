import { Ticket } from '../domain/ticket';
import { TicketRepository } from '../ports/ticket-repository';

export class ListTickets {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(): Promise<Ticket[]> {
    return this.ticketRepository.findAll();
  }
}
