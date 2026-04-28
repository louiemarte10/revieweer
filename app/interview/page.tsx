'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import InterviewSession from '@/components/InterviewSession'
import { Topic } from '@/lib/claude'

function InterviewPage() {
  const router = useRouter()
  const params = useSearchParams()
  const topic = (params.get('topic') || 'general') as Topic
  const resumeText = params.get('resume')

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <InterviewSession
        topic={topic}
        resumeText={resumeText}
        onEnd={() => router.push('/')}
      />
    </main>
  )
}

export default function Page() {
  return (
    <Suspense>
      <InterviewPage />
    </Suspense>
  )
}
