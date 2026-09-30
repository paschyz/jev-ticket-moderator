import { useState } from 'react'
import { ArrowRightLeft, Check, ChevronRight, Flag, Info, Loader2, MoreHorizontal, ShieldAlert, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const URGENCIES = ['critical', 'high', 'medium', 'low']

const QUEUES = ['abusive', 'account', 'billing', 'sales', 'technical', 'other']

const STEPS = ['Received', 'Analyzed', 'Routed']

function Steps({ status }: { status: string }) {
  const at = status === 'open' ? 0 : status === 'routed' ? 2 : 1
  const review = status === 'manual_review'
  const current = review ? 'bg-destructive' : status === 'moderated' ? 'bg-warning' : 'bg-primary'
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1.5', i > at && 'text-muted-foreground/60', i === at && at < 2 && 'font-medium')}>
            {i < at || at === 2
              ? <Check className="w-3.5 h-3.5 text-success" />
              : <span className={cn('w-2 h-2 rounded-full', i === at ? current : 'ring-1 ring-inset ring-border')} />}
            {i === 1 && review ? 'Needs review' : label}
          </span>
          {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
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
  onChangeUrgency,
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
  onChangeUrgency: (id: string, urgency: string) => Promise<void>
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

  async function reroute(id: string, queue: string) {
    if (await onOverrideRoute(id, queue)) markRouted(id)
  }

  const currentQueue = ticket.routing?.action === 'route' ? ticket.routing.queue : null

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
        <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
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
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 -mt-1" aria-label="Ticket actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {m && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!!loading}><Flag />Priority</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {URGENCIES.map(u => (
                    <DropdownMenuItem key={u} className="capitalize justify-between" onSelect={() => u !== m.urgency && onChangeUrgency(ticket.id, u)}>
                      {u}
                      {u === m.urgency && <Check className="text-muted-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {ticket.status === 'routed' && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={!!loading}><ArrowRightLeft />Re-route</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {QUEUES.filter(q => q !== currentQueue).map(q => (
                      <DropdownMenuItem key={q} className="capitalize" onSelect={() => reroute(ticket.id, q)}>{q}</DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              destructive
              disabled={!!loading}
              onSelect={() => window.confirm('Delete this ticket?') && onDelete(ticket.id)}
            >
              <Trash2 />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.routing?.action === 'route' && (
              <Badge key={ticket.routing.queue} variant="success" className={cn('capitalize', justRouted && 'animate-in fade-in-0 zoom-in-95 duration-200')} title="Routed"><Check />{ticket.routing.queue}</Badge>
            )}
            {m && m.category !== currentQueue && <Badge variant="outline" className="capitalize">{m.category}</Badge>}
            {m && m.urgency !== 'low' && (
              <Badge variant={urgencyVariant(m.urgency)} className="capitalize">{m.urgency}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground tabular-nums">
            <time dateTime={ticket.createdAt}>{new Date(ticket.createdAt).toLocaleString()}</time>
            <span className="select-all rounded bg-muted px-1.5 py-0.5">{ticket.id}</span>
          </div>
          <div
            aria-hidden={!showProgress}
            className={cn(
              'absolute inset-x-0 top-4 bottom-0 flex items-center bg-background transition-opacity duration-200 ease-out',
              showProgress ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <Steps status={ticket.status} />
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

      {ticket.status === 'manual_review' && (
        <Section title="Route manually">
          <div className="flex gap-2">
            <Select value={overrideQueue} onValueChange={setOverrideQueue}>
              <SelectTrigger className="flex-1 h-8 text-sm">
                <SelectValue placeholder="Route to queue..." />
              </SelectTrigger>
              <SelectContent>
                {QUEUES.map(q => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={() => reroute(ticket.id, overrideQueue)}
              disabled={!overrideQueue || !!loading}
              className="min-w-24"
            >
              <span key={routing ? 'busy' : 'idle'} className="inline-flex items-center gap-1.5 animate-in fade-in-0 duration-150">
                {routing ? <><Loader2 className="animate-spin" />Routing</> : 'Route'}
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
