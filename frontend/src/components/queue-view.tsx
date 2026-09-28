import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ticket } from '@/lib/types'

type QueueBucket = {
  key: string
  label: string
  tickets: Ticket[]
  variant: 'destructive' | 'warning' | 'success' | 'secondary' | 'outline' | 'default'
}

function bucketTickets(tickets: Ticket[]): QueueBucket[] {
  const buckets: Record<string, Ticket[]> = {
    manual_review: [],
    open: [],
    moderated: [],
    billing: [],
    technical: [],
    account: [],
    sales: [],
    other: [],
  }

  for (const t of tickets) {
    if (t.status === 'manual_review') { buckets.manual_review.push(t); continue }
    if (t.status === 'open') { buckets.open.push(t); continue }
    if (t.status === 'moderated') { buckets.moderated.push(t); continue }
    if (t.routing?.action === 'route') { buckets[t.routing.queue]?.push(t); continue }
  }

  const QUEUE_META: QueueBucket[] = [
    { key: 'manual_review', label: 'Needs Review', variant: 'destructive', tickets: [] },
    { key: 'open', label: 'Open (unanalyzed)', variant: 'outline', tickets: [] },
    { key: 'moderated', label: 'Awaiting routing', variant: 'warning', tickets: [] },
    { key: 'billing', label: 'Billing', variant: 'success', tickets: [] },
    { key: 'technical', label: 'Technical', variant: 'success', tickets: [] },
    { key: 'account', label: 'Account', variant: 'success', tickets: [] },
    { key: 'sales', label: 'Sales', variant: 'success', tickets: [] },
    { key: 'other', label: 'Other', variant: 'success', tickets: [] },
  ]

  return QUEUE_META
    .map(q => ({ ...q, tickets: buckets[q.key] ?? [] }))
    .filter(q => q.tickets.length > 0)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function QueueView({
  tickets,
  selectedId,
  onSelect,
}: {
  tickets: Ticket[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const queues = bucketTickets(tickets)

  if (queues.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tickets yet</p>
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-2">
      {queues.map(queue => (
        <div key={queue.key}>
          <div className="flex items-center gap-2 mb-2 px-0.5">
            <Badge variant={queue.variant} className="text-xs">{queue.label}</Badge>
            <span className="text-xs text-muted-foreground">{queue.tickets.length}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {queue.tickets.map(ticket => (
              <Card
                key={ticket.id}
                size="sm"
                className={`cursor-pointer transition-colors ${
                  selectedId === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelect(ticket.id)}
              >
                <CardHeader>
                  <CardTitle className="truncate text-xs leading-snug">{ticket.message}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {ticket.moderation?.urgency && (
                    <span className="text-xs text-muted-foreground capitalize">{ticket.moderation.urgency}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{formatTime(ticket.createdAt)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
