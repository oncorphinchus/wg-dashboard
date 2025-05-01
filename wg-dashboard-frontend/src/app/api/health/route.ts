import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL;
    const apiKey = process.env.MANAGEMENT_BACKEND_API_KEY;

    if (!backendUrl || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(`${backendUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check backend health' },
      { status: 500 }
    );
  }
} 