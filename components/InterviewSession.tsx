'use client'

import { useEffect, useRef, useState } from 'react'
import VoiceRecorder from './VoiceRecorder'
import { Topic } from '@/lib/claude'

type Message = { role: 'user' | 'assistant'; content: string }

interface Props {
  topic: Topic
  resumeText: string | null
  onEnd: () => void
}

export default function InterviewSession({ topic, resumeText, onEnd }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [status, setStatus] = useState<string>('Starting interview...')
  const [turnCount, setTurnCount] = useState(0)

  // Current question display
  const [currentQuestion, setCurrentQuestion] = useState<string>('')

  // AI model answer
  const [modelAnswer, setModelAnswer] = useState<string>('')
  const [generatingAnswer, setGeneratingAnswer] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    askAI([], true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, modelAnswer])

  async function askAI(currentMessages: Message[], isFirst: boolean) {
    setAiSpeaking(true)
    setModelAnswer('')
    setStatus('Interviewer is thinking...')

    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, topic, resumeText, isFirstMessage: isFirst }),
      })
      const data = await res.json()
      const aiText: string = data.response

      setCurrentQuestion(aiText)
      const updated = [...currentMessages, { role: 'assistant' as const, content: aiText }]
      setMessages(updated)
      setTurnCount((n) => n + 1)

      await speakText(aiText)
    } catch {
      setStatus('Error — please try again')
    } finally {
      setAiSpeaking(false)
      setStatus('Your turn')
    }
  }

  async function speakText(text: string) {
    setStatus('Interviewer is speaking...')
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve) => {
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => resolve()
        audio.play()
      })
    } catch {
      // TTS failed — continue without audio
    }
  }

  async function handleTranscript(text: string) {
    const updated = [...messages, { role: 'user' as const, content: text }]
    setMessages(updated)
    setModelAnswer('')
    await askAI(updated, false)
  }

  async function generateModelAnswer() {
    if (!currentQuestion || generatingAnswer) return
    setGeneratingAnswer(true)
    setModelAnswer('')
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion, topic, resumeText }),
      })
      const data = await res.json()
      if (data.answer) setModelAnswer(data.answer)
    } catch {
      setModelAnswer('Failed to generate answer. Please try again.')
    } finally {
      setGeneratingAnswer(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${aiSpeaking ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-sm text-gray-300">{status}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Turn {turnCount}</span>
          <button onClick={onEnd} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            End Interview
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Interviewer Question Box */}
        {currentQuestion && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${aiSpeaking ? 'bg-violet-400 animate-pulse' : 'bg-violet-400'}`} />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Interviewer Question
              </span>
            </div>
            <p className="text-gray-100 text-sm leading-relaxed">
              {currentQuestion}
            </p>

            {/* Generate Answer button */}
            {!aiSpeaking && (
              <button
                onClick={generateModelAnswer}
                disabled={generatingAnswer}
                className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
              >
                {generatingAnswer ? (
                  <>
                    <span className="animate-spin text-base">⏳</span>
                    Generating Answer...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Answer
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* AI Model Answer Box */}
        {modelAnswer && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                💡 AI Answer
              </span>
            </div>
            <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-line">
              {modelAnswer}
            </p>
          </div>
        )}

        {/* Conversation Transcript */}
        {messages.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">Transcript</p>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-gray-200 rounded-bl-sm'
                }`}>
                  {m.role === 'assistant' && (
                    <div className="text-xs text-violet-400 font-medium mb-1">Interviewer</div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Voice Recorder */}
      <div className="shrink-0 p-6 border-t border-white/10 bg-gray-950">
        <VoiceRecorder onTranscript={handleTranscript} disabled={aiSpeaking} />
      </div>

    </div>
  )
}
