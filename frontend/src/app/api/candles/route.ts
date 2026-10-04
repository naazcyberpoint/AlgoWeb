import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'BTCUSD';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const resolution = searchParams.get('resolution') || '15m';
  if (!start || !end) return NextResponse.json({error:'start/end required'}, {status:400});
  const url = new URL('https://api.india.delta.exchange/v2/history/candles');
  url.searchParams.set('resolution', resolution);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);
  const r = await fetch(url.toString(), {cache:'no-store', headers:{Accept:'application/json'}});
  const body = await r.text();
  return new NextResponse(body,{status:r.status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}