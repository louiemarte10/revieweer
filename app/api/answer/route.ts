import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Topic } from '@/lib/claude'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const TOPIC_LABELS: Record<Topic, string> = {
  ai: 'AI/ML engineering',
  backend: 'backend development',
  frontend: 'frontend development',
  general: 'software engineering',
}

export async function POST(req: NextRequest) {
  try {
    const { question, topic, resumeText } = await req.json() as {
      question: string
      topic: Topic
      resumeText: string | null
    }

    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const systemPrompt = `You are an expert ${TOPIC_LABELS[topic]} professional helping a candidate prepare for interviews.

${resumeText ? `Candidate background:\n${resumeText}\n\n` : ''}Generate a strong, concise model answer to the interview question below.
- Use clear structure (2-4 paragraphs max)
- Be specific with examples where relevant
- Sound natural and conversational, not robotic
- Keep it under 200 words`

    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Interview question: ${question}` }],
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Answer generation error:', err)
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
  }
}
