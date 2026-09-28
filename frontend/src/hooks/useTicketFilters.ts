import type { Ticket } from '@/lib/types'

export type FilterState = {
  search: string
  status: string
  category: string
  urgency: string
  sort: 'newest' | 'oldest' | 'urgency'
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  category: 'all',
  urgency: 'all',
  sort: 'newest',
}

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export function applyFilters(tickets: Ticket[], filters: FilterState): Ticket[] {
  return tickets
    .filter(t => {
      if (filters.search && !t.message.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.status !== 'all' && t.status !== filters.status) return false
      if (filters.category !== 'all' && t.moderation?.category !== filters.category) return false
      if (filters.urgency !== 'all' && t.moderation?.urgency !== filters.urgency) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (filters.sort === 'urgency') {
        const ua = URGENCY_ORDER[a.moderation?.urgency ?? 'low'] ?? 3
        const ub = URGENCY_ORDER[b.moderation?.urgency ?? 'low'] ?? 3
        return ua !== ub ? ua - ub : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}
