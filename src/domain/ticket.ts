export type TicketCategory =
  | 'billing'
  | 'technical'
  | 'account'
  | 'sales'
  | 'other';

export type TicketStatus = 'open' | 'moderated' | 'routed' | 'manual_review';

export interface Ticket {
  id: string;
  message: string;
  status: TicketStatus;
  createdAt: Date;
}

export interface TicketModeration {
  category: TicketCategory;
  categoryConfidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  abusiveProbability: number;
  humanReviewProbability: number;
}

export type RoutingDecision =
  | { action: 'route'; queue: TicketCategory }
  | { action: 'manual_review'; reason: string };
