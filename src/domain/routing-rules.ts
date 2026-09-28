import { TicketModeration, RoutingDecision } from './ticket';

export function decideRouting(moderation: TicketModeration): RoutingDecision {
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
