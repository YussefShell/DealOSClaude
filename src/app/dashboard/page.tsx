import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function getDeals(userId: string) {
  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      organization: true,
      createdBy: true,
      _count: {
        select: {
          documents: true,
          participants: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return deals
}

async function getDashboardStats(userId: string) {
  const totalDeals = await prisma.deal.count({
    where: {
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
  })

  const activeDeals = await prisma.deal.count({
    where: {
      status: 'ACTIVE',
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
  })

  const totalDocuments = await prisma.document.count({
    where: {
      deal: {
        OR: [
          { createdById: userId },
          { participants: { some: { userId } } },
        ],
      },
    },
  })

  return { totalDeals, activeDeals, totalDocuments }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const deals = await getDeals(userId)
  const stats = await getDashboardStats(userId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deal Rooms</h1>
          <p className="text-muted-foreground">
            Manage your M&A transactions and virtual data rooms
          </p>
        </div>
        <Link href="/dashboard/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal Room
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDeals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Across all deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.reduce((sum: number, deal: any) => sum + deal._count.participants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total across deals
            </p>
          </CardContent>
        </Card>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No deals yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Create your first deal room to start managing your M&A transactions
            </p>
            <Link href="/dashboard/deals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Deal Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal: any) => (
            <Link key={deal.id} href={`/dashboard/deals/${deal.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{deal.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {deal.targetCompany}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={deal.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {deal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Documents</span>
                      <span className="font-medium">{deal._count.documents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Participants</span>
                      <span className="font-medium">{deal._count.participants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{formatDate(deal.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
