import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL;
    const apiKey = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_API_KEY;

    if (!backendUrl || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(`${backendUrl}/servers`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend servers fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Servers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers from backend' },
      { status: 500 }
    );
  }
} 