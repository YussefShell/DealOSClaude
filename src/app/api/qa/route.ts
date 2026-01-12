import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    const where = {
      deal: {
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
      ...(dealId && { dealId }),
    }

    const threads = await prisma.qAThread.findMany({
      where,
      include: {
        asker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
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

    return NextResponse.json(threads)
  } catch (error) {
    console.error('Get QA threads error:', error)
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

    const { dealId, question, priority = 'NORMAL' } = await request.json()

    if (!dealId || !question) {
      return NextResponse.json(
        { error: 'Deal ID and question are required' },
        { status: 400 }
      )
    }

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const thread = await prisma.qAThread.create({
      data: {
        dealId,
        question,
        askerId: session.user.id,
        priority,
      },
      include: {
        asker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        responses: true,
      },
    })

    const dealOwner = await prisma.dealParticipant.findFirst({
      where: {
        dealId,
        role: 'DEAL_OWNER',
      },
    })

    if (dealOwner && dealOwner.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: dealOwner.userId,
          type: 'NEW_QUESTION',
          title: 'New Question Posted',
          message: `${session.user.name} posted a question in ${deal.name}`,
          link: `/dashboard/qa?dealId=${dealId}`,
        },
      })
    }

    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    console.error('Create QA thread error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
