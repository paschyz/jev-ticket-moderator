import { createApp } from '../src/presentation/http/app';
import { InMemoryTicketRepository } from '../src/infrastructure/persistence/in-memory-ticket-repository';
import { JevTicketModerator } from '../src/infrastructure/jev/jev-ticket-moderator';

const app = createApp({
  ticketRepository: new InMemoryTicketRepository(),
  ticketModerator: new JevTicketModerator({
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    model: process.env.OPENROUTER_MODEL,
  }),
});

export default app;
