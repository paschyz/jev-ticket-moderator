import express from 'express';
import { CreateTicket } from '../../application/create-ticket';
import { ModerateTicket } from '../../application/moderate-ticket';
import { RouteTicket } from '../../application/route-ticket';
import { InMemoryTicketRepository } from '../../infrastructure/persistence/in-memory-ticket-repository';
import { JevTicketModerator } from '../../infrastructure/jev/jev-ticket-moderator';

const app = express();
app.use(express.json());

const ticketRepository = new InMemoryTicketRepository();
const ticketModerator = new JevTicketModerator();

const createTicket = new CreateTicket(ticketRepository);
const moderateTicket = new ModerateTicket(ticketRepository, ticketModerator);
const routeTicket = new RouteTicket(ticketRepository);

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

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { app };
