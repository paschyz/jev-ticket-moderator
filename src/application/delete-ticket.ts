import { TicketRepository } from '../ports/ticket-repository.js';

export class DeleteTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    await this.ticketRepository.deleteById(ticketId);
  }
}
