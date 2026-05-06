import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// LLM 服务端代理（保护 API Key）
//
// 默认走 SiliconFlow，但端点 URL 可通过环境变量替换为任意 OpenAI 兼容服务。
// 客户端把 messages 等参数 POST 过来，本路由透传到上游 LLM。
// ============================================================================

const LLM_API_URL = process.env.LLM_API_URL ?? 'https://api.siliconflow.cn/v1/chat/completions'
const LLM_API_KEY = process.env.LLM_API_KEY ?? ''

export async function POST(request: NextRequest) {
  if (!LLM_API_KEY) {
    return NextResponse.json(
      { error: 'LLM_API_KEY 未配置。请在 .env.local 填入你的 SiliconFlow API Key。' },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const upstream = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const text = await upstream.text()
    if (!upstream.ok) {
      return new NextResponse(text || JSON.stringify({ error: `LLM upstream error ${upstream.status}` }), {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
      })
    }
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ error: `LLM proxy failed: ${msg}` }, { status: 500 })
  }
}
