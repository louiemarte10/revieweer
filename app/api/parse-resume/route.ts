import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { text } = await pdfParse(buffer)

    return NextResponse.json({ text: text.slice(0, 4000) })
  } catch (err) {
    console.error('Resume parse error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
