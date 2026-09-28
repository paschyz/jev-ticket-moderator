import { describe, it, expect } from 'vitest';
import { JevTicketModerator } from '../../src/infrastructure/jev/jev-ticket-moderator';

const apiKey = process.env.OPENROUTER_API_KEY;

describe.skipIf(!apiKey)('JevTicketModerator (integration)', () => {
  it(
    'classifies a ticket and returns valid moderation structure',
    async () => {
      const moderator = new JevTicketModerator({ apiKey: apiKey! });
      const moderation = await moderator.moderate({
        id: 'test-1',
        subject: 'Cannot download my invoice',
        message:
          'I need to download my invoice from last month but the page returns a 500 error',
        status: 'open',
        createdAt: new Date(),
      });

      expect([
        'billing',
        'technical',
        'account',
        'sales',
        'other',
      ]).toContain(moderation.category);
      expect(moderation.categoryConfidence).toBeGreaterThanOrEqual(0);
      expect(moderation.categoryConfidence).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(
        moderation.urgency,
      );
      expect(moderation.abusiveProbability).toBeGreaterThanOrEqual(0);
      expect(moderation.abusiveProbability).toBeLessThanOrEqual(1);
      expect(moderation.humanReviewProbability).toBeGreaterThanOrEqual(0);
      expect(moderation.humanReviewProbability).toBeLessThanOrEqual(1);
    },
    30000,
  );
});
