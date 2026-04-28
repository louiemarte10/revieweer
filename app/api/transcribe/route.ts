import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    const buffer = Buffer.from(await audio.arrayBuffer())
    const text = await transcribeAudio(buffer, audio.type)

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
