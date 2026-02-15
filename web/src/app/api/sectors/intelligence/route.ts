// Cultivo Vision - Sector Intelligence API
import { NextResponse } from 'next/server';
import { getAllSectorsWithRisk } from '@/lib/sector-intelligence';

export async function GET() {
  try {
    const result = await getAllSectorsWithRisk();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sector Intelligence API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error calculando inteligencia por sector', details: message },
      { status: 500 }
    );
  }
}
