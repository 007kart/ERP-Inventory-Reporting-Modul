import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json({ status: 'ready', database: 'connected' });
  } catch {
    return NextResponse.json({ status: 'unavailable', database: 'disconnected' }, { status: 503 });
  }
}
