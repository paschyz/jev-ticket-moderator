export function statusVariant(status: string) {
  switch (status) {
    case 'routed': return 'success' as const
    case 'moderated': return 'warning' as const
    case 'manual_review': return 'destructive' as const
    default: return 'outline' as const
  }
}

export function urgencyVariant(urgency: string) {
  switch (urgency) {
    case 'critical': case 'high': return 'destructive' as const
    case 'medium': return 'warning' as const
    default: return 'outline' as const
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case 'manual_review': return 'Needs review'
    case 'moderated': return 'Analyzed'
    default: return status
  }
}
