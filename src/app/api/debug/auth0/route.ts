// Debug endpoint to check Auth0 configuration
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const domain = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    
    const urls = {
      original: domain,
      withHttps: domain?.startsWith('http') ? domain : `https://${domain}`,
    };

    let urlValid = false;
    let parsedUrl = null;
    try {
      if (urls.withHttps) {
        parsedUrl = new URL(urls.withHttps);
        urlValid = true;
      }
    } catch (e) {
      urlValid = false;
    }

    return NextResponse.json({
      domain,
      clientIdSet: !!clientId,
      urls,
      urlValid,
      parsedUrl: parsedUrl ? {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
