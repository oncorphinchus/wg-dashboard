import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL;
    const apiKey = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_API_KEY;

    if (!backendUrl || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    // Try different possible endpoint paths
    const possibleEndpoints = [
      '/servers',
      '/api/servers',
      '/api/v1/servers',
      '/v1/servers'
    ];

    let response;
    let endpointUsed;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${backendUrl}${endpoint}`);
        response = await fetch(`${backendUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          endpointUsed = endpoint;
          console.log(`Successfully found servers at: ${backendUrl}${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to fetch from ${endpoint}:`, error);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Backend servers fetch failed. Tried ${possibleEndpoints.length} different endpoints`);
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