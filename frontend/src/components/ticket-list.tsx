import { SlidersHorizontal } from 'lucide-react'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { applyFilters, type FilterState } from '@/hooks/useTicketFilters'
import type { Ticket } from '@/lib/types'
import { cn } from 'cn'

const BUCKET_META = [
  { key: 'manual_review', label: 'Needs review',   accent: 'border-l-destructive',  dot: 'bg-destructive'         },
  { key: 'open',          label: 'Unanalyzed',     accent: 'border-l-border',       dot: 'bg-muted-foreground/40' },
  { key: 'moderated',     label: 'Awaiting route', accent: 'border-l-warning',      dot: 'bg-warning'             },
  { key: 'billing',       label: 'Billing',        accent: 'border-l-success',      dot: 'bg-success'             },
  { key: 'technical',     label: 'Technical',      accent: 'border-l-success',      dot: 'bg-success'             },
  { key: 'account',       label: 'Account',        accent: 'border-l-success',      dot: 'bg-success'             },
  { key: 'sales',         label: 'Sales',          accent: 'border-l-success',      dot: 'bg-success'             },
  { key: 'other',         label: 'Other',          accent: 'border-l-success',      dot: 'bg-success'             },
]

function groupTickets(tickets: Ticket[]) {
  const map: Record<string, Ticket[]> = Object.fromEntries(BUCKET_META.map(b => [b.key, []]))
  for (const t of tickets) {
    if (t.status === 'manual_review')  { map.manual_review.push(t); continue }
    if (t.status === 'open')           { map.open.push(t);          continue }
    if (t.status === 'moderated')      { map.moderated.push(t);     continue }
    if (t.routing?.action === 'route') { map[t.routing.queue]?.push(t)       }
  }
  return BUCKET_META
    .map(b => ({ ...b, tickets: map[b.key] }))
    .filter(b => b.tickets.length > 0)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function TicketRow({ ticket, selected, onClick, accentClass }: {
  ticket: Ticket
  selected: boolean
  onClick: () => void
  accentClass: string
}) {
  const u = ticket.moderation?.urgency
  const showUrgency = u && u !== 'low'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left border-l-2 pl-3 pr-3 py-2.5 rounded-r-sm cursor-pointer transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
        accentClass,
        selected ? 'bg-muted' : 'hover:bg-muted/50'
      )}
    >
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <span className="text-sm truncate leading-snug font-medium">{ticket.message}</span>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatTime(ticket.createdAt)}</span>
      </div>
      {showUrgency && (
        <div className="flex items-center mt-0.5">
          <span className={cn(
            'text-xs capitalize',
            u === 'critical' || u === 'high' ? 'text-destructive' : 'text-warning'
          )}>
            {u}
          </span>
        </div>
      )}
    </button>
  )
}

export function TicketList({
  tickets,
  selectedId,
  onSelect,
  filters,
  onFilterChange,
  onCreate,
}: {
  tickets: Ticket[]
  selectedId: string | null
  onSelect: (id: string) => void
  filters: FilterState
  onFilterChange: (f: Partial<FilterState>) => void
  onCreate: (message: string) => Promise<void>
}) {
  const filtered = applyFilters(tickets, filters)
  const buckets = groupTickets(filtered)

  const hasAdvancedFilters = filters.category !== 'all' || filters.urgency !== 'all'
  const advancedChips = [
    filters.category !== 'all' && { key: 'category' as const, label: filters.category },
    filters.urgency !== 'all'  && { key: 'urgency'  as const, label: filters.urgency  },
  ].filter(Boolean) as { key: 'category' | 'urgency'; label: string }[]

  return (
    <div className="flex flex-col gap-2 h-full">
      <CreateTicketDialog onCreate={onCreate} />

      {/* Search + filters */}
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={e => onFilterChange({ search: e.target.value })}
          className="h-8 text-sm flex-1 min-w-0"
        />
        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 h-8 w-8 relative" aria-label="Filters">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {hasAdvancedFilters && (
                <Badge variant="default" className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {advancedChips.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <Select value={filters.category} onValueChange={v => onFilterChange({ category: v })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Urgency</p>
              <Select value={filters.urgency} onValueChange={v => onFilterChange({ urgency: v })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Sort</p>
              <Select value={filters.sort} onValueChange={v => onFilterChange({ sort: v as FilterState['sort'] })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="urgency">By urgency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </div>

      {/* Active filter chips */}
      {advancedChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {advancedChips.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange({ [f.key]: 'all' })}
              className={cn(
                'inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full cursor-pointer',
                'hover:bg-muted/70 transition-colors capitalize',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              )}
            >
              {f.label}
              <span className="text-muted-foreground/50 leading-none">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'all', urgency: 'all' })}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Grouped ticket list */}
      <div className="flex flex-col overflow-y-auto flex-1 min-h-0 pb-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tickets match</p>
        )}
        <div className="flex flex-col gap-4">
          {buckets.map(bucket => (
            <div key={bucket.key}>
              <div className="flex items-center gap-2 mb-1 px-0.5">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', bucket.dot)} />
                <span className="text-xs font-medium">{bucket.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{bucket.tickets.length}</span>
              </div>
              <div className="flex flex-col">
                {bucket.tickets.map(ticket => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedId === ticket.id}
                    onClick={() => onSelect(ticket.id)}
                    accentClass={bucket.accent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
