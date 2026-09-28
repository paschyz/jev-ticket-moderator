import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { TicketHistory } from '@/components/ticket-history'
import { get, post } from '@/lib/api'
import type { Moderation, RoutingDecision, Ticket } from '@/lib/types'

function urgencyVariant(urgency: string) {
  switch (urgency) {
    case 'critical': return 'destructive' as const
    case 'high': return 'destructive' as const
    case 'medium': return 'secondary' as const
    default: return 'outline' as const
  }
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-emerald-600' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
      </div>
    </div>
  )
}

export default function App() {
  const [message, setMessage] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [moderation, setModeration] = useState<Moderation | null>(null)
  const [routing, setRouting] = useState<RoutingDecision | null>(null)
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refreshTickets = useCallback(() => {
    get<Ticket[]>('/tickets').then(setTickets).catch(() => {})
  }, [])

  async function createTicket() {
    setError('')
    setLoading('Creating ticket...')
    try {
      const t = await post<Ticket>('/tickets', { message })
      setTicket(t)
      setModeration(null)
      setRouting(null)
      setSelectedId(t.id)
      refreshTickets()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function moderateTicket() {
    if (!ticket) return
    setError('')
    setLoading('Jev is analyzing...')
    try {
      const m = await post<Moderation>(`/tickets/${ticket.id}/moderate`)
      setModeration(m)
      setRouting(null)
      refreshTickets()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function routeTicket() {
    if (!ticket || !moderation) return
    setError('')
    setLoading('Routing...')
    try {
      const r = await post<RoutingDecision>(`/tickets/${ticket.id}/route`, { moderation })
      setRouting(r)
      refreshTickets()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  function reset() {
    setTicket(null)
    setModeration(null)
    setRouting(null)
    setMessage('')
    setError('')
    setSelectedId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight">TicketFlow</h1>
          <span className="text-xs text-muted-foreground">Powered by Jev</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 p-6">
        {/* Sidebar: history */}
        <aside className="w-full md:w-72 md:shrink-0">
          <TicketHistory
            tickets={tickets}
            setTickets={setTickets}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        {/* Main: wizard */}
        <main className="flex-1 space-y-4">
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

          {/* Step 1: Create */}
          {!ticket && (
            <Card>
              <CardHeader>
                <CardTitle>New Support Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={createTicket}
                  disabled={!message.trim() || !!loading}
                >
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Ticket detail */}
          {ticket && (
            <Card>
              <CardHeader className="flex-row items-start justify-between">
                <Badge variant="outline">{ticket.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{ticket.message}</p>
                <p className="text-xs text-muted-foreground tabular-nums">ID: {ticket.id}</p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Moderate */}
          {ticket && !moderation && (
            <Button
              className="w-full"
              variant="secondary"
              size="lg"
              onClick={moderateTicket}
              disabled={!!loading}
            >
              Analyze with Jev
            </Button>
          )}

          {/* Moderation results */}
          {moderation && (
            <Card>
              <CardHeader>
                <CardTitle>Moderation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <Badge variant="secondary">{moderation.category}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                    <Badge variant={urgencyVariant(moderation.urgency)}>{moderation.urgency}</Badge>
                  </div>
                  <ConfidenceBar label="Classification Confidence" value={moderation.categoryConfidence} />
                  <ConfidenceBar label="Human Review Probability" value={moderation.humanReviewProbability} />
                  <div className="col-span-2">
                    <ConfidenceBar label="Abusive Content Probability" value={moderation.abusiveProbability} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Route */}
          {moderation && !routing && (
            <Button
              className="w-full"
              size="lg"
              onClick={routeTicket}
              disabled={!!loading}
            >
              Route Ticket
            </Button>
          )}

          {/* Routing result */}
          {routing && (
            <Card className={
              routing.action === 'route'
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
            }>
              <CardHeader>
                <CardTitle>Routing Decision</CardTitle>
              </CardHeader>
              <CardContent>
                {routing.action === 'route' ? (
                  <p className="text-sm">
                    Routed to <Badge>{routing.queue}</Badge> queue
                  </p>
                ) : (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Sent to manual review: {routing.reason}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reset */}
          {routing && (
            <Button variant="outline" className="w-full" onClick={reset}>
              New Ticket
            </Button>
          )}
        </main>
      </div>
    </div>
  )
}
