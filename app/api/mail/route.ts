import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://api.mail.tm';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '';
  
  const targetUrl = new URL(path, DOMAIN);
  
  // Forward other search params (except 'path')
  url.searchParams.forEach((value, key) => {
    if (key !== 'path') {
      targetUrl.searchParams.set(key, value);
    }
  });

  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('User-Agent', randomUA);
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  // Forward Authorization header if present
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const options: RequestInit = {
    method: request.method,
    headers,
    signal: AbortSignal.timeout(30000),
    // Ensure no caching on the fetch itself for mail updates
    cache: 'no-store'
  };

  if (request.method === 'POST') {
    options.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl.toString(), options);
    
    // Check if it's a JSON response before parsing
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // If we expected JSON but got something else, it's likely an error page from the provider
      if (!response.ok) {
        return NextResponse.json(
          { error: `Provider error (${response.status})`, details: text.substring(0, 500) },
          { status: response.status }
        );
      }
      // If it's 200 but not JSON, just return as text if possible, but mail.tm is JSON API
      return NextResponse.json({ data: text });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Mail service error: ${response.status}`, details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Mail Proxy Exception for', targetUrl.toString(), ':', error.message);
    
    // Detect timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Connection to mail provider timed out. Try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect to email provider.', details: error.message },
      { status: 500 }
    );
  }
}
