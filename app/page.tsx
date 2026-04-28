'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopicSelector from '@/components/TopicSelector'
import ResumeUpload from '@/components/ResumeUpload'
import { Topic } from '@/lib/claude'

export default function Home() {
  const router = useRouter()
  const [topic, setTopic] = useState<Topic>('general')
  const [resumeText, setResumeText] = useState<string | null>(null)

  function startInterview() {
    const params = new URLSearchParams({ topic })
    if (resumeText) params.set('resume', resumeText)
    router.push(`/interview?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Review<span className="text-violet-400">eer</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">AI-powered mock interviews, voice to voice</p>
        </div>

        {/* Topic */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Interview Topic
          </label>
          <TopicSelector selected={topic} onChange={setTopic} />
        </div>

        {/* Resume */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Resume
          </label>
          <ResumeUpload onParsed={setResumeText} />
          {resumeText && (
            <p className="text-xs text-emerald-400">
              ✓ Resume loaded — questions will be tailored to your background
            </p>
          )}
        </div>

        {/* Start */}
        <button
          onClick={startInterview}
          className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-900/40"
        >
          Start Interview →
        </button>

        <p className="text-center text-xs text-gray-600">
          Allow microphone access when prompted
        </p>
      </div>
    </main>
  )
}
