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

    const thread = await prisma.qAThread.findFirst({
      where: {
        id: params.id,
        deal: {
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id } } },
          ],
        },
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
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json(thread)
  } catch (error) {
    console.error('Get QA thread error:', error)
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

    const thread = await prisma.qAThread.findFirst({
      where: {
        id: params.id,
        deal: {
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id, role: { in: ['DEAL_OWNER', 'SELLER_TEAM'] } } } },
          ],
        },
      },
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const { status, priority } = await request.json()

    const updatedThread = await prisma.qAThread.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
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
    })

    return NextResponse.json(updatedThread)
  } catch (error) {
    console.error('Update QA thread error:', error)
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

    const thread = await prisma.qAThread.findFirst({
      where: {
        id: params.id,
        OR: [
          { askerId: session.user.id },
          {
            deal: {
              OR: [
                { createdById: session.user.id },
                { participants: { some: { userId: session.user.id, role: 'DEAL_OWNER' } } },
              ],
            },
          },
        ],
      },
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or insufficient permissions' },
        { status: 404 }
      )
    }

    await prisma.qAThread.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete QA thread error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
