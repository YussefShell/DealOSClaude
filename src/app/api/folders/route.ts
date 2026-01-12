import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dealId, name, parentFolderId, position } = await request.json()

    if (!dealId || !name) {
      return NextResponse.json(
        { error: 'Deal ID and folder name are required' },
        { status: 400 }
      )
    }

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
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

    if (parentFolderId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentFolderId,
          dealId,
        },
      })

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    const maxPosition = await prisma.folder.aggregate({
      where: {
        dealId,
        parentFolderId: parentFolderId || null,
      },
      _max: {
        position: true,
      },
    })

    const folder = await prisma.folder.create({
      data: {
        dealId,
        name,
        parentFolderId: parentFolderId || null,
        position: position !== undefined ? position : (maxPosition._max.position || 0) + 1,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
