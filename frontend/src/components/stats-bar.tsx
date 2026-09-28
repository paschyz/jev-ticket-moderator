import { cn } from 'cn'
import type { Ticket } from '@/lib/types'

export function StatsBar({
  tickets,
  onStatusFilter,
}: {
  tickets: Ticket[]
  onStatusFilter?: (status: string) => void
}) {
  const open = tickets.filter(t => t.status === 'open').length
  const moderated = tickets.filter(t => t.status === 'moderated').length
  const needsReview = tickets.filter(t => t.status === 'manual_review').length
  const routed = tickets.filter(t => t.status === 'routed').length

  return (
    <div className="flex items-center gap-4">
      <Chip label="Total" value={tickets.length} onClick={() => onStatusFilter?.('all')} />
      <Chip label="Open" value={open} onClick={() => onStatusFilter?.('open')} />
      <Chip label="Pending route" value={moderated} onClick={() => onStatusFilter?.('moderated')} />
      <Chip label="Needs review" value={needsReview} highlight={needsReview > 0} onClick={() => onStatusFilter?.('manual_review')} />
      <Chip label="Routed" value={routed} muted onClick={() => onStatusFilter?.('routed')} />
    </div>
  )
}

function Chip({ label, value, highlight, muted, onClick }: {
  label: string
  value: number
  highlight?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 text-xs tabular-nums transition-opacity',
        muted ? 'text-muted-foreground' : '',
        onClick ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'
      )}
    >
      <span className={cn('font-semibold text-sm', highlight ? 'text-destructive' : '')}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </button>
  )
}
