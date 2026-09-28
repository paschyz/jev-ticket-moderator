import { createApp } from './app';
import { InMemoryTicketRepository } from '../../infrastructure/persistence/in-memory-ticket-repository';
import { JevTicketModerator } from '../../infrastructure/jev/jev-ticket-moderator';

const app = createApp({
  ticketRepository: new InMemoryTicketRepository(),
  ticketModerator: new JevTicketModerator({
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    model: process.env.OPENROUTER_MODEL,
  }),
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
