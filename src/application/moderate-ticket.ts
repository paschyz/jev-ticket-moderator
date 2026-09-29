import { TicketModeration } from '../domain/ticket';
import { ABUSIVE_THRESHOLD } from '../domain/routing-rules';
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

    if (moderation.abusiveProbability >= ABUSIVE_THRESHOLD) {
      await this.ticketRepository.save({
        ...ticket,
        status: 'routed',
        moderation,
        routing: { action: 'route', queue: 'abusive' },
      });
    } else {
      await this.ticketRepository.save({ ...ticket, status: 'moderated', moderation });
    }

    return moderation;
  }
}
