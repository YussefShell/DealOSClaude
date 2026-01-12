import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUploadButton } from '@/components/deals/file-upload-button'
import { DocumentList } from '@/components/deals/document-list'
import { DealHeader } from '@/components/deals/deal-header'
import { InviteParticipantDialog } from '@/components/deals/invite-participant-dialog'
import { ParticipantsList } from '@/components/deals/participants-list'
import { CreateFolderDialog } from '@/components/deals/create-folder-dialog'
import { AskQuestionDialog } from '@/components/qa/ask-question-dialog'
import { formatDate } from '@/lib/utils'

async function getDeal(dealId: string, userId: string) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      organization: true,
      createdBy: true,
      participants: {
        include: {
          user: true,
        },
      },
      folders: {
        orderBy: { position: 'asc' },
        include: {
          documents: {
            include: {
              uploadedBy: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      dealSettings: true,
    },
  })

  return deal
}

export default async function DealPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const deal = await getDeal(params.id, userId)

  if (!deal) {
    notFound()
  }

  const userParticipant = deal.participants.find((p: any) => p.userId === userId)
  const isOwner = deal.createdById === userId || userParticipant?.role === 'DEAL_OWNER'
  const canRespond = isOwner || userParticipant?.role === 'SELLER_TEAM'

  const totalDocuments = deal.folders.reduce(
    (sum: number, folder: any) => sum + folder.documents.length,
    0
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <DealHeader deal={deal} isOwner={isOwner} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} across{' '}
                  {deal.folders.length} folder{deal.folders.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <CreateFolderDialog dealId={deal.id} />
                    <FileUploadButton dealId={deal.id} />
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DocumentList
                folders={deal.folders}
                dealId={deal.id}
                isOwner={isOwner}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions & Answers</CardTitle>
                  <CardDescription>
                    Ask questions and get answers from the seller team
                  </CardDescription>
                </div>
                {!canRespond && <AskQuestionDialog dealId={deal.id} />}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                View all Q&A in the{' '}
                <a href="/dashboard/qa" className="text-primary hover:underline">
                  Q&A section
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1">{deal.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deal Type</p>
                <p className="mt-1 font-medium">
                  {deal.dealType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="mt-1 font-medium">{formatDate(deal.createdAt)}</p>
              </div>
              {deal.estimatedCloseDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Close Date
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDate(deal.estimatedCloseDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>
                    {deal.participants.length} member
                    {deal.participants.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {isOwner && <InviteParticipantDialog dealId={deal.id} />}
              </div>
            </CardHeader>
            <CardContent>
              <ParticipantsList
                dealId={deal.id}
                participants={deal.participants}
                isOwner={isOwner}
                currentUserId={userId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
