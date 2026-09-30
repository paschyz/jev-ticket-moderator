import { URGENCIES, Urgency } from '../domain/ticket.js';
import { TicketRepository } from '../ports/ticket-repository.js';

export class ChangeUrgency {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: string, urgency: Urgency): Promise<void> {
    if (!URGENCIES.includes(urgency)) throw new Error('Invalid urgency');
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (!ticket.moderation) throw new Error('Ticket has not been analyzed');
    await this.ticketRepository.save({
      ...ticket,
      moderation: { ...ticket.moderation, urgency },
    });
  }
}
