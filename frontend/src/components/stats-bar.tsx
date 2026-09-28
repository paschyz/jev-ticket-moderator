import type { Ticket } from '@/lib/types'

export function StatsBar({ tickets }: { tickets: Ticket[] }) {
  const open = tickets.filter(t => t.status === 'open').length
  const moderated = tickets.filter(t => t.status === 'moderated').length
  const needsReview = tickets.filter(t => t.status === 'manual_review').length
  const routed = tickets.filter(t => t.status === 'routed').length

  return (
    <div className="flex items-center gap-4">
      <Chip label="Total" value={tickets.length} />
      <Chip label="Open" value={open} />
      <Chip label="Pending route" value={moderated} />
      <Chip label="Needs review" value={needsReview} highlight={needsReview > 0} />
      <Chip label="Routed" value={routed} muted />
    </div>
  )
}

function Chip({ label, value, highlight, muted }: { label: string; value: number; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs tabular-nums ${muted ? 'text-muted-foreground' : ''}`}>
      <span className={`font-semibold text-sm ${highlight ? 'text-destructive' : ''}`}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
