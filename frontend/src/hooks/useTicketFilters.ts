import { isAbusive } from '@/lib/ticket-variants'
import type { Ticket } from '@/lib/types'

export type FilterState = {
  search: string
  category: string
  urgency: string
  sort: 'newest' | 'oldest' | 'urgency'
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'all',
  urgency: 'all',
  sort: 'newest',
}

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export function applyFilters(tickets: Ticket[], filters: FilterState): Ticket[] {
  return tickets
    .filter(t => {
      const q = filters.search.trim().toLowerCase()
      // abusive content is never searchable by text, only by id
      const textMatch = !isAbusive(t) && t.message.toLowerCase().includes(q)
      if (q && !textMatch && !t.id.toLowerCase().includes(q)) return false
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
