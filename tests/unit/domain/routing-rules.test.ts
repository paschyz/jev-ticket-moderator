import { describe, it, expect } from 'vitest';
import { decideRouting } from '../../../src/domain/routing-rules';
import { TicketModeration } from '../../../src/domain/ticket';

function buildModeration(
  overrides: Partial<TicketModeration> = {},
): TicketModeration {
  return {
    category: 'billing',
    categoryConfidence: 0.85,
    urgency: 'medium',
    abusiveProbability: 0.05,
    humanReviewProbability: 0.1,
    ...overrides,
  };
}

describe('decideRouting', () => {
  it('routes to category queue when all thresholds are met', () => {
    const decision = decideRouting(buildModeration());
    expect(decision).toEqual({ action: 'route', queue: 'billing' });
  });

  it('sends to manual review when classification confidence < 0.70', () => {
    const decision = decideRouting(
      buildModeration({ categoryConfidence: 0.65 }),
    );
    expect(decision).toEqual({
      action: 'manual_review',
      reason: 'Low classification confidence',
    });
  });

  it('sends to manual review when human review probability >= 0.60', () => {
    const decision = decideRouting(
      buildModeration({ humanReviewProbability: 0.65 }),
    );
    expect(decision).toEqual({
      action: 'manual_review',
      reason: 'High human review probability',
    });
  });

  it('checks confidence before human review probability', () => {
    const decision = decideRouting(
      buildModeration({ categoryConfidence: 0.5, humanReviewProbability: 0.8 }),
    );
    expect(decision).toEqual({
      action: 'manual_review',
      reason: 'Low classification confidence',
    });
  });

  it('routes to the correct category queue', () => {
    const decision = decideRouting(
      buildModeration({ category: 'technical' }),
    );
    expect(decision).toEqual({ action: 'route', queue: 'technical' });
  });

  it('treats exactly 0.70 confidence as sufficient', () => {
    const decision = decideRouting(
      buildModeration({ categoryConfidence: 0.7 }),
    );
    expect(decision).toEqual({ action: 'route', queue: 'billing' });
  });

  it('treats exactly 0.60 human review probability as manual review', () => {
    const decision = decideRouting(
      buildModeration({ humanReviewProbability: 0.6 }),
    );
    expect(decision).toEqual({
      action: 'manual_review',
      reason: 'High human review probability',
    });
  });

  it('sends abusive tickets to manual review regardless of confidence', () => {
    const decision = decideRouting(
      buildModeration({ category: 'abusive', categoryConfidence: 0.95, humanReviewProbability: 0.1 }),
    );
    expect(decision).toEqual({
      action: 'manual_review',
      reason: 'Abusive content detected',
    });
  });
});
