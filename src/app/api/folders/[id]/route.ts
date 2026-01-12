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

    const folder = await prisma.folder.findFirst({
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
        childFolders: {
          orderBy: { position: 'asc' },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Get folder error:', error)
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

    const folder = await prisma.folder.findFirst({
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

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const { name, parentFolderId, position } = await request.json()

    if (parentFolderId && parentFolderId === params.id) {
      return NextResponse.json(
        { error: 'A folder cannot be its own parent' },
        { status: 400 }
      )
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(parentFolderId !== undefined && { parentFolderId }),
        ...(position !== undefined && { position }),
      },
    })

    return NextResponse.json(updatedFolder)
  } catch (error) {
    console.error('Update folder error:', error)
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

    const folder = await prisma.folder.findFirst({
      where: {
        id: params.id,
        deal: {
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id, role: { in: ['DEAL_OWNER', 'SELLER_TEAM'] } } } },
          ],
        },
      },
      include: {
        childFolders: true,
        documents: true,
      },
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found or insufficient permissions' },
        { status: 404 }
      )
    }

    if (folder.childFolders.length > 0 || folder.documents.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with contents. Please remove all sub-folders and documents first.' },
        { status: 400 }
      )
    }

    await prisma.folder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
