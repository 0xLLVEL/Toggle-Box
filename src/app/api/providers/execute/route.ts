import { NextResponse } from 'next/server';
import { executeProviderMethod } from '@/services/providerRunner';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, method, args = [], repoUrl } = body;

    if (!providerId || !method) {
      return NextResponse.json(
        { error: 'Missing required parameters: providerId and method' },
        { status: 400 }
      );
    }

    const result = await executeProviderMethod(providerId, method, args, repoUrl);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Provider execution failed:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
