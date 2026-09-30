import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import type { Ticket } from '@/lib/types'

export function urgencyVariant(urgency: string) {
  switch (urgency) {
    case 'critical': case 'high': return 'destructive' as const
    case 'medium': return 'warning' as const
    default: return 'outline' as const
  }
}

export function isAbusive(t: Ticket) {
  return (
    t.moderation?.category === 'abusive' ||
    (t.moderation?.abusiveProbability ?? 0) >= DEFAULT_THRESHOLDS.abusive ||
    (t.routing?.action === 'route' && t.routing.queue === 'abusive')
  )
}
