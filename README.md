# Revieweer

> AI-powered voice-to-voice mock interview platform

Revieweer simulates a real technical interview — an AI interviewer speaks questions out loud, listens to your spoken answers, and responds with follow-up questions tailored to your background. Upload your resume and pick a topic to get started.

---

## Demo Flow

```
You select a topic (Frontend / Backend / AI / General)
        ↓
Optionally upload your resume (PDF)
        ↓
AI interviewer speaks the first question (ElevenLabs TTS)
        ↓
You tap the mic and speak your answer
        ↓
Your voice is transcribed (Groq Whisper)
        ↓
Claude reads the transcript + conversation history → generates next question
        ↓
Repeat until you end the session
```

---

## Features

| Feature | Description |
|---|---|
| 🎙 Voice-to-voice | Speak your answers, hear questions out loud |
| 🧠 AI interviewer | Powered by Claude — adapts to your answers |
| 📄 Resume upload | PDF parsed and injected as context for tailored questions |
| 🎯 Topic selector | General, Frontend, Backend, AI/ML |
| 📝 Live transcript | Full conversation shown in real time |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Interviewer | Anthropic Claude (`claude-sonnet-4-6`) |
| Speech-to-Text | Groq Whisper (`whisper-large-v3-turbo`) |
| Text-to-Speech | ElevenLabs (`eleven_turbo_v2_5`) |
| Resume Parsing | `pdf-parse` |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## How It Was Built — Step by Step

### Step 1 — Project Bootstrap

Created a Next.js 16 app with TypeScript and Tailwind:

```bash
npx create-next-app@latest revieweer --typescript --tailwind --app
```

Added the core dependencies:

```bash
npm install @anthropic-ai/sdk groq-sdk pdf-parse
```

---

### Step 2 — AI Interviewer Brain (`lib/claude.ts`)

Defined a `getInterviewerResponse()` function that:

- Accepts the full conversation history (`messages[]`), the selected topic, and optional resume text
- Builds a system prompt instructing Claude to act as a senior engineer conducting a technical interview
- Injects the resume text and topic focus into the prompt so questions are personalized
- Calls `claude-sonnet-4-6` with `max_tokens: 300` to keep answers short and conversational
- Returns the interviewer's next question/feedback as a plain string

Topic-specific focus areas are mapped in `TOPIC_CONTEXT`:

```
general  → fundamentals, system design, behavioral
frontend → React, TypeScript, CSS, browser APIs
backend  → APIs, databases, caching, microservices
ai       → LLMs, RAG, embeddings, MLOps
```

---

### Step 3 — Speech-to-Text (`lib/groq.ts`)

Created a `transcribeAudio()` function that:

- Accepts a raw audio `Buffer` and MIME type from the browser (`audio/webm` or `audio/mp4`)
- Wraps the buffer in a `File` object (required by the Groq SDK)
- Calls `whisper-large-v3-turbo` via the Groq API
- Returns the transcribed text string

Groq was chosen over OpenAI Whisper for its free tier and significantly faster response times (~300ms vs ~1-2s).

---

### Step 4 — Text-to-Speech (`lib/elevenlabs.ts`)

Created a `textToSpeech()` function that:

- Calls the ElevenLabs REST API with the interviewer's text
- Uses `eleven_turbo_v2_5` model for low latency
- Returns a raw `Buffer` of MP3 audio bytes
- Voice ID is configurable via `ELEVENLABS_VOICE_ID` env variable (default: Brian)

---

### Step 5 — API Routes (`app/api/`)

Four Next.js Route Handlers connect the frontend to the AI services:

| Route | Method | What it does |
|---|---|---|
| `/api/transcribe` | POST | Receives `FormData` audio file → returns `{ text }` via Groq Whisper |
| `/api/respond` | POST | Receives `{ messages, topic, resumeText }` → returns `{ response }` via Claude |
| `/api/speak` | POST | Receives `{ text }` → returns raw MP3 audio bytes via ElevenLabs |
| `/api/parse-resume` | POST | Receives PDF `FormData` → returns `{ text }` (first 4000 chars) via pdf-parse |

All routes are serverless functions. `vercel.json` sets a 30-second timeout on each to handle AI latency.

---

### Step 6 — Voice Recorder Component (`components/VoiceRecorder.tsx`)

Built a mic button component that:

1. Requests microphone access via `navigator.mediaDevices.getUserMedia()`
2. Records audio using the browser's `MediaRecorder` API (`audio/webm` preferred, fallback `audio/mp4`)
3. On stop, collects audio chunks into a `Blob` and posts it to `/api/transcribe`
4. Returns the transcript string to the parent via `onTranscript` callback
5. Shows three states visually: idle (tap to record), recording (pulsing red), transcribing (spinner)

---

### Step 7 — Resume Upload Component (`components/ResumeUpload.tsx`)

Built a file upload component that:

1. Accepts `.pdf` files via a hidden `<input type="file">`
2. Posts the file to `/api/parse-resume` as `FormData`
3. Returns the extracted text to the parent via `onParsed` callback
4. Shows status: idle → parsing → done / error

---

### Step 8 — Topic Selector (`components/TopicSelector.tsx`)

A 2×2 grid of clickable cards, one per topic. Each card shows an icon, label, and one-line description. Selected card is highlighted in violet. Passes the selected `Topic` type back to the parent.

---

### Step 9 — Interview Session (`components/InterviewSession.tsx`)

The core interview loop component:

1. On mount, calls `askAI()` with an empty message history (triggers the first question)
2. `askAI()` posts to `/api/respond` → gets Claude's text → appends to messages → calls `speakText()`
3. `speakText()` posts to `/api/speak` → gets MP3 blob → plays it via `new Audio(url)` → resolves when audio ends
4. After AI finishes speaking, `VoiceRecorder` is unlocked for the user to answer
5. User's transcript is appended to messages and `askAI()` is called again
6. Conversation scrolls to bottom on each new message
7. A status bar shows: "Thinking..." → "Speaking..." → "Your turn"

---

### Step 10 — Pages

**`app/page.tsx` — Setup Screen**
- Renders `TopicSelector` and `ResumeUpload`
- On "Start Interview", encodes topic and resume text as URL search params
- Navigates to `/interview?topic=...&resume=...`

**`app/interview/page.tsx` — Interview Screen**
- Reads `topic` and `resume` from URL params via `useSearchParams()`
- Renders `InterviewSession` full-screen
- "End Interview" button navigates back to `/`

---

### Step 11 — Vercel Configuration

`vercel.json` sets 30-second function timeouts on all API routes to handle AI response latency:

```json
{
  "functions": {
    "app/api/respond/route.ts": { "maxDuration": 30 },
    "app/api/speak/route.ts":   { "maxDuration": 30 },
    "app/api/transcribe/route.ts": { "maxDuration": 30 },
    "app/api/parse-resume/route.ts": { "maxDuration": 15 }
  }
}
```

`next.config.ts` marks `pdf-parse` as a server-external package so it is not bundled incorrectly by Turbopack.

---

## Project Structure

```
revieweer/
├── app/
│   ├── layout.tsx                  ← Root layout and metadata
│   ├── page.tsx                    ← Setup screen (topic + resume)
│   ├── interview/
│   │   └── page.tsx                ← Live interview session
│   └── api/
│       ├── transcribe/route.ts     ← Groq Whisper STT
│       ├── respond/route.ts        ← Claude AI response
│       ├── speak/route.ts          ← ElevenLabs TTS
│       └── parse-resume/route.ts   ← PDF resume parser
├── components/
│   ├── TopicSelector.tsx           ← Topic selection cards
│   ├── ResumeUpload.tsx            ← PDF upload + parse trigger
│   ├── VoiceRecorder.tsx           ← Mic recording + transcription
│   └── InterviewSession.tsx        ← Full interview loop
├── lib/
│   ├── claude.ts                   ← Interviewer prompt + API call
│   ├── groq.ts                     ← Whisper transcription
│   └── elevenlabs.ts               ← TTS audio generation
├── .env.local.example              ← Environment variable template
├── vercel.json                     ← Vercel function timeout config
└── SETUP.md                        ← Deployment guide
```

---

## Quick Start

```bash
git clone https://github.com/louiemarte10/revieweer.git
cd revieweer
npm install
cp .env.local.example .env.local   # fill in your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — allow microphone access when prompted.

See [SETUP.md](./SETUP.md) for full environment setup and Vercel deployment instructions.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key — [console.anthropic.com](https://console.anthropic.com) |
| `GROQ_API_KEY` | Yes | Groq Whisper key — [console.groq.com](https://console.groq.com) (free) |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs TTS key — [elevenlabs.io](https://elevenlabs.io) |
| `ELEVENLABS_VOICE_ID` | No | Voice ID (default: Brian `nPczCjzI2devNBz1zQrb`) |

---

## Author

**Louie Marte** — [@louiemarte10](https://github.com/louiemarte10)
