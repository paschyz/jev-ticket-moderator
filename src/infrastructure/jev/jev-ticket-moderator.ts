import { Ticket, TicketModeration } from '../../domain/ticket';
import { TicketModerator } from '../../ports/ticket-moderator';

// TODO: Connect to real Jev API when available
export class JevTicketModerator implements TicketModerator {
  async moderate(_ticket: Ticket): Promise<TicketModeration> {
    throw new Error('Jev integration not yet implemented');
  }
}
