import { randomUUID } from 'node:crypto';
import { Ticket } from '../domain/ticket';
import { TicketRepository } from '../ports/ticket-repository';

export class CreateTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(input: { subject: string; message: string }): Promise<Ticket> {
    const ticket: Ticket = {
      id: randomUUID(),
      subject: input.subject,
      message: input.message,
      status: 'open',
      createdAt: new Date(),
    };
    await this.ticketRepository.save(ticket);
    return ticket;
  }
}
