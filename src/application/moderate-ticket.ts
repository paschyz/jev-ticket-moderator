import { TicketModeration } from '../domain/ticket.js';
import { ABUSIVE_THRESHOLD, decideRouting } from '../domain/routing-rules.js';
import { TicketRepository } from '../ports/ticket-repository.js';
import { TicketModerator } from '../ports/ticket-moderator.js';

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
      return moderation;
    }

    // Auto-route only when every gate passes; otherwise a person decides ("Awaiting route").
    const decision = decideRouting(moderation);
    if (decision.action === 'route') {
      await this.ticketRepository.save({
        ...ticket,
        status: 'routed',
        moderation,
        routing: decision,
      });
    } else {
      await this.ticketRepository.save({ ...ticket, status: 'moderated', moderation });
    }

    return moderation;
  }
}
