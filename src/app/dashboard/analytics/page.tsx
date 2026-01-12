import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Eye, Download, Users, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

async function getAnalytics(userId: string) {
  const totalViews = await prisma.documentActivity.count({
    where: {
      actionType: 'VIEW',
      document: {
        deal: {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
    },
  })

  const totalDownloads = await prisma.documentActivity.count({
    where: {
      actionType: 'DOWNLOAD',
      document: {
        deal: {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
    },
  })

  const recentActivity = await prisma.documentActivity.findMany({
    where: {
      document: {
        deal: {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      document: {
        select: {
          originalFilename: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const activeUsers = await prisma.documentActivity.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
      document: {
        deal: {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
    },
    _count: true,
  })

  return {
    totalViews,
    totalDownloads,
    activeUsers: activeUsers.length,
    recentActivity,
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const analytics = await getAnalytics(userId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track engagement and activity across your deal rooms
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalViews > 0
                ? ((analytics.totalDownloads / analytics.totalViews) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Download rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest document views and downloads across all deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {activity.actionType === 'VIEW' ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Download className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {activity.user.name} {activity.actionType.toLowerCase()}ed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.document.originalFilename}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
