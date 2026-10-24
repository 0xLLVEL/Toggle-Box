import { NextResponse } from 'next/server';
import { executeProviderMethod } from '@/services/providerRunner';

export async function POST(request: Request) {
  let providerId: string | undefined;
  let method: string | undefined;

  try {
    const body = await request.json();
    ({ providerId, method } = body);
    const { args = [], repoUrl } = body;

    if (!providerId || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: providerId and method' },
        { status: 400 }
      );
    }

    const result = await executeProviderMethod(providerId, method, args, repoUrl);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const msg: string = error?.message || 'Execution failed';

    // Provider-level errors (e.g. "no download links", "no playable links resolved",
    // search returned nothing, timeout) are expected outcomes — the provider ran but
    // found no results. Return 200 so the client's success-check handles it cleanly
    // and we don't flood the server console with 500s for routine failures.
    //
    // Only use 500 for infrastructure problems (request body unparseable, etc.) where
    // we couldn't even identify which provider/method to call.
    const isInfraError = !providerId || !method;
    const status = isInfraError ? 500 : 200;

    if (isInfraError) {
      console.error('Provider execute – infrastructure error:', msg);
    }
    // Provider-level failures are intentionally not logged server-side at error
    // level; the client logs them via resolveProviderStream's catch block.

    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
