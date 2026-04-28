'use client'

import { useRef, useState } from 'react'

interface Props {
  onParsed: (text: string) => void
}

export default function ResumeUpload({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [fileName, setFileName] = useState('')

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setStatus('error')
      return
    }
    setFileName(file.name)
    setStatus('parsing')

    const form = new FormData()
    form.append('resume', file)

    try {
      const res = await fetch('/api/parse-resume', { method: 'POST', body: form })
      const data = await res.json()
      if (data.text) {
        onParsed(data.text)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className={`w-full p-4 rounded-xl border border-dashed transition-all text-sm ${
          status === 'done'
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
            : status === 'error'
            ? 'border-red-500 bg-red-500/10 text-red-400'
            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
        }`}
      >
        {status === 'idle' && '📄 Upload Resume (PDF) — optional'}
        {status === 'parsing' && '⏳ Parsing resume...'}
        {status === 'done' && `✓ ${fileName} — resume loaded`}
        {status === 'error' && '✕ Failed. Please upload a valid PDF.'}
      </button>
    </div>
  )
}
