// Cultivo Vision - Weekly Intelligence Report API
import { NextResponse } from 'next/server';
import { getWeeklyIntelligence } from '@/lib/pattern-analyzer';

export async function GET() {
  try {
    const intelligence = await getWeeklyIntelligence();
    return NextResponse.json(intelligence);
  } catch (error) {
    console.error('Intelligence API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error generando reporte de inteligencia', details: message },
      { status: 500 }
    );
  }
}
