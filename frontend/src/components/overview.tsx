import { ShieldAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isAbusive } from '@/lib/ticket-variants'
import type { Ticket } from '@/lib/types'
import { cn } from 'cn'

const URGENCY = [
  { key: 'critical', label: 'Critical', bar: 'bg-destructive' },
  { key: 'high',     label: 'High',     bar: 'bg-destructive/60' },
  { key: 'medium',   label: 'Medium',   bar: 'bg-warning' },
  { key: 'low',      label: 'Low',      bar: 'bg-muted-foreground/40' },
]
const URGENCY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const QUEUES = ['account', 'billing', 'sales', 'technical', 'other', 'abusive']

function age(iso: string) {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border bg-card p-4', className)}>
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">{title}</h3>
      {children}
    </section>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-2xl font-medium tabular-nums mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}

export function Overview({ tickets, onOpen }: { tickets: Ticket[]; onOpen: (id: string) => void }) {
  if (tickets.length === 0) {
    return <p className="p-10 text-center text-sm text-muted-foreground">No tickets yet. Create one to see the overview.</p>
  }

  const analyzed = tickets.filter(t => t.moderation)
  const avgConfidence = analyzed.length
    ? Math.round((analyzed.reduce((n, t) => n + t.moderation!.categoryConfidence, 0) / analyzed.length) * 100)
    : null
  const waiting = tickets
    .filter(t => t.status === 'manual_review')
    .sort((a, b) =>
      (URGENCY_RANK[a.moderation?.urgency ?? 'low'] ?? 3) - (URGENCY_RANK[b.moderation?.urgency ?? 'low'] ?? 3)
      || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const oldest = waiting.reduce<Ticket | null>(
    (o, t) => (!o || new Date(t.createdAt) < new Date(o.createdAt) ? t : o), null)

  const urgencyCounts = URGENCY.map(u => ({ ...u, n: analyzed.filter(t => t.moderation!.urgency === u.key).length }))
  const queueCounts = QUEUES.map(q => ({
    q, n: tickets.filter(t => t.routing?.action === 'route' && t.routing.queue === q).length,
  })).filter(x => x.n > 0)
  const maxQueue = Math.max(1, ...queueCounts.map(x => x.n))

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total tickets" value={String(tickets.length)} />
        <Stat
          label="Analyzed"
          value={String(analyzed.length)}
          hint={`${Math.round((analyzed.length / tickets.length) * 100)}% of all tickets`}
        />
        <Stat label="Avg. classification confidence" value={avgConfidence === null ? '—' : `${avgConfidence}%`} />
        <Stat label="Oldest in review" value={oldest ? age(oldest.createdAt) : '—'} hint={oldest ? `${waiting.length} waiting` : 'Nothing waiting'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Urgency">
          {analyzed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No analyzed tickets yet.</p>
          ) : (
            <>
              <div className="flex h-2 gap-0.5" role="img" aria-label="Urgency distribution">
                {urgencyCounts.filter(u => u.n > 0).map(u => (
                  <Tooltip key={u.key}>
                    <TooltipTrigger asChild>
                      <div className={cn('rounded-full', u.bar)} style={{ flexGrow: u.n }} />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{u.label} · {u.n}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                {urgencyCounts.map(u => (
                  <li key={u.key} className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', u.bar)} />
                    {u.label}
                    <span className="ml-auto pr-6 font-mono text-xs tabular-nums text-muted-foreground">{u.n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Routed by queue">
          {queueCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing routed yet.</p>
          ) : (
            <ul className="space-y-3">
              {queueCounts.map(({ q, n }) => (
                <li key={q}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="capitalize">{q}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(n / maxQueue) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Waiting for a human">
        {waiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in manual review.</p>
        ) : (
          <ul className="-mx-2">
            {waiting.slice(0, 6).map(t => {
              const u = t.moderation?.urgency
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(t.id)}
                    className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left cursor-pointer transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      {isAbusive(t)
                        ? <span className="flex items-center gap-1.5 text-sm italic text-muted-foreground"><ShieldAlert className="w-3.5 h-3.5" />Content hidden</span>
                        : <p className="text-sm truncate">{t.message}</p>}
                      {t.routing?.action === 'manual_review' && (
                        <p className="text-xs text-muted-foreground truncate">{t.routing.reason}</p>
                      )}
                    </div>
                    {u && u !== 'low' && (
                      <span className={cn('text-xs capitalize', u === 'critical' || u === 'high' ? 'text-destructive' : 'text-warning')}>{u}</span>
                    )}
                    <span className="font-mono text-xs tabular-nums text-muted-foreground w-8 text-right">{age(t.createdAt)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
