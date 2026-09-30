import { ShieldAlert, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { applyFilters, type FilterState } from '@/hooks/useTicketFilters'
import { isAbusive } from '@/lib/ticket-variants'
import type { Ticket } from '@/lib/types'
import { cn } from 'cn'

const BUCKET_META = [
  { key: 'manual_review', label: 'Needs review',   dot: 'bg-destructive'         },
  { key: 'open',          label: 'Unanalyzed',     dot: 'bg-transparent ring-1 ring-inset ring-muted-foreground/70' },
  { key: 'moderated',     label: 'Awaiting route', dot: 'bg-warning'             },
  { key: 'account',       label: 'Account',        dot: 'bg-muted-foreground/50'             },
  { key: 'billing',       label: 'Billing',        dot: 'bg-muted-foreground/50'             },
  { key: 'sales',         label: 'Sales',          dot: 'bg-muted-foreground/50'             },
  { key: 'technical',     label: 'Technical',      dot: 'bg-muted-foreground/50'             },
  { key: 'other',         label: 'Other',          dot: 'bg-muted-foreground/50'             },
  { key: 'abusive',       label: 'Abusive · hidden', dot: 'bg-foreground'       },
]

function groupTickets(tickets: Ticket[]) {
  const map: Record<string, Ticket[]> = Object.fromEntries(BUCKET_META.map(b => [b.key, []]))
  for (const t of tickets) {
    if (isAbusive(t))                  { map.abusive.push(t);       continue }
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

function TicketRow({ ticket, selected, onClick }: {
  ticket: Ticket
  selected: boolean
  onClick: () => void
}) {
  const u = ticket.moderation?.urgency
  const showUrgency = u && u !== 'low'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full text-left border-b pl-6 pr-4 py-3 cursor-pointer transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
        selected ? 'bg-card animate-in fade-in-0 duration-300' : 'hover:bg-muted/60'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-2.5 top-3 bottom-3 w-[3px] rounded-full bg-primary transition-opacity duration-150 ease-out',
          selected ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        {isAbusive(ticket)
          ? <span className="flex items-center gap-1.5 text-sm text-muted-foreground italic truncate"><ShieldAlert className="w-3.5 h-3.5 shrink-0" />Content hidden</span>
          : <span className="text-sm truncate leading-snug">{ticket.message}</span>}
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">{formatTime(ticket.createdAt)}</span>
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
}: {
  tickets: Ticket[]
  selectedId: string | null
  onSelect: (id: string) => void
  filters: FilterState
  onFilterChange: (f: Partial<FilterState>) => void
}) {
  const filtered = applyFilters(tickets, filters)
  const buckets = groupTickets(filtered)

  const hasAdvancedFilters = filters.category !== 'all' || filters.urgency !== 'all'
  const advancedChips = [
    filters.category !== 'all' && { key: 'category' as const, label: filters.category },
    filters.urgency !== 'all'  && { key: 'urgency'  as const, label: filters.urgency  },
  ].filter(Boolean) as { key: 'category' | 'urgency'; label: string }[]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search + filters */}
      <div className="flex items-center gap-1.5 p-3 border-b">
        <Input
          placeholder="Search message or ID..."
          value={filters.search}
          onChange={e => onFilterChange({ search: e.target.value })}
          className="h-8 text-sm flex-1 min-w-0 bg-card"
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
                  <SelectItem value="abusive">Abusive</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
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
                  <SelectItem value="urgency">Highest urgency first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </div>

      {/* Active filter chips */}
      {advancedChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b">
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
      <div className="flex flex-col overflow-y-auto flex-1 min-h-0">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No tickets match</p>
        )}
        <div className="flex flex-col">
          {buckets.map(bucket => (
            <div key={bucket.key}>
              <div className="sticky top-0 z-10 flex items-center gap-2 pl-6 pr-4 py-1.5 bg-muted/95 backdrop-blur-sm border-b">
                <span className={cn('w-2 h-2 rounded-full shrink-0', bucket.dot)} />
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{bucket.label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">{bucket.tickets.length}</span>
              </div>
              <div className="flex flex-col">
                {bucket.tickets.map(ticket => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedId === ticket.id}
                    onClick={() => onSelect(ticket.id)}
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
