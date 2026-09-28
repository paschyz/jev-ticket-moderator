import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyFilters, DEFAULT_FILTERS, type FilterState } from '@/hooks/useTicketFilters'
import type { Ticket } from '@/lib/types'

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

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TicketList({
  tickets,
  selectedId,
  onSelect,
  filters,
  onFilterChange,
}: {
  tickets: Ticket[]
  selectedId: string | null
  onSelect: (id: string) => void
  filters: FilterState
  onFilterChange: (f: Partial<FilterState>) => void
}) {
  const filtered = applyFilters(tickets, filters)
  const hasFilters = filters.search || filters.status !== 'all' || filters.category !== 'all' || filters.urgency !== 'all'

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search */}
      <Input
        placeholder="Search tickets..."
        value={filters.search}
        onChange={e => onFilterChange({ search: e.target.value })}
      />

      {/* Filters row */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={filters.status} onValueChange={v => onFilterChange({ status: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="moderated">Moderated</SelectItem>
            <SelectItem value="routed">Routed</SelectItem>
            <SelectItem value="manual_review">Needs review</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.urgency} onValueChange={v => onFilterChange({ urgency: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={v => onFilterChange({ category: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={v => onFilterChange({ sort: v as FilterState['sort'] })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="urgency">By urgency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count + clear */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
        {hasFilters && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pb-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tickets match</p>
        )}
        {filtered.map(ticket => (
          <Card
            key={ticket.id}
            size="sm"
            className={`cursor-pointer transition-colors ${
              selectedId === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelect(ticket.id)}
          >
            <CardHeader>
              <CardTitle className="truncate text-sm leading-snug">{ticket.message}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge variant={statusVariant(ticket.status)} className="text-xs shrink-0">
                  {ticket.status === 'manual_review' ? 'review' : ticket.status}
                </Badge>
                {ticket.moderation?.urgency && ticket.moderation.urgency !== 'low' && (
                  <Badge variant={urgencyVariant(ticket.moderation.urgency)} className="text-xs shrink-0">
                    {ticket.moderation.urgency}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatTime(ticket.createdAt)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
