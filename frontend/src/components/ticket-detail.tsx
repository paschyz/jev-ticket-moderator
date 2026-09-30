import { useState } from 'react'
import { Check, Info, Loader2, ShieldAlert, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import { isAbusive, urgencyVariant } from '@/lib/ticket-variants'
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
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px]">{label}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`About ${label}`} className="p-0.5 -m-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <span className="font-mono text-[13px] tabular-nums">{pct(value)}%</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full">
        <div className={cn('h-full rounded-full transition-[width] duration-300 ease-out', color)} style={{ width: `${pct(value)}%` }} />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute -top-1 h-3.5 w-0.5 bg-foreground/50 cursor-help rounded-full"
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

const STEPS = ['Received', 'Analyzed', 'Routed']

function Steps({ status }: { status: string }) {
  const at = status === 'open' ? 0 : status === 'routed' ? 2 : 1
  const review = status === 'manual_review'
  const current = review ? 'bg-destructive' : status === 'moderated' ? 'bg-warning' : 'bg-primary'
  return (
    <ol className="grid grid-cols-3 gap-1.5 max-w-xs">
      {STEPS.map((label, i) => (
        <li key={label}>
          <div className={cn(
            'h-1 rounded-full transition-colors duration-200 ease-out',
            i < at || at === 2 ? 'bg-success' : i === at ? current : 'bg-border',
          )} />
          <span className={cn('mt-1.5 block text-xs', i > at && 'text-muted-foreground/60', i === at && 'font-medium')}>
            {i === 1 && review ? 'Needs review' : label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      {children}
    </section>
  )
}

export function TicketDetail({
  ticket,
  showProgress,
  thresholds,
  onModerate,
  onRoute,
  onOverrideRoute,
  onDelete,
  loading,
  error,
}: {
  ticket: Ticket | null
  showProgress: boolean
  thresholds: Thresholds
  onModerate: (id: string) => Promise<void>
  onRoute: (id: string, moderation: Moderation) => Promise<boolean>
  onOverrideRoute: (id: string, queue: string) => Promise<boolean>
  onDelete: (id: string) => Promise<void>
  loading: string
  error: string
}) {
  const [overrideQueue, setOverrideQueue] = useState('')
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [routedTo, setRoutedTo] = useState<{ id: string; timer: number } | null>(null)

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full min-h-48 text-muted-foreground text-sm">
        Select a ticket to view details
      </div>
    )
  }

  const m = ticket.moderation
  const justRouted = routedTo?.id === ticket.id
  const hidden = isAbusive(ticket) && revealedId !== ticket.id
  const routing = loading === 'Routing...'

  function markRouted(id: string) {
    if (routedTo) clearTimeout(routedTo.timer)
    setOverrideQueue('')
    setRoutedTo({ id, timer: window.setTimeout(() => setRoutedTo(null), 2000) })
  }

  async function reroute(id: string) {
    if (await onOverrideRoute(id, overrideQueue)) markRouted(id)
  }

  async function route(id: string, moderation: Moderation) {
    if (await onRoute(id, moderation)) markRouted(id)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && (
        <div role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground animate-pulse">
          {loading}
        </div>
      )}

      <div>
        <div
          aria-hidden={!showProgress}
          className={cn('grid transition-[grid-template-rows] duration-200 ease-out', showProgress ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
        >
          <div className="overflow-hidden"><div className="pb-4"><Steps status={ticket.status} /></div></div>
        </div>
        {hidden ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2.5 text-sm">
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
              <span>Flagged as abusive. Content is hidden to protect you.</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRevealedId(ticket.id)}>Show content</Button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <p className="text-lg leading-snug tracking-tight text-pretty">{ticket.message}</p>
            {isAbusive(ticket) && (
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setRevealedId(null)}>Hide</Button>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.routing?.action === 'route' && (
              <Badge key={ticket.routing.queue} variant="success" className={cn('capitalize', justRouted && 'animate-in fade-in-0 zoom-in-95 duration-200')}>Routed · {ticket.routing.queue}</Badge>
            )}
            {m && <Badge variant="outline" className="capitalize">{m.category}</Badge>}
            {m && m.urgency !== 'low' && (
              <Badge variant={urgencyVariant(m.urgency)} className="capitalize">{m.urgency}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground tabular-nums">
            <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString()}</time>
            <span className="select-all rounded bg-muted px-1.5 py-0.5">{ticket.id}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => window.confirm('Delete this ticket?') && onDelete(ticket.id)}
                  disabled={!!loading}
                  aria-label="Delete ticket"
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {ticket.routing?.action === 'manual_review' && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <span className="font-medium text-warning">Why manual review: </span>
          {ticket.routing.reason}
        </div>
      )}

      {m && (
        <Section title="Jev signals">
          <div className="space-y-4">
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
        </Section>
      )}

      {(ticket.status === 'manual_review' || ticket.status === 'routed') && (
        <Section title={ticket.status === 'routed' ? 'Re-route' : 'Route manually'}>
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
                <SelectItem value="abusive">Abusive</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => reroute(ticket.id)}
              disabled={!overrideQueue || !!loading}
              className={cn('min-w-24 transition-colors', justRouted && 'bg-success text-success-foreground hover:bg-success disabled:opacity-100')}
            >
              <span key={routing ? 'busy' : justRouted ? 'done' : 'idle'} className="inline-flex items-center gap-1.5 animate-in fade-in-0 duration-150">
                {routing ? <><Loader2 className="animate-spin" />Routing</>
                  : justRouted ? <><Check />Routed</>
                  : ticket.status === 'routed' ? 'Re-route' : 'Route'}
              </span>
            </Button>
          </div>
        </Section>
      )}

      {ticket.status === 'open' && (
        <Button size="lg" className="w-full" onClick={() => onModerate(ticket.id)} disabled={!!loading}>
          Analyze with Jev
        </Button>
      )}
      {ticket.status === 'moderated' && ticket.moderation && (
        <Button size="lg" className="w-full" onClick={() => route(ticket.id, ticket.moderation!)} disabled={!!loading}>
          Route ticket
        </Button>
      )}
    </div>
  )
}
