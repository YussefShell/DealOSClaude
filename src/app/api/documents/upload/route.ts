import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

function generateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dealId = formData.get('dealId') as string
    const folderId = formData.get('folderId') as string | undefined

    if (!file || !dealId) {
      return NextResponse.json(
        { error: 'Missing file or dealId' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
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
        { error: 'Deal not found or access denied' },
        { status: 404 }
      )
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, dealId },
      })

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        )
      }
    }

    await ensureUploadDir()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const checksum = generateChecksum(buffer)

    const fileExt = path.extname(file.name)
    const filename = `${crypto.randomUUID()}${fileExt}`
    const filepath = path.join(UPLOAD_DIR, filename)

    await writeFile(filepath, buffer)

    const document = await prisma.document.create({
      data: {
        dealId,
        folderId: folderId || null,
        filename,
        originalFilename: file.name,
        fileSize: BigInt(file.size),
        fileType: fileExt.slice(1),
        mimeType: file.type,
        s3Key: filename,
        s3Bucket: 'local',
        checksum,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        actionType: 'VIEW',
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
