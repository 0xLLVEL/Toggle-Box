import { NextResponse } from 'next/server';
import { getManifest, FALLBACK_MANIFEST } from '@/services/providerRunner';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customRepoUrl = searchParams.get('repoUrl') || undefined;

    const manifest = await getManifest(customRepoUrl);
    return NextResponse.json(manifest);
  } catch (error: any) {
    console.error('Manifest fetch error:', error);
    return NextResponse.json(FALLBACK_MANIFEST, { status: 200 });
  }
}
