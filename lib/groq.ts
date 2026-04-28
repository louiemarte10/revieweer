import Groq from 'groq-sdk'

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav'
  const file = new File([new Uint8Array(audioBuffer)], `audio.${ext}`, { type: mimeType })

  const transcription = await getClient().audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
    language: 'en',
  })

  return transcription.text.trim()
}
