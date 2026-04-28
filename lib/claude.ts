import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export type Message = { role: 'user' | 'assistant'; content: string }

export type Topic = 'ai' | 'backend' | 'frontend' | 'general'

const TOPIC_CONTEXT: Record<Topic, string> = {
  ai: 'Focus on machine learning, LLMs, neural networks, RAG, embeddings, prompt engineering, AI system design, and MLOps.',
  backend: 'Focus on REST/GraphQL APIs, databases, caching, system design, microservices, authentication, and server performance.',
  frontend: 'Focus on React, TypeScript, state management, performance optimization, accessibility, CSS, and browser APIs.',
  general: 'Cover a mix of software engineering fundamentals, problem-solving, system design, and behavioral questions.',
}

export async function getInterviewerResponse(
  messages: Message[],
  topic: Topic,
  resumeText: string | null,
  isFirstMessage: boolean
): Promise<string> {
  const systemPrompt = `You are a senior software engineer conducting a technical mock interview.

Topic focus: ${TOPIC_CONTEXT[topic]}

${resumeText ? `Candidate resume:\n${resumeText}\n\nTailor your questions to their experience level and background.` : ''}

Rules:
- Ask one clear, focused question at a time
- Keep responses concise (2-4 sentences max)
- After the candidate answers, give brief feedback (1 sentence), then ask the next question
- Start ${isFirstMessage ? 'with a warm welcome and your first question' : 'with brief feedback on the previous answer, then ask the next question'}
- Be encouraging but realistic
- Vary question difficulty naturally`

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemPrompt,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
