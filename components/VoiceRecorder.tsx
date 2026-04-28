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

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const recorder = new MediaRecorder(stream, { mimeType })

    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
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
  }

  function stopRecording() {
    mediaRef.current?.stop()
  }

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
            : isProcessing
            ? 'bg-gray-600 cursor-not-allowed'
            : disabled
            ? 'bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-violet-600 hover:bg-violet-500 hover:scale-105'
          }`}
      >
        {isRecording ? '⏹' : isProcessing ? '⏳' : '🎙'}
      </button>
      <p className="text-sm text-gray-400">
        {isRecording ? 'Recording... tap to stop' : isProcessing ? 'Transcribing...' : disabled ? 'Wait for interviewer...' : 'Tap to answer'}
      </p>
    </div>
  )
}
