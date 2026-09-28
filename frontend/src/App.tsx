import { useState } from 'react'

type Ticket = {
  id: string
  subject: string
  message: string
  status: string
  createdAt: string
}

type Moderation = {
  category: string
  categoryConfidence: number
  urgency: string
  abusiveProbability: number
  humanReviewProbability: number
}

type RoutingDecision =
  | { action: 'route'; queue: string }
  | { action: 'manual_review'; reason: string }

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {children}
    </span>
  )
}

function urgencyColor(urgency: string) {
  switch (urgency) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-green-100 text-green-800'
  }
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-600 w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function App() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [moderation, setModeration] = useState<Moderation | null>(null)
  const [routing, setRouting] = useState<RoutingDecision | null>(null)
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  async function createTicket() {
    setError('')
    setLoading('Creating ticket...')
    try {
      const t = await api<Ticket>('/tickets', { subject, message })
      setTicket(t)
      setModeration(null)
      setRouting(null)
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
      const m = await api<Moderation>(`/tickets/${ticket.id}/moderate`)
      setModeration(m)
      setRouting(null)
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
      const r = await api<RoutingDecision>(`/tickets/${ticket.id}/route`, { moderation })
      setRouting(r)
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
    setSubject('')
    setMessage('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Ticket Moderator</h1>
          <span className="text-xs text-gray-400">Powered by Jev</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm animate-pulse">
            {loading}
          </div>
        )}

        {/* Step 1: Create */}
        {!ticket && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">New Support Ticket</h2>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Describe your issue..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={createTicket}
              disabled={!subject.trim() || !message.trim() || !!loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Ticket
            </button>
          </div>
        )}

        {/* Ticket created */}
        {ticket && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-medium text-gray-900">{ticket.subject}</h2>
              <Badge color="bg-gray-100 text-gray-700">{ticket.status}</Badge>
            </div>
            <p className="text-sm text-gray-600">{ticket.message}</p>
            <p className="text-xs text-gray-400">ID: {ticket.id}</p>
          </div>
        )}

        {/* Step 2: Moderate */}
        {ticket && !moderation && (
          <button
            onClick={moderateTicket}
            disabled={!!loading}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze with Jev
          </button>
        )}

        {/* Moderation results */}
        {moderation && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Moderation Result</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <Badge color="bg-blue-100 text-blue-800">{moderation.category}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Urgency</p>
                <Badge color={urgencyColor(moderation.urgency)}>{moderation.urgency}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Classification Confidence</p>
                <ConfidenceBar value={moderation.categoryConfidence} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Human Review Probability</p>
                <ConfidenceBar value={moderation.humanReviewProbability} />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Abusive Content Probability</p>
                <ConfidenceBar value={moderation.abusiveProbability} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Route */}
        {moderation && !routing && (
          <button
            onClick={routeTicket}
            disabled={!!loading}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Route Ticket
          </button>
        )}

        {/* Routing result */}
        {routing && (
          <div className={`rounded-lg border p-6 space-y-2 ${
            routing.action === 'route'
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <h2 className="text-lg font-medium text-gray-900">Routing Decision</h2>
            {routing.action === 'route' ? (
              <p className="text-sm">
                Routed to <Badge color="bg-green-100 text-green-800">{routing.queue}</Badge> queue
              </p>
            ) : (
              <p className="text-sm text-amber-800">
                Sent to manual review: {routing.reason}
              </p>
            )}
          </div>
        )}

        {/* Reset */}
        {routing && (
          <button
            onClick={reset}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            New Ticket
          </button>
        )}
      </main>
    </div>
  )
}
