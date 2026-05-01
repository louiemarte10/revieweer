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
  const [aiThinking, setAiThinking] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [status, setStatus] = useState<string>('Starting interview...')
  const [turnCount, setTurnCount] = useState(0)

  // Current question
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionReady, setQuestionReady] = useState(false)

  // AI model answer
  const [modelAnswer, setModelAnswer] = useState<string>('')
  const [generatingAnswer, setGeneratingAnswer] = useState(false)

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobUrl = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    askAI([], true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, modelAnswer, questionReady])

  async function askAI(currentMessages: Message[], isFirst: boolean) {
    setAiThinking(true)
    setQuestionReady(false)
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

      // Pre-fetch the audio so it's ready when user clicks Listen
      await prefetchAudio(aiText)

      setQuestionReady(true)
      setStatus('Question ready — click Listen to hear it')
    } catch {
      setStatus('Error — please try again')
    } finally {
      setAiThinking(false)
    }
  }

  async function prefetchAudio(text: string) {
    try {
      // Clean up previous blob
      if (audioBlobUrl.current) {
        URL.revokeObjectURL(audioBlobUrl.current)
        audioBlobUrl.current = null
      }
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      audioBlobUrl.current = URL.createObjectURL(blob)
    } catch {
      // TTS unavailable — text only mode
    }
  }

  function handleListen() {
    if (!audioBlobUrl.current) return
    const audio = new Audio(audioBlobUrl.current)
    audioRef.current = audio
    setIsPlaying(true)
    setStatus('Interviewer is speaking...')

    audio.onended = () => {
      setIsPlaying(false)
      setStatus('Your turn — answer or generate a model answer')
    }
    audio.onerror = () => {
      setIsPlaying(false)
      setStatus('Your turn')
    }
    audio.play()
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
    setStatus('Your turn — answer or generate a model answer')
  }

  async function handleTranscript(text: string) {
    const updated = [...messages, { role: 'user' as const, content: text }]
    setMessages(updated)
    setModelAnswer('')
    setQuestionReady(false)
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

  const isDisabled = aiThinking || isPlaying

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            aiThinking ? 'bg-yellow-400 animate-pulse' :
            isPlaying  ? 'bg-violet-400 animate-pulse' :
            questionReady ? 'bg-emerald-400' : 'bg-gray-500'
          }`} />
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

        {/* Thinking indicator */}
        {aiThinking && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-sm text-yellow-400">Interviewer is thinking...</span>
          </div>
        )}

        {/* Interviewer Question Box */}
        {currentQuestion && !aiThinking && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-violet-400 animate-pulse' : 'bg-violet-400'}`} />
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                  Interviewer Question
                </span>
              </div>
              <span className="text-xs text-gray-600">Turn {turnCount}</span>
            </div>

            <p className="text-gray-100 text-sm leading-relaxed">{currentQuestion}</p>

            {/* Listen / Stop + Generate Answer buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">

              {/* Listen / Stop toggle */}
              {!isPlaying ? (
                <button
                  onClick={handleListen}
                  disabled={!audioBlobUrl.current}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  <span>🔊</span> Listen
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all animate-pulse"
                >
                  <span>⏹</span> Stop
                </button>
              )}

              {/* Generate Answer */}
              {!isPlaying && (
                <button
                  onClick={generateModelAnswer}
                  disabled={generatingAnswer}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  {generatingAnswer ? (
                    <><span className="animate-spin">⏳</span> Generating...</>
                  ) : (
                    <><span>✨</span> Generate Answer</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Model Answer Box */}
        {modelAnswer && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              💡 AI Answer
            </span>
            <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-line">{modelAnswer}</p>
          </div>
        )}

        {/* Transcript */}
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
        <VoiceRecorder onTranscript={handleTranscript} disabled={isDisabled} />
      </div>

    </div>
  )
}
