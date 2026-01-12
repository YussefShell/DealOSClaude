import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

async function getQAThreads(userId: string) {
  const threads = await prisma.qAThread.findMany({
    where: {
      deal: {
        OR: [
          { createdById: userId },
          { participants: { some: { userId } } },
        ],
      },
    },
    include: {
      asker: {
        select: {
          name: true,
          email: true,
        },
      },
      deal: {
        select: {
          name: true,
        },
      },
      responses: {
        include: {
          responder: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return threads
}

export default async function QAPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const threads = await getQAThreads(userId)

  const openThreads = threads.filter((t) => t.status === 'OPEN')
  const answeredThreads = threads.filter((t) => t.status === 'ANSWERED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Q&A</h1>
        <p className="text-muted-foreground">
          Questions and answers across all deal rooms
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openThreads.length}</div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{answeredThreads.length}</div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threads.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Questions</CardTitle>
          <CardDescription>
            Questions and responses from buyers and advisors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>No questions yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {threads.map((thread) => (
                <div key={thread.id} className="rounded-lg border p-4">
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
                        <span className="text-xs text-muted-foreground">
                          {thread.deal.name}
                        </span>
                      </div>
                      <h3 className="mb-1 font-medium">{thread.question}</h3>
                      <p className="text-sm text-muted-foreground">
                        Asked by {thread.asker.name} on{' '}
                        {formatDateTime(thread.createdAt)}
                      </p>
                    </div>
                  </div>

                  {thread.responses.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {thread.responses.map((response) => (
                        <div key={response.id} className="rounded bg-muted p-3">
                          <p className="mb-2 text-sm">{response.response}</p>
                          <p className="text-xs text-muted-foreground">
                            {response.responder.name} •{' '}
                            {formatDateTime(response.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
