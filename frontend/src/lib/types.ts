export type Ticket = {
  id: string
  message: string
  status: string
  createdAt: string
}

export type Moderation = {
  category: string
  categoryConfidence: number
  urgency: string
  abusiveProbability: number
  humanReviewProbability: number
}

export type RoutingDecision =
  | { action: 'route'; queue: string }
  | { action: 'manual_review'; reason: string }
