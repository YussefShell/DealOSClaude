'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { MessageSquare, Send } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface QAThreadProps {
  thread: {
    id: string
    question: string
    status: string
    priority: string
    createdAt: Date
    asker: {
      id: string
      name: string | null
      email: string
    }
    deal?: {
      id: string
      name: string
    }
    responses: Array<{
      id: string
      response: string
      createdAt: Date
      responder: {
        id: string
        name: string | null
        email: string
      }
    }>
  }
  canRespond?: boolean
  onUpdate?: () => void
}

export function QAThread({ thread, canRespond = false, onUpdate }: QAThreadProps) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/qa/${thread.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to post response',
          variant: 'destructive',
        })
        return
      }

      addToast({
        title: 'Success',
        description: 'Response posted successfully',
      })

      setResponse('')
      setShowResponseForm(false)
      onUpdate?.()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant={
                thread.status === 'OPEN'
                  ? 'default'
                  : thread.status === 'ANSWERED'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {thread.status}
            </Badge>
            {thread.priority !== 'NORMAL' && (
              <Badge variant="destructive">{thread.priority}</Badge>
            )}
            {thread.deal && (
              <span className="text-xs text-muted-foreground">
                {thread.deal.name}
              </span>
            )}
          </div>
          <h3 className="mb-1 font-medium">{thread.question}</h3>
          <p className="text-sm text-muted-foreground">
            Asked by {thread.asker.name || thread.asker.email} on{' '}
            {formatDateTime(thread.createdAt)}
          </p>
        </div>
      </div>

      {thread.responses.length > 0 && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {thread.responses.map((res) => (
            <div key={res.id} className="rounded bg-muted p-3">
              <p className="mb-2 text-sm whitespace-pre-wrap">{res.response}</p>
              <p className="text-xs text-muted-foreground">
                {res.responder.name || res.responder.email} •{' '}
                {formatDateTime(res.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {canRespond && (
        <div className="mt-4 border-t pt-4">
          {showResponseForm ? (
            <form onSubmit={handleSubmitResponse} className="space-y-3">
              <Textarea
                placeholder="Type your response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Posting...' : 'Post Response'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResponseForm(false)
                    setResponse('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Respond
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
