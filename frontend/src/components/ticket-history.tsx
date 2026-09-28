import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { get } from '@/lib/api'
import { statusLabel, statusVariant } from '@/lib/ticket-variants'
import type { Ticket } from '@/lib/types'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TicketHistory({
  tickets,
  setTickets,
  selectedId,
  onSelect,
}: {
  tickets: Ticket[]
  setTickets: (tickets: Ticket[]) => void
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  useEffect(() => {
    get<Ticket[]>('/tickets').then(setTickets).catch(() => {})
  }, [setTickets])

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground px-1">History</h2>
      {tickets.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">No tickets yet</p>
      )}
      {tickets.map(ticket => (
        <Card
          key={ticket.id}
          size="sm"
          className={`cursor-pointer transition-colors ${
            selectedId === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
          }`}
          onClick={() => onSelect(ticket.id)}
        >
          <CardHeader>
            <CardTitle className="truncate text-sm">{ticket.message}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant={statusVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
            <span className="text-xs text-muted-foreground">{formatTime(ticket.createdAt)}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
