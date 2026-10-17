import { NextResponse } from 'next/server';
import type { ProviderVideoSource } from '@/types/provider';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId');
  const type = searchParams.get('type') || 'movie';
  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';

  if (!tmdbId) {
    return NextResponse.json({ sources: [] });
  }

  const isTv = type === 'tv';

  const servers: ProviderVideoSource[] = [
    {
      url: isTv
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`,
      quality: '1080p',
      container: 'iframe',
      providerId: 'vidsrc',
      providerName: 'VidSrc Alpha',
      isFallback: true,
    },
    {
      url: isTv
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`,
      quality: 'Auto',
      container: 'iframe',
      providerId: 'vidlink',
      providerName: 'VidLink Ultra',
      isFallback: true,
    },
    {
      url: isTv
        ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${tmdbId}`,
      quality: 'HD',
      container: 'iframe',
      providerId: 'autoembed',
      providerName: 'AutoEmbed Fast',
      isFallback: true,
    },
    {
      url: isTv
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
      quality: 'Multi',
      container: 'iframe',
      providerId: 'superembed',
      providerName: 'SuperEmbed Pro',
      isFallback: true,
    },
    {
      url: isTv
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${tmdbId}`,
      quality: '720p',
      container: 'iframe',
      providerId: 'twoembed',
      providerName: '2Embed Mirror',
      isFallback: true,
    },
  ];

  return NextResponse.json({ sources: servers });
}
