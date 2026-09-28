import { Ticket, TicketCategory, TicketModeration } from '../../domain/ticket';
import { TicketModerator } from '../../ports/ticket-moderator';

export class FakeTicketModerator implements TicketModerator {
  async moderate(ticket: Ticket): Promise<TicketModeration> {
    const seed = this.hash(ticket.id);
    const rng = this.seededRandom(seed);
    const text = `${ticket.subject} ${ticket.message}`.toLowerCase();

    const category = this.analyzeCategory(text);
    const categoryConfidence = this.analyzeConfidence(text, category, rng);
    const urgency = this.analyzeUrgency(text);
    const abusiveProbability = this.analyzeAbusive(text, rng);
    const humanReviewProbability = this.analyzeHumanReview(text, categoryConfidence, rng);

    return { category, categoryConfidence, urgency, abusiveProbability, humanReviewProbability };
  }

  private analyzeCategory(text: string): TicketCategory {
    const scores: Record<TicketCategory, number> = { billing: 0, technical: 0, account: 0, sales: 0, other: 0 };

    const keywords: Record<TicketCategory, string[]> = {
      billing: ['billing', 'invoice', 'charge', 'payment', 'refund', 'subscription', 'pricing', 'price', 'cost', 'fee'],
      technical: ['api', 'error', 'bug', 'crash', 'server', 'fail', 'timeout', 'connection', 'login', 'production', '500', '404', 'exception', 'stack trace'],
      account: ['account', 'password', 'username', 'profile', 'email', 'register', 'signup', 'access', 'permission'],
      sales: ['purchase', 'buy', 'upgrade', 'trial', 'demo', 'discount', 'offer'],
      other: [],
    };

    for (const [cat, words] of Object.entries(keywords) as [TicketCategory, string[]][]) {
      for (const w of words) if (text.includes(w)) scores[cat] += 1;
    }

    const best = (Object.entries(scores) as [TicketCategory, number][]).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
    );

    return best[1] > 0 ? best[0] : 'other';
  }

  private analyzeConfidence(text: string, category: TicketCategory, rng: () => number): number {
    // ponytail: simple linear rng, deterministic per ticket.id
    if (category === 'other') return clamp(0.3 + rng() * 0.3);
    return clamp(0.65 + rng() * 0.3);
  }

  private analyzeUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
    if (/urgent|critical|asap|immediately|production.{0,5}down|service.{0,5}down|cannot process/i.test(text)) return 'high';
    if (/important|soon|priority|broken|failing/i.test(text)) return 'medium';
    return 'low';
  }

  private analyzeAbusive(text: string, rng: () => number): number {
    const abusiveWords = ['stupid', 'scam', 'defraud', 'fraud', 'cheat', 'idiot', 'terrible', 'awful', 'worst'];
    const count = abusiveWords.filter(w => text.includes(w)).length;
    if (count >= 2) return clamp(0.6 + rng() * 0.3);
    if (count === 1) return clamp(0.5 + rng() * 0.2);
    return clamp(rng() * 0.2);
  }

  private analyzeHumanReview(text: string, confidence: number, rng: () => number): number {
    const complexPhrases = ['not sure', 'unsure', 'maybe', 'sometimes', 'different', 'unclear', 'confused'];
    const isComplex = complexPhrases.some(w => text.includes(w));
    if (isComplex) return clamp(0.55 + rng() * 0.3);
    if (confidence < 0.6) return clamp(0.4 + rng() * 0.3);
    return clamp(rng() * 0.3);
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
