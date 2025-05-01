import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL;
    const apiKey = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_API_KEY;

    if (!backendUrl || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(`${backendUrl}/servers/${serverId}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend server status fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server status from backend' },
      { status: 500 }
    );
  }
} 