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

    // Try different possible endpoint paths
    const possibleEndpoints = [
      `/servers/${serverId}/status`,
      `/api/servers/${serverId}/status`,
      `/api/v1/servers/${serverId}/status`,
      `/v1/servers/${serverId}/status`,
      `/server/${serverId}/status`,  // Try singular form too
      `/api/server/${serverId}/status`,
      `/api/v1/server/${serverId}/status`,
      `/v1/server/${serverId}/status`
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
          console.log(`Successfully found server status at: ${backendUrl}${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to fetch from ${endpoint}:`, error);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Backend server status fetch failed. Tried ${possibleEndpoints.length} different endpoints`);
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