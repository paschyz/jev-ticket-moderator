import { Ticket, TicketModeration } from '../domain/ticket';

export interface TicketModerator {
  moderate(ticket: Ticket): Promise<TicketModeration>;
}
