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

  it('creates a ticket and auto-routes it to the right queue when analysis is confident', async () => {
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

    const listed = await (await fetch(`${baseUrl}/tickets`)).json();
    const saved = listed.find((t: { id: string }) => t.id === ticket.id);
    expect(saved.status).toBe('routed');
    expect(saved.routing).toEqual({ action: 'route', queue: 'billing' });
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

  it('DELETE /tickets/:id removes the ticket and returns 204', async () => {
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'To be deleted' }),
    });
    const ticket = await createRes.json();

    const deleteRes = await fetch(`${baseUrl}/tickets/${ticket.id}`, { method: 'DELETE' });
    expect(deleteRes.status).toBe(204);

    const listRes = await fetch(`${baseUrl}/tickets`);
    const tickets = await listRes.json();
    expect(tickets.some((t: { id: string }) => t.id === ticket.id)).toBe(false);
  });

  it('DELETE /tickets/:id returns 404 for unknown ticket', async () => {
    const res = await fetch(`${baseUrl}/tickets/nonexistent`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
  it('changes the urgency of an analyzed ticket over HTTP', async () => {
    const created = await (
      await fetch(`${baseUrl}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Site is down' }),
      })
    ).json();
    moderator.willReturn({
      category: 'technical',
      categoryConfidence: 0.9,
      urgency: 'low',
      abusiveProbability: 0.01,
      humanReviewProbability: 0.1,
    });
    await fetch(`${baseUrl}/tickets/${created.id}/moderate`, { method: 'POST' });

    const res = await fetch(`${baseUrl}/tickets/${created.id}/urgency`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urgency: 'critical' }),
    });
    expect(res.status).toBe(204);

    const list = await (await fetch(`${baseUrl}/tickets`)).json();
    const updated = list.find((t: { id: string }) => t.id === created.id);
    expect(updated.moderation.urgency).toBe('critical');

    const bad = await fetch(`${baseUrl}/tickets/${created.id}/urgency`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urgency: 'nope' }),
    });
    expect(bad.status).toBe(400);
  });
});
