import { NextRequest, NextResponse } from 'next/server'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
const UNSPLASH_API = 'https://api.unsplash.com'

// 回退图片：按关键词预配，Unsplash失败时使用
const FALLBACK_IMAGES: Record<string, string> = {
  'Yunnan': 'https://images.unsplash.com/photo-1582636274871-f31ecd50d4fb?w=800',
  'Sanya': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800',
  'Chengdu': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
  'Hangzhou': 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=800',
  'Xian': 'https://images.unsplash.com/photo-1608037521277-154cd1b89191?w=800',
  'Beijing': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
  'Shanghai': 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800',
  'Guilin': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'default': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') ?? 'China travel scenic'

  if (!UNSPLASH_ACCESS_KEY) {
    return NextResponse.json({
      url: getFallback(query),
      source: 'fallback',
    })
  }

  try {
    const res = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)

    const data = await res.json()
    const photos = data.results as Array<{ urls: { regular: string } }>

    if (!photos || photos.length === 0) {
      return NextResponse.json({ url: getFallback(query), source: 'fallback' })
    }

    const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 3))
    return NextResponse.json({
      url: photos[randomIndex].urls.regular,
      source: 'unsplash',
    })
  } catch {
    return NextResponse.json({ url: getFallback(query), source: 'fallback' })
  }
}

function getFallback(query: string): string {
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (query.toLowerCase().includes(key.toLowerCase())) return url
  }
  return FALLBACK_IMAGES.default
}
