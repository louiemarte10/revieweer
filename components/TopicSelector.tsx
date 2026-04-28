'use client'

import { Topic } from '@/lib/claude'

const TOPICS: { id: Topic; label: string; icon: string; description: string }[] = [
  { id: 'general', label: 'General', icon: '💼', description: 'Software engineering fundamentals & behavioral' },
  { id: 'frontend', label: 'Frontend', icon: '🎨', description: 'React, TypeScript, CSS & browser APIs' },
  { id: 'backend', label: 'Backend', icon: '⚙️', description: 'APIs, databases, system design & DevOps' },
  { id: 'ai', label: 'AI / ML', icon: '🤖', description: 'LLMs, ML systems, RAG & AI engineering' },
]

interface Props {
  selected: Topic
  onChange: (topic: Topic) => void
}

export default function TopicSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TOPICS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`p-4 rounded-xl border text-left transition-all ${
            selected === t.id
              ? 'border-violet-500 bg-violet-500/10 text-white'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
          }`}
        >
          <div className="text-2xl mb-1">{t.icon}</div>
          <div className="font-semibold text-sm">{t.label}</div>
          <div className="text-xs mt-0.5 opacity-70">{t.description}</div>
        </button>
      ))}
    </div>
  )
}
