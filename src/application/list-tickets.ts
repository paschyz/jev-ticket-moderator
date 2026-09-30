import { Ticket } from '../domain/ticket.js';
import { TicketRepository } from '../ports/ticket-repository.js';

export class ListTickets {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(): Promise<Ticket[]> {
    return this.ticketRepository.findAll();
  }
}
