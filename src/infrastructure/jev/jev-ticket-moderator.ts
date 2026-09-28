import { OpenRouter } from '@openrouter/sdk';
import { Ticket, TicketModeration } from '../../domain/ticket';
import { TicketModerator } from '../../ports/ticket-moderator';

export interface JevConfig {
  apiKey: string;
  model?: string;
}

export class JevTicketModerator implements TicketModerator {
  private client: OpenRouter;
  private model: string;

  constructor(config: JevConfig) {
    this.client = new OpenRouter({ apiKey: config.apiKey });
    this.model = config.model ?? 'typesafe/jev-router';
  }

  async moderate(ticket: Ticket): Promise<TicketModeration> {
    const response = await this.client.chat.send({
      chatRequest: {
        model: this.model,
        tools: [
          {
            function: {
              name: 'classify_ticket',
              description:
                'Classify a support ticket into a category with confidence scores',
              parameters: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: [
                      'billing',
                      'technical',
                      'account',
                      'sales',
                      'other',
                    ],
                  },
                  categoryConfidence: {
                    type: 'number',
                    description: 'Confidence in classification (0-1)',
                  },
                  urgency: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                  },
                  abusiveProbability: {
                    type: 'number',
                    description: 'Probability of abusive content (0-1)',
                  },
                  humanReviewProbability: {
                    type: 'number',
                    description: 'Probability human review is needed (0-1)',
                  },
                },
                required: [
                  'category',
                  'categoryConfidence',
                  'urgency',
                  'abusiveProbability',
                  'humanReviewProbability',
                ],
              },
            },
            type: 'function' as const,
          },
        ],
        toolChoice: {
          function: { name: 'classify_ticket' },
          type: 'function' as const,
        },
        messages: [
          {
            role: 'system' as const,
            content:
              'You are a support ticket classifier. Classify tickets accurately with calibrated confidence scores.',
          },
          {
            role: 'user' as const,
            content: `Subject: ${ticket.subject}\nMessage: ${ticket.message}`,
          },
        ],
      },
    });

    if (!('choices' in response)) throw new Error('Unexpected response');
    const args =
      response.choices?.[0]?.message?.toolCalls?.[0]?.function?.arguments;
    if (!args) throw new Error('No classification in response');
    return JSON.parse(args) as TicketModeration;
  }
}
