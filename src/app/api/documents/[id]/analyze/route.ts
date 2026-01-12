import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'
import { analyzeDocument, extractContractTerms, extractFinancialData } from '@/lib/ai/claude'
// @ts-ignore
import pdf from 'pdf-parse'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    return ''
  }
}

async function extractTextFromFile(filepath: string, mimeType: string): Promise<string> {
  const buffer = await readFile(filepath)

  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer)
  }

  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8')
  }

  return buffer.toString('utf-8')
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

    const existingAnalysis = await prisma.aIExtraction.findFirst({
      where: {
        documentId: document.id,
        extractionType: 'DOCUMENT_CLASSIFICATION',
      },
    })

    if (existingAnalysis) {
      return NextResponse.json(existingAnalysis)
    }

    const filepath = path.join(UPLOAD_DIR, document.s3Key)
    const content = await extractTextFromFile(filepath, document.mimeType)

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from document' },
        { status: 400 }
      )
    }

    const analysis = await analyzeDocument(content, document.originalFilename)

    const aiExtraction = await prisma.aIExtraction.create({
      data: {
        documentId: document.id,
        extractionType: 'DOCUMENT_CLASSIFICATION',
        extractedData: analysis as any,
        confidenceScore: analysis.confidenceScore,
        model: 'claude-3-5-sonnet-20241022',
      },
    })

    if (analysis.classification.toLowerCase().includes('contract')) {
      const contractTerms = await extractContractTerms(content)
      await prisma.aIExtraction.create({
        data: {
          documentId: document.id,
          extractionType: 'CONTRACT_TERMS',
          extractedData: contractTerms,
          confidenceScore: 0.8,
          model: 'claude-3-5-sonnet-20241022',
        },
      })
    }

    if (analysis.classification.toLowerCase().includes('financial')) {
      const financialData = await extractFinancialData(content)
      await prisma.aIExtraction.create({
        data: {
          documentId: document.id,
          extractionType: 'FINANCIAL_DATA',
          extractedData: financialData,
          confidenceScore: 0.8,
          model: 'claude-3-5-sonnet-20241022',
        },
      })
    }

    return NextResponse.json(aiExtraction)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const extractions = await prisma.aIExtraction.findMany({
      where: {
        documentId: params.id,
        document: {
          deal: {
            OR: [
              { createdById: session.user.id },
              { participants: { some: { userId: session.user.id } } },
            ],
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(extractions)
  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
