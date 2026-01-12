import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            documents: true,
            participants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Get deals error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, targetCompany, dealType, estimatedCloseDate } = await request.json()

    if (!name || !targetCompany || !dealType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const organizationMember = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        organization: true,
      },
    })

    if (!organizationMember) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const deal = await prisma.deal.create({
      data: {
        name,
        targetCompany,
        dealType,
        estimatedCloseDate: estimatedCloseDate ? new Date(estimatedCloseDate) : undefined,
        organizationId: organizationMember.organizationId,
        createdById: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
            role: 'DEAL_OWNER',
            ndaSigned: true,
            ndaSignedAt: new Date(),
          },
        },
        dealSettings: {
          create: {},
        },
      },
      include: {
        organization: true,
        createdBy: true,
        participants: true,
      },
    })

    const defaultFolders = [
      'Financial Statements',
      'Legal Documents',
      'Commercial',
      'Human Resources',
      'IT & Technology',
      'Operations',
      'Tax',
      'Environmental',
    ]

    await Promise.all(
      defaultFolders.map((folderName, index) =>
        prisma.folder.create({
          data: {
            dealId: deal.id,
            name: folderName,
            position: index,
          },
        })
      )
    )

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Create deal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
