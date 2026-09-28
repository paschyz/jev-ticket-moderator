import { useCallback, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { QueueView } from '@/components/queue-view'
import { StatsBar } from '@/components/stats-bar'
import { TicketDetail } from '@/components/ticket-detail'
import { TicketList } from '@/components/ticket-list'
import { DEFAULT_FILTERS, type FilterState } from '@/hooks/useTicketFilters'
import { del, get, post } from '@/lib/api'
import { DEFAULT_THRESHOLDS } from '@/lib/constants'
import type { Moderation, Ticket } from '@/lib/types'

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

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
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading('')
    }
  }

  async function routeTicket(id: string, moderation: Moderation) {
    setError('')
    setLoading('Routing...')
    try {
      await post(`/tickets/${id}/route`, { moderation })
      await refreshTickets()
    } catch (e) {
      setError((e as Error).message)
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

  async function overrideRoute(id: string, queue: string) {
    const ticket = tickets.find(t => t.id === id)
    if (!ticket?.moderation) return
    // ponytail: synthetic payload forces routing via existing endpoint; add /override-route if audit trail needed
    const syntheticModeration: Moderation = {
      category: queue as Moderation['category'],
      categoryConfidence: 0.99,
      urgency: ticket.moderation.urgency,
      humanReviewProbability: 0.1,
      abusiveProbability: 0.1,
    }
    await routeTicket(id, syntheticModeration)
  }

  // Initial load
  useState(() => { refreshTickets().catch(() => {}) })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-semibold tracking-tight">TicketFlow</h1>
            <StatsBar
              tickets={tickets}
              onStatusFilter={status => setFilters(f => ({ ...f, status }))}
            />
          </div>
          <CreateTicketDialog onCreate={createTicket} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-1 gap-0 overflow-hidden">
        {/* Left panel */}
        <aside className="w-80 shrink-0 border-r flex flex-col overflow-hidden">
          <Tabs defaultValue="list" className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <TabsList className="w-full">
                <TabsTrigger value="list" className="flex-1">List</TabsTrigger>
                <TabsTrigger value="queues" className="flex-1">Queues</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="list" className="flex-1 overflow-hidden px-4 pb-4 mt-0">
              <TicketList
                tickets={tickets}
                selectedId={selectedId}
                onSelect={selectTicket}
                filters={filters}
                onFilterChange={partial => setFilters(f => ({ ...f, ...partial }))}
              />
            </TabsContent>
            <TabsContent value="queues" className="flex-1 overflow-hidden px-4 pb-4 mt-0">
              <QueueView
                tickets={tickets}
                selectedId={selectedId}
                onSelect={selectTicket}
              />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-y-auto p-6">
          <TicketDetail
            ticket={selectedTicket}
            thresholds={thresholds}
            onModerate={moderateTicket}
            onRoute={routeTicket}
            onOverrideRoute={overrideRoute}
            onDelete={deleteTicket}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  )
}
