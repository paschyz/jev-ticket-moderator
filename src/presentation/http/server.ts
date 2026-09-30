import { createApp } from './app.js';
import { InMemoryTicketRepository } from '../../infrastructure/persistence/in-memory-ticket-repository.js';
import { JevTicketModerator } from '../../infrastructure/jev/jev-ticket-moderator.js';

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
