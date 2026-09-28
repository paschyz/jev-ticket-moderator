import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import { statusLabel, statusVariant } from '@/lib/ticket-variants'
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
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="p-0.5 -m-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{pct(value)}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-visible">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct(value)}%` }} />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute top-[-4px] h-4 w-1 bg-foreground/40 cursor-help rounded-full"
              style={{ left: `${threshold * 100}%` }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Threshold: {pct(threshold)}%
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
    <div className="max-w-2xl space-y-5">
      {/* Error / loading */}
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground animate-pulse">
          {loading}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.routing?.action === 'route' ? (
              <Badge variant="success" className="capitalize">
                {ticket.routing.queue}
              </Badge>
            ) : (
              <Badge variant={statusVariant(ticket.status)}>
                {statusLabel(ticket.status)}
              </Badge>
            )}
            {(m?.urgency === 'critical' || m?.urgency === 'high') && (
              <Badge variant="destructive" className="capitalize">
                {m.urgency}
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => window.confirm('Delete this ticket?') && onDelete(ticket.id)}
                disabled={!!loading}
                aria-label="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm leading-relaxed">{ticket.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <p className="text-[11px] text-muted-foreground/50 tabular-nums font-mono mt-0.5">
          {ticket.id}
        </p>
      </div>

      {/* AI analysis */}
      {m && (
        <div className="border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setScoresOpen(v => !v)}
            className={cn(
              'flex items-center justify-between gap-2 w-full text-left rounded-sm cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
          >
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <Badge variant="outline" className="capitalize">{m.category}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {pct(m.categoryConfidence)}% confident
              </span>
            </div>
            {scoresOpen
              ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            }
          </button>
          {scoresOpen && (
            <div className="space-y-3 mt-4">
              <ConfidenceBar
                label="Classification confidence"
                value={m.categoryConfidence}
                threshold={thresholds.categoryConfidence}
                tooltip="How confident the AI is about the category. Below threshold triggers manual review."
              />
              <ConfidenceBar
                label="Human review probability"
                value={m.humanReviewProbability}
                threshold={thresholds.humanReview}
                inverted
                tooltip="Estimated probability a human should review this. Above threshold triggers manual review."
              />
              <ConfidenceBar
                label="Abusive content probability"
                value={m.abusiveProbability}
                threshold={thresholds.abusive}
                inverted
                tooltip="Probability of abusive content. Above threshold triggers manual review."
              />
            </div>
          )}
        </div>
      )}

      {/* Routing: manual review reason + override */}
      {ticket.routing?.action !== 'route' && (ticket.routing || ticket.status === 'manual_review') && (
        <div className={cn(
          'border-t border-border pt-5',
          ticket.routing && 'border-l-2 pl-4 ml-0 border-l-warning',
        )}>
          {ticket.routing && (
            <p className="text-sm text-warning mb-3">
              {ticket.routing.reason}
            </p>
          )}
          {ticket.status === 'manual_review' && (
            <div className="flex gap-2">
              <Select value={overrideQueue} onValueChange={setOverrideQueue}>
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue placeholder="Route to queue..." />
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
                size="sm"
                onClick={() => onOverrideRoute(ticket.id, overrideQueue)}
                disabled={!overrideQueue || !!loading}
              >
                Route
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Primary action */}
      {ticket.status === 'open' && (
        <div className="border-t border-border pt-5">
          <Button
            className="w-full"
            onClick={() => onModerate(ticket.id)}
            disabled={!!loading}
          >
            Analyze with Jev
          </Button>
        </div>
      )}
      {ticket.status === 'moderated' && ticket.moderation && (
        <div className="border-t border-border pt-5">
          <Button
            className="w-full"
            onClick={() => onRoute(ticket.id, ticket.moderation!)}
            disabled={!!loading}
          >
            Route ticket
          </Button>
        </div>
      )}
    </div>
  )
}
