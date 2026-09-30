import { randomUUID } from 'node:crypto';
import { Ticket } from '../domain/ticket.js';
import { TicketRepository } from '../ports/ticket-repository.js';

export class CreateTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(input: { message: string }): Promise<Ticket> {
    const ticket: Ticket = {
      id: randomUUID(),
      message: input.message,
      status: 'open',
      createdAt: new Date(),
    };
    await this.ticketRepository.save(ticket);
    return ticket;
  }
}
