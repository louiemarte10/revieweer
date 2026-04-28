import { NextRequest, NextResponse } from 'next/server'
import { getInterviewerResponse, Message, Topic } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { messages, topic, resumeText, isFirstMessage } = await req.json() as {
      messages: Message[]
      topic: Topic
      resumeText: string | null
      isFirstMessage: boolean
    }

    const response = await getInterviewerResponse(messages, topic, resumeText, isFirstMessage)
    return NextResponse.json({ response })
  } catch (err) {
    console.error('Respond error:', err)
    return NextResponse.json({ error: 'AI response failed' }, { status: 500 })
  }
}
