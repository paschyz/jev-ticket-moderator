import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/presentation/http/app.js';
import { InMemoryTicketRepository } from '../src/infrastructure/persistence/in-memory-ticket-repository.js';
import { starterTickets } from '../src/infrastructure/persistence/starter-tickets.js';
import { JevTicketModerator } from '../src/infrastructure/jev/jev-ticket-moderator.js';

const app = createApp({
  ticketRepository: new InMemoryTicketRepository(starterTickets(new Date())),
  ticketModerator: new JevTicketModerator({
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    model: process.env.OPENROUTER_MODEL,
  }),
});

export default (req: VercelRequest, res: VercelResponse) => {
  app(req, res);
};
