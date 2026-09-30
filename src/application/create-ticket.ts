import { randomUUID } from 'node:crypto';
import { Ticket } from '../domain/ticket.js';
import { TicketRepository } from '../ports/ticket-repository.js';

const shortId = () => randomUUID().slice(0, 8);

export class CreateTicket {
  constructor(
    private ticketRepository: TicketRepository,
    private generateId: () => string = shortId,
  ) {}

  async execute(input: { message: string }): Promise<Ticket> {
    let id = this.generateId();
    while (await this.ticketRepository.findById(id)) id = this.generateId();

    const ticket: Ticket = {
      id,
      message: input.message,
      status: 'open',
      createdAt: new Date(),
    };
    await this.ticketRepository.save(ticket);
    return ticket;
  }
}
