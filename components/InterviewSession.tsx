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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    askAI([], true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function askAI(currentMessages: Message[], isFirst: boolean) {
    setAiSpeaking(true)
    setStatus('Interviewer is thinking...')

    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, topic, resumeText, isFirstMessage: isFirst }),
      })
      const data = await res.json()
      const aiText: string = data.response

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
    await askAI(updated, false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${aiSpeaking ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-sm text-gray-300">{status}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Turn {turnCount}</span>
          <button onClick={onEnd} className="text-xs text-gray-500 hover:text-red-400 transition-colors">End Interview</button>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        <div ref={bottomRef} />
      </div>

      {/* Recorder */}
      <div className="p-6 border-t border-white/10">
        <VoiceRecorder onTranscript={handleTranscript} disabled={aiSpeaking} />
      </div>
    </div>
  )
}
