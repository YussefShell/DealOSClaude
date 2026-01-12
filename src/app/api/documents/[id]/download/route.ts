import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        deal: {
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id } } },
          ],
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const filepath = path.join(UPLOAD_DIR, document.s3Key)
    const fileBuffer = await readFile(filepath)

    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        actionType: 'DOWNLOAD',
      },
    })

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
        'Content-Length': document.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
