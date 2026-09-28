import { Ticket, TicketModeration } from '../../src/domain/ticket';
import { TicketModerator } from '../../src/ports/ticket-moderator';

export class FakeTicketModerator implements TicketModerator {
  private response: TicketModeration | null = null;

  willReturn(moderation: TicketModeration): void {
    this.response = moderation;
  }

  async moderate(_ticket: Ticket): Promise<TicketModeration> {
    if (!this.response)
      throw new Error('FakeTicketModerator: no response configured');
    return this.response;
  }
}
