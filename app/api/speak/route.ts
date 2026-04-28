import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/elevenlabs'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string }
    if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 })

    const audioBuffer = await textToSpeech(text)
    return new NextResponse(audioBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Speak error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
