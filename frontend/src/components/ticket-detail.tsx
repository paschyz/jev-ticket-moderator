import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import { statusLabel, statusVariant, urgencyVariant } from '@/lib/ticket-variants'
import type { Moderation, Ticket } from '@/lib/types'
import { cn } from 'cn'

type Thresholds = typeof DEFAULT_THRESHOLDS

function pct(v: number) { return Math.round(v * 100) }

function barColor(value: number, inverted: boolean) {
  const high = inverted ? value > 0.6 : value >= 0.7
  const low = inverted ? value < 0.3 : value < 0.4
  if (high) return inverted ? 'bg-destructive' : 'bg-success'
  if (low) return inverted ? 'bg-success' : 'bg-destructive'
  return 'bg-warning'
}

function ConfidenceBar({
  label, value, threshold, inverted = false, tooltip,
}: {
  label: string; value: number; threshold: number; inverted?: boolean; tooltip: string
}) {
  const color = barColor(value, inverted)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground cursor-help underline decoration-dashed underline-offset-2">{label}</p>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">{tooltip}</TooltipContent>
        </Tooltip>
        <span className="text-xs tabular-nums text-muted-foreground">{pct(value)}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-visible">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct(value)}%` }} />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute top-[-3px] h-[14px] w-0.5 bg-foreground/50 cursor-help rounded-full"
              style={{ left: `${threshold * 100}%` }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Routing threshold: {pct(threshold)}%
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export function TicketDetail({
  ticket,
  thresholds,
  onModerate,
  onRoute,
  onOverrideRoute,
  onDelete,
  loading,
  error,
}: {
  ticket: Ticket | null
  thresholds: Thresholds
  onModerate: (id: string) => Promise<void>
  onRoute: (id: string, moderation: Moderation) => Promise<void>
  onOverrideRoute: (id: string, queue: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: string
  error: string
}) {
  const [overrideQueue, setOverrideQueue] = useState('')
  const [scoresOpen, setScoresOpen] = useState(false)

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a ticket to view details
      </div>
    )
  }

  const m = ticket.moderation

  return (
    <div className="divide-y divide-border max-w-2xl">
      {/* Status messages */}
      {(error || loading) && (
        <div className="pb-4 space-y-2">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground animate-pulse">
              {loading}
            </div>
          )}
        </div>
      )}

      {/* Header: status + urgency + delete */}
      <div className="pb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(ticket.status)}>
              {statusLabel(ticket.status)}
            </Badge>
            {m?.urgency && (
              <Badge variant={urgencyVariant(m.urgency)} className="capitalize">
                {m.urgency}
              </Badge>
            )}
          </div>
          {/* ponytail: window.confirm for delete; upgrade to AlertDialog if ops team finds accidental deletes */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive shrink-0 -mt-0.5"
            onClick={() => window.confirm('Delete this ticket?') && onDelete(ticket.id)}
            disabled={!!loading}
          >
            Delete
          </Button>
        </div>
        <p className="text-base leading-relaxed">{ticket.message}</p>
        <p className="text-xs text-muted-foreground tabular-nums mt-2">
          {ticket.id} · {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      {/* AI analysis */}
      {m && (
        <div className="py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-muted-foreground text-xs font-medium tracking-wide">AI</span>
              <Badge variant="outline" className="capitalize">{m.category}</Badge>
              <Badge variant={urgencyVariant(m.urgency)} className="capitalize">{m.urgency}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {pct(m.categoryConfidence)}% confident
              </span>
            </div>
            <button
              type="button"
              onClick={() => setScoresOpen(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {scoresOpen ? 'Hide scores' : 'Show scores'}
            </button>
          </div>
          {scoresOpen && (
            <div className="space-y-3 mt-4">
              <ConfidenceBar
                label="Classification confidence"
                value={m.categoryConfidence}
                threshold={thresholds.categoryConfidence}
                tooltip="How confident the AI is about the category. Below threshold → manual review."
              />
              <ConfidenceBar
                label="Human review probability"
                value={m.humanReviewProbability}
                threshold={thresholds.humanReview}
                inverted
                tooltip="Estimated probability a human should review this. Above threshold → manual review."
              />
              <ConfidenceBar
                label="Abusive content probability"
                value={m.abusiveProbability}
                threshold={thresholds.abusive}
                inverted
                tooltip="Probability of abusive content. Above threshold → manual review."
              />
            </div>
          )}
        </div>
      )}

      {/* Routing result */}
      {ticket.routing && (
        <div className={cn(
          'py-5 border-l-2 pl-4 -ml-4',
          ticket.routing.action === 'route' ? 'border-l-success' : 'border-l-warning'
        )}>
          {ticket.routing.action === 'route' ? (
            <p className="text-sm">
              Routed to <span className="font-medium capitalize">{ticket.routing.queue}</span> queue
            </p>
          ) : (
            <p className="text-sm text-warning">
              Manual review: {ticket.routing.reason}
            </p>
          )}
        </div>
      )}

      {/* Override routing for manual_review */}
      {ticket.status === 'manual_review' && (
        <div className="py-5">
          <p className="text-xs text-muted-foreground mb-2">Route to queue manually</p>
          <div className="flex gap-2">
            <Select value={overrideQueue} onValueChange={setOverrideQueue}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select queue..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={() => onOverrideRoute(ticket.id, overrideQueue)}
              disabled={!overrideQueue || !!loading}
            >
              Route
            </Button>
          </div>
        </div>
      )}

      {/* Primary actions */}
      {(ticket.status === 'open' || ticket.status === 'moderated') && (
        <div className="pt-5">
          {ticket.status === 'open' && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => onModerate(ticket.id)}
              disabled={!!loading}
            >
              Analyze with Jev
            </Button>
          )}
          {ticket.status === 'moderated' && ticket.moderation && (
            <Button
              className="w-full"
              onClick={() => onRoute(ticket.id, ticket.moderation!)}
              disabled={!!loading}
            >
              Route ticket
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
