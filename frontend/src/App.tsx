import { useCallback, useRef, useState } from 'react'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { TicketDetail } from '@/components/ticket-detail'
import { TicketList } from '@/components/ticket-list'
import { DEFAULT_FILTERS, type FilterState } from '@/hooks/useTicketFilters'
import { del, get, patch, post } from '@/lib/api'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import type { Moderation, Ticket } from '@/lib/types'

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [flashId, setFlashId] = useState<string | null>(null)
  const flashTimer = useRef(0)

  // briefly reveal the progress tracker after any workflow step
  function flash(id: string) {
    clearTimeout(flashTimer.current)
    setFlashId(id)
    flashTimer.current = window.setTimeout(() => setFlashId(null), 2500)
  }

  const thresholds = DEFAULT_THRESHOLDS

  const refreshTickets = useCallback(async (): Promise<Ticket[]> => {
    const fresh = await get<Ticket[]>('/tickets')
    setTickets(fresh)
    return fresh
  }, [])

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null

  function selectTicket(id: string) {
    setSelectedId(id)
    setError('')
  }

  async function createTicket(message: string) {
    setError('')
    try {
      const t = await post<Ticket>('/tickets', { message })
      const fresh = await refreshTickets()
      setSelectedId(fresh.find(x => x.id === t.id)?.id ?? t.id)
      flash(t.id)
    } catch (e) {
      setError((e as Error).message)
      throw e
    }
  }

  async function moderateTicket(id: string) {
    setError('')
    setLoading('Jev is analyzing...')
    try {
      await post<Moderation>(`/tickets/${id}/moderate`)
      const fresh = await refreshTickets()
      setSelectedId(fresh.find(t => t.id === id)?.id ?? id)
      flash(id)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function routeTicket(id: string, moderation: Moderation): Promise<boolean> {
    setError('')
    setLoading('Routing...')
    try {
      await post(`/tickets/${id}/route`, { moderation })
      await refreshTickets()
      flash(id)
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setLoading('')
    }
  }

  async function deleteTicket(id: string) {
    setError('')
    setLoading('Deleting...')
    try {
      await del(`/tickets/${id}`)
      setSelectedId(null)
      await refreshTickets()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function changeUrgency(id: string, urgency: string) {
    setError('')
    setLoading('Updating priority...')
    try {
      await patch(`/tickets/${id}/urgency`, { urgency })
      await refreshTickets()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function overrideRoute(id: string, queue: string): Promise<boolean> {
    setLoading('Routing...')
    setError('')
    try {
      await post(`/tickets/${id}/override-route`, { queue })
      await refreshTickets()
      flash(id)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Override route failed')
      return false
    } finally {
      setLoading('')
    }
  }

  // Initial load
  useState(() => { refreshTickets().catch(() => {}) })

  const stats = [
    { label: 'Needs review', n: tickets.filter(t => t.status === 'manual_review').length, tone: 'text-destructive' },
    { label: 'Unanalyzed',   n: tickets.filter(t => t.status === 'open').length,          tone: 'text-foreground' },
    { label: 'Awaiting route', n: tickets.filter(t => t.status === 'moderated').length,   tone: 'text-warning' },
    { label: 'Routed',       n: tickets.filter(t => t.status === 'routed').length,        tone: 'text-success' },
  ]

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-5 h-14 shrink-0 flex items-center gap-6">
        <h1 className="text-[15px] font-semibold tracking-tight">TicketFlow</h1>
        <dl className="hidden md:flex items-center gap-6 flex-1">
          {stats.map(s => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <dd className={`font-mono text-sm font-medium tabular-nums ${s.tone}`}>{s.n}</dd>
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
        <div className="ml-auto"><CreateTicketDialog onCreate={createTicket} /></div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside className="md:w-90 shrink-0 border-b md:border-b-0 md:border-r flex flex-col min-h-0 max-h-[45vh] md:max-h-none">
          <TicketList
            tickets={tickets}
            selectedId={selectedId}
            onSelect={selectTicket}
            filters={filters}
            onFilterChange={partial => setFilters(f => ({ ...f, ...partial }))}
          />
        </aside>

        <main className="flex-1 overflow-y-auto min-h-0">
          <TicketDetail
            ticket={selectedTicket}
            showProgress={!!selectedTicket && selectedTicket.id === flashId}
            thresholds={thresholds}
            onModerate={moderateTicket}
            onRoute={routeTicket}
            onOverrideRoute={overrideRoute}
            onChangeUrgency={changeUrgency}
            onDelete={deleteTicket}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  )
}
