'use client'

import { useRef, useState } from 'react'

interface Props {
  onTranscript: (text: string) => void
  disabled: boolean
}

export default function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  async function startRecording() {
    if (state !== 'idle' || disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })

      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        setState('processing')

        const blob = new Blob(chunksRef.current, { type: mimeType })
        const form = new FormData()
        form.append('audio', blob, 'audio.webm')

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (data.text) onTranscript(data.text)
        } catch {
          /* ignore */
        } finally {
          setState('idle')
        }
      }

      mediaRef.current = recorder
      recorder.start()
      setState('recording')
    } catch {
      // mic permission denied
      setState('idle')
    }
  }

  function stopRecording() {
    if (mediaRef.current && mediaRef.current.state === 'recording') {
      mediaRef.current.stop()
    }
  }

  // Prevent context menu on long press (mobile)
  function handleContextMenu(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
  }

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Push-to-talk button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording() }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
        onContextMenu={handleContextMenu}
        disabled={disabled || isProcessing}
        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-xl select-none
          ${isRecording
            ? 'bg-red-500 scale-110 shadow-red-500/40 ring-4 ring-red-400/50'
            : isProcessing
            ? 'bg-gray-600 cursor-not-allowed opacity-70'
            : disabled
            ? 'bg-gray-700 cursor-not-allowed opacity-40'
            : 'bg-violet-600 hover:bg-violet-500 active:scale-110 active:bg-red-500 cursor-pointer shadow-violet-500/30'
          }`}
      >
        <span className="text-3xl pointer-events-none">
          {isProcessing ? '⏳' : '🎙'}
        </span>
        {isRecording && (
          <span className="text-[10px] text-white/80 font-medium pointer-events-none animate-pulse">
            RELEASE
          </span>
        )}
      </button>

      {/* Status label */}
      <p className="text-sm text-gray-400 text-center">
        {isRecording
          ? 'Recording... release to send'
          : isProcessing
          ? 'Transcribing your answer...'
          : disabled
          ? 'Wait for interviewer to finish...'
          : 'Hold to speak your answer'}
      </p>

      {/* Visual recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 16}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
