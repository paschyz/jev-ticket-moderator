import { Ticket, TicketModeration } from '../../domain/ticket';
import { TicketModerator } from '../../ports/ticket-moderator';

export interface JevConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class JevTicketModerator implements TicketModerator {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: JevConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'anthropic/claude-haiku-4.5';
    this.baseUrl = config.baseUrl ?? 'https://openrouter.ai/api/v1';
  }

  async moderate(ticket: Ticket): Promise<TicketModeration> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        tools: [
          {
            type: 'function',
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
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'classify_ticket' },
        },
        messages: [
          {
            role: 'system',
            content:
              'You are a support ticket classifier. Classify tickets accurately with calibrated confidence scores.',
          },
          {
            role: 'user',
            content: `Subject: ${ticket.subject}\nMessage: ${ticket.message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Jev API error (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      choices?: {
        message?: {
          tool_calls?: { function?: { arguments?: string } }[];
        };
      }[];
    };

    const args =
      data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error('No classification in response');
    return JSON.parse(args) as TicketModeration;
  }
}
