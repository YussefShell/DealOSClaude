import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
        deal: true,
        asker: true,
      },
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or insufficient permissions' },
        { status: 404 }
      )
    }

    const { response } = await request.json()

    if (!response) {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      )
    }

    const qaResponse = await prisma.qAResponse.create({
      data: {
        threadId: params.id,
        response,
        responderId: session.user.id,
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await prisma.qAThread.update({
      where: { id: params.id },
      data: { status: 'ANSWERED' },
    })

    if (thread.askerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: thread.askerId,
          type: 'QUESTION_ANSWERED',
          title: 'Your Question Was Answered',
          message: `${session.user.name} answered your question in ${thread.deal.name}`,
          link: `/dashboard/qa?threadId=${params.id}`,
        },
      })
    }

    return NextResponse.json(qaResponse, { status: 201 })
  } catch (error) {
    console.error('Create QA response error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
