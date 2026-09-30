import { TicketModeration, RoutingDecision } from './ticket.js';

export const ABUSIVE_THRESHOLD = 0.5;

export function decideRouting(moderation: TicketModeration): RoutingDecision {
  if (moderation.category === 'abusive') {
    return { action: 'manual_review', reason: 'Abusive content detected' };
  }
  if (moderation.categoryConfidence < 0.7) {
    return { action: 'manual_review', reason: 'Low classification confidence' };
  }
  if (moderation.humanReviewProbability >= 0.6) {
    return {
      action: 'manual_review',
      reason: 'High human review probability',
    };
  }
  return { action: 'route', queue: moderation.category };
}
