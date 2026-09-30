import { Ticket, TicketModeration } from '../domain/ticket.js';

export interface TicketModerator {
  moderate(ticket: Ticket): Promise<TicketModeration>;
}
