import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function CreateTicketDialog({ onCreate }: { onCreate: (message: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setLoading(true)
    try {
      await onCreate(message.trim())
      setMessage('')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New Ticket</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Support Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Textarea
            placeholder="Describe the issue..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            autoFocus
          />
          <Button
            className="w-full"
            onClick={submit}
            disabled={!message.trim() || loading}
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
