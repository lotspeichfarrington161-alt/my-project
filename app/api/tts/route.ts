import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// MiMo-V2.5-TTS API Route（服务端中转，保护 API Key 不暴露到浏览器）
//
// 文档：https://platform.xiaomimimo.com/docs/zh-CN/usage-guide/speech-synthesis-v2.5
//
// 核心约定：
// - Endpoint：POST https://api.xiaomimimo.com/v1/chat/completions
// - Auth：Header `api-key: <KEY>`
// - 请求格式：OpenAI Chat Completions 格式
//   * messages[role=user].content = 风格指令（可选）
//   * messages[role=assistant].content = 要朗读的真实文本（必须）
//   * audio = { format: "wav" | "mp3" | "pcm16", voice: "voice_id" }
// - 响应：JSON，audio 数据在 choices[0].message.audio.data（base64）
// ============================================================================

const MIMO_API_URL = process.env.MIMO_TTS_URL ?? 'https://api.xiaomimimo.com/v1/chat/completions'
const MIMO_API_KEY = process.env.MIMO_TTS_API_KEY ?? ''
const MIMO_MODEL = process.env.MIMO_TTS_MODEL ?? 'mimo-v2.5-tts'
const MIMO_DEFAULT_VOICE = process.env.MIMO_TTS_VOICE ?? '冰糖'

interface TTSRequestBody {
  text: string
  voice?: string
  styleInstruction?: string  // 可选的风格指令
  format?: 'wav' | 'mp3' | 'pcm16'
}

interface MimoCompletionResponse {
  choices?: Array<{
    message?: {
      audio?: {
        data?: string  // base64 编码的音频
      }
    }
  }>
  error?: { message?: string; type?: string }
}

export async function POST(request: NextRequest) {
  if (!MIMO_API_KEY) {
    return NextResponse.json(
      { error: 'MIMO_TTS_API_KEY 未配置。请在 .env.local 填入你的 MiMo API Key。' },
      { status: 500 }
    )
  }

  let body: TTSRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text, voice, styleInstruction, format = 'wav' } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text 不能为空' }, { status: 400 })
  }

  try {
    // 构造 messages：assistant 放真实文本，user 放可选风格指令
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (styleInstruction?.trim()) {
      messages.push({ role: 'user', content: styleInstruction })
    }
    messages.push({ role: 'assistant', content: text })

    const upstream = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MIMO_API_KEY,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages,
        audio: {
          format,
          voice: voice ?? MIMO_DEFAULT_VOICE,
        },
      }),
    })

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => '')
      return NextResponse.json(
        { error: `MiMo upstream error: ${upstream.status} ${errorText}` },
        { status: upstream.status }
      )
    }

    const json: MimoCompletionResponse = await upstream.json()
    const base64 = json?.choices?.[0]?.message?.audio?.data

    if (!base64) {
      return NextResponse.json(
        { error: 'MiMo 响应中未找到音频数据', payload: json },
        { status: 502 }
      )
    }

    const audioBuffer = Buffer.from(base64, 'base64')
    const contentType =
      format === 'wav' ? 'audio/wav' :
      format === 'mp3' ? 'audio/mpeg' :
      'audio/pcm'

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ error: `TTS proxy failed: ${msg}` }, { status: 500 })
  }
}
