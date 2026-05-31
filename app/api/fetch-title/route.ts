import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const data = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    return NextResponse.json({ title: data.title ?? null, author: data.author_name ?? null, thumbnail: data.thumbnail_url ?? null });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
