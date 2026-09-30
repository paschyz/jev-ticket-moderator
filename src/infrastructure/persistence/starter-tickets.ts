import { decideRouting } from '../../domain/routing-rules.js';
import { Ticket, TicketModeration } from '../../domain/ticket.js';

type Stage = 'open' | 'moderated' | 'decided';

function ticket(
  id: string,
  message: string,
  minutesAgo: number,
  now: Date,
  stage: Stage,
  moderation?: TicketModeration,
): Ticket {
  const base = {
    id,
    message,
    createdAt: new Date(now.getTime() - minutesAgo * 60_000),
  };
  if (stage === 'open' || !moderation) return { ...base, status: 'open' };
  if (stage === 'moderated') return { ...base, status: 'moderated', moderation };

  const routing = decideRouting(moderation);
  return {
    ...base,
    status: routing.action === 'route' ? 'routed' : 'manual_review',
    moderation,
    routing,
  };
}

function mod(
  category: TicketModeration['category'],
  urgency: TicketModeration['urgency'],
  categoryConfidence: number,
  humanReviewProbability = 0.1,
  abusiveProbability = 0.02,
): TicketModeration {
  return { category, urgency, categoryConfidence, humanReviewProbability, abusiveProbability };
}

// Sample tickets so the app never starts empty. Scores are real Jev output (captured 2026-09-30),
// not hand-written; routing is derived from them with the domain rules.
export function starterTickets(now: Date): Ticket[] {
  return [
    ticket('3f9a1c02', 'Do you offer a discount for annual plans for teams of 20?', 14, now, 'open'),
    ticket('b7e4d581', 'The export button does nothing when I click it in Safari.', 55, now, 'open'),

    ticket('c20d9e47', 'I was charged twice for my March invoice, can you refund one?', 190, now, 'decided',
      mod('billing', 'medium', 1, 0.43, 0.02)),
    ticket('5ad3f816', 'Webhook deliveries have been failing since this morning.', 320, now, 'moderated',
      mod('technical', 'high', 1, 0.79, 0.02)),

    ticket('e81b6a39', 'Where can I download my invoices as PDF?', 420, now, 'decided',
      mod('billing', 'low', 1, 0.13, 0.01)),
    ticket('94c7d2f0', 'API returns 500 on every POST to /orders, production is affected.', 610, now, 'decided',
      mod('technical', 'critical', 1, 0.93, 0.02)),
    ticket('1a6f8b53', 'I can\'t reset my password, the email never arrives.', 780, now, 'decided',
      mod('account', 'high', 0.99, 0.59, 0.02)),
    ticket('d05e3c74', 'We\'d like a quote for 200 seats with SSO.', 1480, now, 'decided',
      mod('sales', 'low', 1, 0.43, 0.02)),
    ticket('7b2c9a18', 'Just wanted to say the new dashboard is great, thanks!', 1900, now, 'decided',
      mod('other', 'low', 1, 0.17, 0.01)),

    ticket('8c15e7a2', 'Is there a rate limit on the public API, and what is it?', 2700, now, 'decided',
      mod('technical', 'low', 0.98, 0.1, 0.02)),

    ticket('a48f1d65', 'It\'s broken again, same thing as last week.', 260, now, 'decided',
      mod('technical', 'high', 1, 0.7, 0.03)),
    ticket('2e9d7b03', 'If this isn\'t fixed today I\'m calling my lawyer and cancelling everything.', 2400, now, 'decided',
      mod('abusive', 'high', 0.69, 0.92, 0.22)),
    ticket('f63a0e92', 'You people are useless idiots. Fix your garbage app or I\'ll make sure everyone knows how incompetent you are.', 95, now, 'decided',
      mod('abusive', 'medium', 1, 0.88, 0.98)),
  ];
}
