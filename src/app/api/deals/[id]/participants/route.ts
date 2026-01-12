import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const participants = await prisma.dealParticipant.findMany({
      where: { dealId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error('Get participants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id, role: { in: ['DEAL_OWNER', 'SELLER_TEAM'] } } } },
        ],
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      })
    }

    const existingParticipant = await prisma.dealParticipant.findUnique({
      where: {
        dealId_userId: {
          dealId: params.id,
          userId: user.id,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 400 }
      )
    }

    const participant = await prisma.dealParticipant.create({
      data: {
        dealId: params.id,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ACCESS_GRANTED',
        title: 'Deal Access Granted',
        message: `You have been invited to join the deal: ${deal.name}`,
        link: `/dashboard/deals/${deal.id}`,
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('Add participant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
