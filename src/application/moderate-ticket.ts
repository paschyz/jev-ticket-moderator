import { TicketModeration } from '../domain/ticket';
import { TicketRepository } from '../ports/ticket-repository';
import { TicketModerator } from '../ports/ticket-moderator';

export class ModerateTicket {
  constructor(
    private ticketRepository: TicketRepository,
    private ticketModerator: TicketModerator,
  ) {}

  async execute(ticketId: string): Promise<TicketModeration> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    const moderation = await this.ticketModerator.moderate(ticket);
    await this.ticketRepository.save({ ...ticket, status: 'moderated' });
    return moderation;
  }
}
