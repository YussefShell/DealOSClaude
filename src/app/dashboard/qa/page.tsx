'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { QAThread } from '@/components/qa/qa-thread'
import { AskQuestionDialog } from '@/components/qa/ask-question-dialog'
import { MessageSquare, Loader2 } from 'lucide-react'

interface Deal {
  id: string
  name: string
}

interface QAThreadType {
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
  deal: {
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

export default function QAPage() {
  const { data: session } = useSession()
  const [threads, setThreads] = useState<QAThreadType[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedDeal, setSelectedDeal] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchThreads = async (dealId?: string) => {
    setLoading(true)
    try {
      const url = dealId && dealId !== 'all' ? `/api/qa?dealId=${dealId}` : '/api/qa'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setThreads(data)
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals')
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    }
  }

  useEffect(() => {
    fetchThreads()
    fetchDeals()
  }, [])

  useEffect(() => {
    fetchThreads(selectedDeal !== 'all' ? selectedDeal : undefined)
  }, [selectedDeal])

  const openThreads = threads.filter((t) => t.status === 'OPEN')
  const answeredThreads = threads.filter((t) => t.status === 'ANSWERED')

  const canRespond = (thread: QAThreadType) => {
    return session?.user?.id !== thread.asker.id
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Q&A</h1>
          <p className="text-muted-foreground">
            Questions and answers across all deal rooms
          </p>
        </div>
        {selectedDeal !== 'all' && (
          <AskQuestionDialog
            dealId={selectedDeal}
            onSuccess={() => fetchThreads(selectedDeal !== 'all' ? selectedDeal : undefined)}
          />
        )}
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Select
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
          >
            <option value="all">All Deals</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openThreads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{answeredThreads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threads.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p>No questions yet</p>
            <p className="text-sm mt-2">
              {selectedDeal === 'all'
                ? 'Select a deal above to ask a question'
                : 'Click "Ask Question" to post your first question'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <QAThread
              key={thread.id}
              thread={thread}
              canRespond={canRespond(thread)}
              onUpdate={() => fetchThreads(selectedDeal !== 'all' ? selectedDeal : undefined)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
