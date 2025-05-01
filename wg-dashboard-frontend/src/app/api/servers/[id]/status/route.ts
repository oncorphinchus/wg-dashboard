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

    console.log(`Attempting to fetch status for server ID: ${serverId}`);

    // Prioritize the correct endpoint based on our backend implementation
    // then try fallbacks if needed
    const possibleEndpoints = [
      `/api/servers/${serverId}/status`,  // This is now the primary endpoint
      `/servers/${serverId}/status`,
      `/servers-status/${serverId}`,
      `/api/v1/servers/${serverId}/status`,
      `/v1/servers/${serverId}/status`,
      `/server/${serverId}/status`,
      `/api/server/${serverId}/status`,
      `/api/v1/server/${serverId}/status`,
      `/v1/server/${serverId}/status`
    ];

    let response;
    let endpointUsed;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying status endpoint: ${backendUrl}${endpoint}`);
        response = await fetch(`${backendUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          cache: 'no-store',
        });
        
        console.log(`Status fetch from ${backendUrl}${endpoint}, status: ${response?.status}`);
        
        if (response.ok) {
          endpointUsed = endpoint;
          console.log(`Successfully found server status at: ${backendUrl}${endpoint}`);
          break;
        } else {
          // Try to get error details
          try {
            const errorText = await response.text();
            console.log(`Error from ${endpoint}:`, errorText);
          } catch (e) {
            console.log(`Could not read error response from ${endpoint}`);
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${endpoint}:`, error);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Server status fetch failed. Tried ${possibleEndpoints.length} different endpoints`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Server status fetch error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch server status from backend' },
      { status: 500 }
    );
  }
} 