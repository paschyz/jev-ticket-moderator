import express from 'express';
import { CreateTicket } from '../../application/create-ticket';
import { ListTickets } from '../../application/list-tickets';
import { ModerateTicket } from '../../application/moderate-ticket';
import { RouteTicket } from '../../application/route-ticket';
import { TicketRepository } from '../../ports/ticket-repository';
import { TicketModerator } from '../../ports/ticket-moderator';

export function createApp(deps: {
  ticketRepository: TicketRepository;
  ticketModerator: TicketModerator;
}) {
  const app = express();
  app.use(express.json());

  const listTickets = new ListTickets(deps.ticketRepository);
  const createTicket = new CreateTicket(deps.ticketRepository);
  const moderateTicket = new ModerateTicket(
    deps.ticketRepository,
    deps.ticketModerator,
  );
  const routeTicket = new RouteTicket(deps.ticketRepository);

  app.get('/tickets', async (_req, res) => {
    const tickets = await listTickets.execute();
    res.json(tickets);
  });

  app.post('/tickets', async (req, res) => {
    try {
      const ticket = await createTicket.execute(req.body);
      res.status(201).json(ticket);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/tickets/:id/moderate', async (req, res) => {
    try {
      const moderation = await moderateTicket.execute(req.params.id);
      res.json(moderation);
    } catch (err) {
      const message = (err as Error).message;
      const status = message === 'Ticket not found' ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/tickets/:id/route', async (req, res) => {
    try {
      const decision = await routeTicket.execute(
        req.params.id,
        req.body.moderation,
      );
      res.json(decision);
    } catch (err) {
      const message = (err as Error).message;
      const status = message === 'Ticket not found' ? 404 : 400;
      res.status(status).json({ error: message });
    }
  });

  return app;
}
