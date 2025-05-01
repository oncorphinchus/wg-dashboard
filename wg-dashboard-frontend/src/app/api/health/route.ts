import { NextResponse } from 'next/server';
import { checkHealth } from '@/lib/serverApi';

export async function GET() {
  try {
    const data = await checkHealth();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check backend health' },
      { status: 500 }
    );
  }
} 