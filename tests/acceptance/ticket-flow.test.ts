import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/presentation/http/app';
import { InMemoryTicketRepository } from '../../src/infrastructure/persistence/in-memory-ticket-repository';
import { FakeTicketModerator } from '../fakes/fake-ticket-moderator';

describe('Ticket moderation flow', () => {
  let server: Server;
  let baseUrl: string;
  let moderator: FakeTicketModerator;

  beforeAll(() => {
    moderator = new FakeTicketModerator();
    const app = createApp({
      ticketRepository: new InMemoryTicketRepository(),
      ticketModerator: moderator,
    });
    server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  it('creates, moderates, and routes a ticket to the right queue', async () => {
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Cannot download my invoice',
      }),
    });
    expect(createRes.status).toBe(201);
    const ticket = await createRes.json();
    expect(ticket.status).toBe('open');

    moderator.willReturn({
      category: 'billing',
      categoryConfidence: 0.92,
      urgency: 'medium',
      abusiveProbability: 0.02,
      humanReviewProbability: 0.1,
    });

    const modRes = await fetch(`${baseUrl}/tickets/${ticket.id}/moderate`, {
      method: 'POST',
    });
    expect(modRes.status).toBe(200);
    const moderation = await modRes.json();
    expect(moderation.category).toBe('billing');

    const routeRes = await fetch(`${baseUrl}/tickets/${ticket.id}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderation }),
    });
    expect(routeRes.status).toBe(200);
    const decision = await routeRes.json();
    expect(decision).toEqual({ action: 'route', queue: 'billing' });
  });

  it('routes to manual review when confidence is low', async () => {
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'unclear' }),
    });
    const ticket = await createRes.json();

    moderator.willReturn({
      category: 'other',
      categoryConfidence: 0.4,
      urgency: 'low',
      abusiveProbability: 0.0,
      humanReviewProbability: 0.3,
    });

    const modRes = await fetch(`${baseUrl}/tickets/${ticket.id}/moderate`, {
      method: 'POST',
    });
    const moderation = await modRes.json();

    const routeRes = await fetch(`${baseUrl}/tickets/${ticket.id}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderation }),
    });
    const decision = await routeRes.json();
    expect(decision.action).toBe('manual_review');
  });

  it('GET /tickets returns 200 with array of tickets', async () => {
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'List test body' }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${baseUrl}/tickets`);
    expect(listRes.status).toBe(200);
    const tickets = await listRes.json();
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThanOrEqual(1);
    expect(tickets.some((t: { message: string }) => t.message === 'List test body')).toBe(true);
  });

  it('returns 404 for unknown ticket', async () => {
    const res = await fetch(`${baseUrl}/tickets/unknown/moderate`, {
      method: 'POST',
    });
    expect(res.status).toBe(404);
  });
});
