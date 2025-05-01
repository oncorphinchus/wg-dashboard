import { ServerConfig } from '@/types/wireguard';

const API_URL = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_URL;
const API_KEY = process.env.NEXT_PUBLIC_MANAGEMENT_BACKEND_API_KEY;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_MANAGEMENT_BACKEND_URL is not defined');
}

if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_MANAGEMENT_BACKEND_API_KEY is not defined');
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Options to help with self-signed certificates
export const fetchOptions = {
  headers,
  // These options help with handling requests in Next.js
  cache: 'no-store' as const,
  next: { 
    revalidate: 0,
  },
};

// Helper function to handle SSL errors
async function fetchWithSSLHandling(url: string, options = {}) {
  try {
    // First try the normal request
    const response = await fetch(url, { ...fetchOptions, ...options });
    return response;
  } catch (error: any) {
    // If we get an SSL error (typical with self-signed certs)
    // and we're running in a browser, show a more helpful message
    if (typeof window !== 'undefined' && 
        (error.message?.includes('certificate') || 
         error.cause?.code === 'DEPTH_ZERO_SELF_SIGNED_CERT')) {
      console.error('SSL Certificate Error:', error);
      throw new Error(
        'SSL certificate validation failed. The backend uses a self-signed certificate. ' +
        'Please make sure your browser trusts this certificate.'
      );
    }
    throw error;
  }
}

export async function getServers(): Promise<ServerConfig[]> {
  try {
    const response = await fetchWithSSLHandling(`${API_URL}/servers`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch servers: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching servers:', error);
    throw error;
  }
}

export async function getServerStatus(serverId: string) {
  try {
    const response = await fetchWithSSLHandling(`${API_URL}/servers/${serverId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch server status: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching status for server ${serverId}:`, error);
    throw error;
  }
}

export async function checkHealth() {
  try {
    const response = await fetchWithSSLHandling(`${API_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
} 