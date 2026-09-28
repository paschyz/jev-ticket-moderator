import { describe, it, expect } from 'vitest';
import { Ticket } from '../../../src/domain/ticket';
import { FakeTicketModerator } from '../../../src/infrastructure/jev/FakeTicketModerator';

function makeTicket(id: string, subject: string, message: string): Ticket {
  return { id, subject, message, status: 'open', createdAt: new Date() };
}

describe('FakeTicketModerator', () => {
  const moderator = new FakeTicketModerator();

  it('should classify technical tickets with high confidence', async () => {
    const ticket = makeTicket('t-1', 'Login API error on production', 'Critical: API call fails with 500');

    const mod = await moderator.moderate(ticket);

    expect(mod.category).toBe('technical');
    expect(mod.categoryConfidence).toBeGreaterThan(0.6);
  });

  it('should classify billing tickets correctly', async () => {
    const ticket = makeTicket('t-2', 'Invoice question', 'I was charged twice for my subscription this month');

    const mod = await moderator.moderate(ticket);

    expect(mod.category).toBe('billing');
    expect(mod.categoryConfidence).toBeGreaterThan(0.6);
  });

  it('should classify account tickets correctly', async () => {
    const ticket = makeTicket('t-3', 'Cannot access my account', 'Forgot password and reset email not arriving');

    const mod = await moderator.moderate(ticket);

    expect(mod.category).toBe('account');
    expect(mod.categoryConfidence).toBeGreaterThan(0.6);
  });

  it('should classify vague tickets as other with low confidence', async () => {
    const ticket = makeTicket('t-4', 'Something is wrong', 'Everything seems broken somehow');

    const mod = await moderator.moderate(ticket);

    expect(mod.category).toBe('other');
    expect(mod.categoryConfidence).toBeLessThan(0.7);
  });

  it('should classify unrecognized tickets as other with low confidence', async () => {
    const ticket = makeTicket('t-5', 'Something is off', 'I am not sure what the problem is');

    const mod = await moderator.moderate(ticket);

    expect(mod.category).toBe('other');
    expect(mod.categoryConfidence).toBeLessThan(0.7);
  });

  it('should detect abusive language', async () => {
    const ticket = makeTicket('t-6', 'Stupid service', 'This is a scam, I was defrauded');

    const mod = await moderator.moderate(ticket);

    expect(mod.abusiveProbability).toBeGreaterThan(0.5);
  });

  it('should be deterministic: same ticket.id produces same response', async () => {
    const ticket1 = makeTicket('t-7', 'First call', 'Some message');
    const ticket2 = makeTicket('t-7', 'First call', 'Some message');

    const mod1 = await moderator.moderate(ticket1);
    const mod2 = await moderator.moderate(ticket2);

    expect(mod1.categoryConfidence).toBe(mod2.categoryConfidence);
    expect(mod1.abusiveProbability).toBe(mod2.abusiveProbability);
    expect(mod1.humanReviewProbability).toBe(mod2.humanReviewProbability);
  });

  it('should set urgency to high for urgent tickets', async () => {
    const ticket = makeTicket('t-8', 'URGENT: Production down', 'Our service is down, cannot process requests');

    const mod = await moderator.moderate(ticket);

    expect(mod.urgency).toBe('high');
  });

  it('should flag complex tickets for human review', async () => {
    const ticket = makeTicket(
      't-9',
      'Unsure about pricing',
      'Sometimes the plan shows different pricing, maybe a bug, not sure',
    );

    const mod = await moderator.moderate(ticket);

    expect(mod.humanReviewProbability).toBeGreaterThan(0.5);
  });

  it('should never return probabilities outside [0, 1]', async () => {
    const ticket = makeTicket('t-10', 'Random ticket', 'This is a test');

    const mod = await moderator.moderate(ticket);

    expect(mod.categoryConfidence).toBeGreaterThanOrEqual(0);
    expect(mod.categoryConfidence).toBeLessThanOrEqual(1);
    expect(mod.abusiveProbability).toBeGreaterThanOrEqual(0);
    expect(mod.abusiveProbability).toBeLessThanOrEqual(1);
    expect(mod.humanReviewProbability).toBeGreaterThanOrEqual(0);
    expect(mod.humanReviewProbability).toBeLessThanOrEqual(1);
  });
});
