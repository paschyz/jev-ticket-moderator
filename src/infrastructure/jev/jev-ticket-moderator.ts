import { OpenRouter } from '@openrouter/sdk';
import {
  Ticket,
  TicketCategory,
  TicketModeration,
} from '../../domain/ticket.js';
import { TicketModerator } from '../../ports/ticket-moderator.js';

export interface JevConfig {
  apiKey: string;
  model?: string;
}

export class JevTicketModerator implements TicketModerator {
  private client: OpenRouter;
  private model: string;

  constructor(config: JevConfig) {
    this.client = new OpenRouter({ apiKey: config.apiKey });
    this.model = config.model ?? 'typesafe/jev-latest';
  }

  async moderate(ticket: Ticket): Promise<TicketModeration> {
    const noul = (instructions: string, yes: string, no: string) => ({
      type: 'noul' as const,
      instructions,
      criteria: { true: yes, false: no },
    });

    const response = await this.client.alpha.decisions.create({
      decisionsRequest: {
        model: this.model,
        state: ticket.message,
        questions: {
          category: {
            type: 'choice' as const,
            instructions: 'Classify this support ticket into the best category.',
            criteria: {
              billing: 'Payment, invoices, charges, subscriptions, refunds',
              technical: 'Bugs, errors, technical issues, integrations',
              account: 'Login, access, permissions, profile, settings',
              sales: 'Pricing, plans, demos, enterprise inquiries',
              abusive: 'Threats, harassment, profanity, spam, or clearly inappropriate content',
              other: 'Anything that does not fit the above categories',
            },
          },
          urgency: {
            type: 'choice' as const,
            instructions: 'Assess the urgency level of this ticket.',
            criteria: {
              low: 'General inquiry, no time pressure',
              medium: 'Needs attention but not blocking',
              high: 'Blocking issue, needs prompt resolution',
              critical: 'Service down, data loss, or security incident',
            },
          },
          abusive: noul(
            'Does this ticket contain abusive or inappropriate content?',
            'Profanity, insults, threats, harassment, or spam.',
            'Polite, neutral, or simply frustrated but respectful.',
          ),
          humanReview: noul(
            'Does this need a person, not an automated response?',
            'Account-specific, urgent, emotional, or needs a manual action.',
            'A routine request that automation can handle.',
          ),
        },
      },
    });

    const categoryAnswer = response.answers['category'];
    const urgencyAnswer = response.answers['urgency'];
    const abusiveAnswer = response.answers['abusive'];
    const humanReviewAnswer = response.answers['humanReview'];

    if (categoryAnswer.type !== 'choice' || urgencyAnswer.type !== 'choice')
      throw new Error('Unexpected answer type');
    if (abusiveAnswer.type !== 'noul' || humanReviewAnswer.type !== 'noul')
      throw new Error('Unexpected answer type');

    return {
      category: categoryAnswer.choice as TicketCategory,
      categoryConfidence: categoryAnswer.confidence ?? 0.5,
      urgency: urgencyAnswer.choice as TicketModeration['urgency'],
      abusiveProbability: abusiveAnswer.noul,
      humanReviewProbability: humanReviewAnswer.noul,
    };
  }
}
