import express from 'express';
import { CreateTicket } from '../../application/create-ticket.js';
import { ChangeUrgency } from '../../application/change-urgency.js';
import { DeleteTicket } from '../../application/delete-ticket.js';
import { ListTickets } from '../../application/list-tickets.js';
import { ModerateTicket } from '../../application/moderate-ticket.js';
import { RouteTicket } from '../../application/route-ticket.js';
import { TicketRepository } from '../../ports/ticket-repository.js';
import { TicketModerator } from '../../ports/ticket-moderator.js';

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
  const deleteTicket = new DeleteTicket(deps.ticketRepository);
  const changeUrgency = new ChangeUrgency(deps.ticketRepository);

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

  app.post('/tickets/:id/override-route', async (req, res) => {
    try {
      const { queue } = req.body;
      if (!queue) return res.status(400).json({ error: 'queue is required' });
      const ticket = await deps.ticketRepository.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      await deps.ticketRepository.save({
        ...ticket,
        status: 'routed',
        routing: { action: 'route', queue },
      });
      res.json({ action: 'route', queue });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/tickets/:id/urgency', async (req, res) => {
    try {
      await changeUrgency.execute(req.params.id, req.body.urgency);
      res.status(204).send();
    } catch (err) {
      const message = (err as Error).message;
      const status = message === 'Ticket not found' ? 404 : 400;
      res.status(status).json({ error: message });
    }
  });

  app.delete('/tickets/:id', async (req, res) => {
    try {
      await deleteTicket.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      const message = (err as Error).message;
      const status = message === 'Ticket not found' ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  return app;
}
