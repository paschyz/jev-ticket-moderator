import { TicketModeration, RoutingDecision } from '../domain/ticket';
import { decideRouting } from '../domain/routing-rules';
import { TicketRepository } from '../ports/ticket-repository';

export class RouteTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(
    ticketId: string,
    moderation: TicketModeration,
  ): Promise<RoutingDecision> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const decision = decideRouting(moderation);
    const newStatus =
      decision.action === 'route' ? ('routed' as const) : ('manual_review' as const);
    await this.ticketRepository.save({ ...ticket, status: newStatus, routing: decision });

    return decision;
  }
}
