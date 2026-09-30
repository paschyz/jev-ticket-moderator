export type TicketCategory =
  | 'billing'
  | 'technical'
  | 'account'
  | 'sales'
  | 'abusive'
  | 'other';

export const URGENCIES = ['low', 'medium', 'high', 'critical'] as const;
export type Urgency = (typeof URGENCIES)[number];

export type TicketStatus = 'open' | 'moderated' | 'routed' | 'manual_review';

export interface Ticket {
  id: string;
  message: string;
  status: TicketStatus;
  createdAt: Date;
  moderation?: TicketModeration;
  routing?: RoutingDecision;
}

export interface TicketModeration {
  category: TicketCategory;
  categoryConfidence: number;
  urgency: Urgency;
  abusiveProbability: number;
  humanReviewProbability: number;
}

export type RoutingDecision =
  | { action: 'route'; queue: TicketCategory }
  | { action: 'manual_review'; reason: string };
