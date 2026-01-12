import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; participantId: string } }
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
          { participants: { some: { userId: session.user.id, role: 'DEAL_OWNER' } } },
        ],
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const { role } = await request.json()

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    const participant = await prisma.dealParticipant.update({
      where: { id: params.participantId },
      data: { role },
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

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Update participant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; participantId: string } }
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
          { participants: { some: { userId: session.user.id, role: 'DEAL_OWNER' } } },
        ],
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found or insufficient permissions' },
        { status: 404 }
      )
    }

    await prisma.dealParticipant.delete({
      where: { id: params.participantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove participant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
