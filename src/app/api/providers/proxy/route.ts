import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const headersParam = searchParams.get('headers');

    if (!targetUrl) {
      return new NextResponse('Missing target URL', { status: 400 });
    }

    let parsedHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: '*/*',
    };

    if (headersParam) {
      try {
        parsedHeaders = { ...parsedHeaders, ...JSON.parse(headersParam) };
      } catch (e) {
        // Ignore parse error
      }
    }

    const res = await fetch(targetUrl, {
      headers: parsedHeaders,
    });

    if (!res.ok) {
      return new NextResponse(`Upstream failed with status ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    const isM3U8 =
      targetUrl.includes('.m3u8') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl');

    if (isM3U8) {
      const text = await res.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Rewrite segment URLs in the playlist to pass through this proxy
      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) {
            return line;
          }
          // Resolve relative or absolute URL
          let fullUrl = trimmed;
          if (!trimmed.startsWith('http')) {
            fullUrl = new URL(trimmed, baseUrl).toString();
          }
          // Wrap with proxy
          return `/api/providers/proxy?url=${encodeURIComponent(fullUrl)}&headers=${encodeURIComponent(
            JSON.stringify(parsedHeaders)
          )}`;
        })
        .join('\n');

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For video ts segments or binary chunks, stream arrayBuffer
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Stream proxy error:', error);
    return new NextResponse('Stream proxy failed', { status: 502 });
  }
}
