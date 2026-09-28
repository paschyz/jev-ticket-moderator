import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import type { Moderation, Ticket } from '@/lib/types'

type Thresholds = typeof DEFAULT_THRESHOLDS

function statusVariant(status: string) {
  switch (status) {
    case 'routed': return 'default' as const
    case 'moderated': return 'secondary' as const
    case 'manual_review': return 'destructive' as const
    default: return 'outline' as const
  }
}

function urgencyVariant(urgency: string) {
  switch (urgency) {
    case 'critical': case 'high': return 'destructive' as const
    case 'medium': return 'secondary' as const
    default: return 'outline' as const
  }
}

function pct(v: number) { return Math.round(v * 100) }

function barColor(value: number, inverted: boolean) {
  const high = inverted ? value > 0.6 : value >= 0.7
  const low = inverted ? value < 0.3 : value < 0.4
  if (high) return inverted ? 'bg-destructive' : 'bg-emerald-600'
  if (low) return inverted ? 'bg-emerald-600' : 'bg-destructive'
  return 'bg-amber-500'
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

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a ticket to view details
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary animate-pulse">
          {loading}
        </div>
      )}

      {/* Ticket info */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <Badge variant={statusVariant(ticket.status)}>
            {ticket.status === 'manual_review' ? 'Needs review' : ticket.status}
          </Badge>
          {ticket.moderation?.urgency && (
            <Badge variant={urgencyVariant(ticket.moderation.urgency)}>
              {ticket.moderation.urgency}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-relaxed">{ticket.message}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {ticket.id} · {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Moderation scores */}
      {ticket.moderation && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <Badge variant="secondary" className="capitalize">{ticket.moderation.category}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                <Badge variant={urgencyVariant(ticket.moderation.urgency)} className="capitalize">
                  {ticket.moderation.urgency}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <ConfidenceBar
                label="Classification confidence"
                value={ticket.moderation.categoryConfidence}
                threshold={thresholds.categoryConfidence}
                tooltip="How confident the AI is about the category. Below threshold → manual review."
              />
              <ConfidenceBar
                label="Human review probability"
                value={ticket.moderation.humanReviewProbability}
                threshold={thresholds.humanReview}
                inverted
                tooltip="Estimated probability a human should review this. Above threshold → manual review."
              />
              <ConfidenceBar
                label="Abusive content probability"
                value={ticket.moderation.abusiveProbability}
                threshold={thresholds.abusive}
                inverted
                tooltip="Probability of abusive content. Above threshold → manual review."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routing decision */}
      {ticket.routing && (
        <Card className={
          ticket.routing.action === 'route'
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
        }>
          <CardHeader>
            <CardTitle>Routing Decision</CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.routing.action === 'route' ? (
              <p className="text-sm">
                Routed to <Badge className="capitalize">{ticket.routing.queue}</Badge> queue
              </p>
            ) : (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Sent to manual review: {ticket.routing.reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Override routing for manual_review */}
      {ticket.status === 'manual_review' && (
        <Card>
          <CardHeader>
            <CardTitle>Override Routing</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
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
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {ticket.status === 'open' && (
          <Button
            className="flex-1"
            variant="secondary"
            onClick={() => onModerate(ticket.id)}
            disabled={!!loading}
          >
            Analyze with Jev
          </Button>
        )}
        {ticket.status === 'moderated' && ticket.moderation && (
          <Button
            className="flex-1"
            onClick={() => onRoute(ticket.id, ticket.moderation!)}
            disabled={!!loading}
          >
            Route Ticket
          </Button>
        )}
        {/* ponytail: window.confirm for delete; upgrade to AlertDialog if ops team finds accidental deletes */}
        <Button
          variant="destructive"
          onClick={() => window.confirm('Delete this ticket?') && onDelete(ticket.id)}
          disabled={!!loading}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
