# Revieweer — Setup Guide

AI-powered voice-to-voice mock interview platform built with Next.js, Claude, Groq Whisper, and ElevenLabs.

## How It Works

```
Your mic → Groq Whisper (speech-to-text) → Claude AI (interviewer response) → ElevenLabs (text-to-speech) → You hear the question
```

## Prerequisites

- Node.js 20+
- Accounts for: [Anthropic](https://console.anthropic.com), [Groq](https://console.groq.com), [ElevenLabs](https://elevenlabs.io)

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/louiemarte10/revieweer.git
cd revieweer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com → API Keys
GROQ_API_KEY=gsk_...                # console.groq.com → API Keys (free tier)
ELEVENLABS_API_KEY=sk_...           # elevenlabs.io → Profile → API Key
ELEVENLABS_VOICE_ID=nPczCjzI2devNBz1zQrb   # default: Brian (change to any voice ID)
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — allow microphone access when prompted.

---

## Deploy to Vercel

### 1. Import the repo

Go to [vercel.com/new](https://vercel.com/new) → Import `louiemarte10/revieweer` → Framework: **Next.js** (auto-detected).

### 2. Add environment variables

In the Vercel project settings → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GROQ_API_KEY` | Your Groq API key |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | `nPczCjzI2devNBz1zQrb` (or your chosen voice) |

### 3. Deploy

Click **Deploy** — Vercel handles the rest. Your app will be live at `https://revieweer.vercel.app` (or your custom domain).

---

## API Keys — Where to Get Them

| Service | Purpose | Free Tier |
|---|---|---|
| [Anthropic](https://console.anthropic.com) | Claude AI — interviewer brain | Pay-per-token |
| [Groq](https://console.groq.com) | Whisper STT — transcribes your voice | Yes — generous free tier |
| [ElevenLabs](https://elevenlabs.io) | TTS — interviewer voice | Yes — 10k chars/month |

---

## Features

- **Voice-to-voice** — speak your answer, hear the next question
- **4 interview topics** — General, Frontend, Backend, AI/ML
- **Resume upload** — upload a PDF and Claude tailors questions to your background
- **Conversation transcript** — see the full interview history in real time

## Project Structure

```
app/
├── page.tsx                  ← Setup screen (topic + resume)
├── interview/page.tsx        ← Live interview session
└── api/
    ├── transcribe/route.ts   ← Groq Whisper STT
    ├── respond/route.ts      ← Claude AI response
    ├── speak/route.ts        ← ElevenLabs TTS
    └── parse-resume/route.ts ← PDF resume parser

components/
├── TopicSelector.tsx         ← Topic selection cards
├── ResumeUpload.tsx          ← PDF upload + parse trigger
├── VoiceRecorder.tsx         ← Mic recording + transcription
└── InterviewSession.tsx      ← Full interview loop

lib/
├── claude.ts                 ← Interviewer prompt + API call
├── groq.ts                   ← Whisper transcription
└── elevenlabs.ts             ← TTS audio generation
```

## Changing the Interviewer Voice

1. Go to [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library) and pick a voice
2. Copy the Voice ID
3. Update `ELEVENLABS_VOICE_ID` in your `.env.local` or Vercel environment variables
