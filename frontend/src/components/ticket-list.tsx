import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { applyFilters, type FilterState } from '@/hooks/useTicketFilters'
import { statusLabel } from '@/lib/ticket-variants'
import type { Ticket } from '@/lib/types'
import { cn } from 'cn'

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'manual_review', label: 'Review' },
  { value: 'moderated', label: 'Analyzed' },
  { value: 'routed', label: 'Routed' },
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function rowAccent(ticket: Ticket): string {
  const u = ticket.moderation?.urgency
  if (ticket.status === 'manual_review' || u === 'critical' || u === 'high') return 'border-l-destructive'
  if (u === 'medium') return 'border-l-warning'
  if (ticket.status === 'routed') return 'border-l-success'
  return 'border-l-border'
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
        'w-full text-left border-l-2 pl-3 pr-3 py-2.5 rounded-r-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        rowAccent(ticket),
        selected ? 'bg-muted' : 'hover:bg-muted/40'
      )}
    >
      {/* Line 1: message + category + time */}
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <span className="text-sm truncate leading-snug font-medium">{ticket.message}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {ticket.moderation?.category && (
            <Badge variant="outline" className="text-[11px] h-4 px-1.5 shrink-0 font-normal capitalize">
              {ticket.moderation.category}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(ticket.createdAt)}</span>
        </div>
      </div>
      {/* Line 2: status + urgency */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-muted-foreground">{statusLabel(ticket.status)}</span>
        {showUrgency && (
          <>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <span className={cn(
              'text-xs capitalize',
              u === 'critical' || u === 'high' ? 'text-destructive' : 'text-warning'
            )}>
              {u}
            </span>
          </>
        )}
      </div>
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

  const advancedChips = [
    filters.category !== 'all' && { key: 'category' as const, label: `category: ${filters.category}` },
    filters.urgency !== 'all' && { key: 'urgency' as const, label: `urgency: ${filters.urgency}` },
  ].filter(Boolean) as { key: 'category' | 'urgency'; label: string }[]

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Row 1: search + filters popover + sort */}
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={e => onFilterChange({ search: e.target.value })}
          className="h-8 text-sm flex-1 min-w-0"
        />
        <PopoverRoot>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1 px-2.5">
              Filters
              {advancedChips.length > 0 && (
                <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px] leading-none">
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
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
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
                  <SelectValue placeholder="Any urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any urgency</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </PopoverRoot>
        <Select value={filters.sort} onValueChange={v => onFilterChange({ sort: v as FilterState['sort'] })}>
          <SelectTrigger className="h-8 w-24 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="urgency">Urgency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: status pills */}
      <div className="flex items-center gap-0.5 -mx-0.5">
        {STATUS_PILLS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onFilterChange({ status: p.value })}
            className={cn(
              'text-xs px-2 py-1 rounded-md transition-colors',
              filters.status === p.value
                ? 'bg-secondary text-secondary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Row 3: active advanced filter chips */}
      {advancedChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {advancedChips.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange({ [f.key]: 'all' })}
              className="inline-flex items-center gap-1 text-xs bg-muted/70 px-2 py-0.5 rounded-full hover:bg-muted transition-colors"
            >
              {f.label}
              <span className="text-muted-foreground/50 leading-none">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'all', urgency: 'all' })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground px-0.5">
        {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Ticket rows */}
      <div className="flex flex-col overflow-y-auto flex-1 min-h-0 pb-2 -mx-0.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tickets match</p>
        )}
        {filtered.map(ticket => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            selected={selectedId === ticket.id}
            onClick={() => onSelect(ticket.id)}
          />
        ))}
      </div>
    </div>
  )
}
