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
      include: {
        organization: true,
        createdBy: true,
        participants: {
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
        },
        folders: {
          include: {
            documents: true,
          },
        },
        dealSettings: true,
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Get deal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { name, targetCompany, dealType, estimatedCloseDate, status } = await request.json()

    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(targetCompany && { targetCompany }),
        ...(dealType && { dealType }),
        ...(estimatedCloseDate && { estimatedCloseDate: new Date(estimatedCloseDate) }),
        ...(status && { status }),
      },
      include: {
        organization: true,
        createdBy: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(updatedDeal)
  } catch (error) {
    console.error('Update deal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        createdById: session.user.id,
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found or insufficient permissions' },
        { status: 404 }
      )
    }

    await prisma.deal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete deal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
