import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: object) => { load: (buf: Buffer) => Promise<{ text: string }> } }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({})
    const parsed = await parser.load(buffer)
    const text = (parsed.text ?? '').slice(0, 4000)

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Resume parse error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
