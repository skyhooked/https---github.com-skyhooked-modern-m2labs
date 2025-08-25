// src/app/api/easyship/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.json();

    // v2024-09 uses "courier_settings" (migration away from "courier_selection")
    const payload = { ...incoming };
    if (payload.courier_selection && !payload.courier_settings) {
      payload.courier_settings = payload.courier_selection;
      delete payload.courier_selection;
    }

    // Be explicit about units (recommended by docs)
    payload.shipping_settings = payload.shipping_settings || {};
    payload.shipping_settings.units = payload.shipping_settings.units || { weight: 'kg', dimensions: 'cm' };

    const resp = await fetch('https://public-api.easyship.com/2024-09/rates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EASYSHIP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      let parsed: any = null;
      try { parsed = await resp.json(); } catch { /* fall through */ }
      const details = parsed?.error?.details?.join('; ');
      const msg = parsed?.error?.message || parsed?.message || (await resp.text());
      return NextResponse.json({ error: details ? `${msg} (${details})` : msg }, { status: resp.status });
    }

    const data = await resp.json();
    const rates = data.rates || [];

    // pick cheapest / fastest / best value
    const cheapest = [...rates].sort((a: any, b: any) => a.total_charge - b.total_charge)[0];
    const fastest = [...rates].sort((a: any, b: any) => a.min_delivery_time - b.min_delivery_time)[0];
    const bestValue = [...rates].sort((a: any, b: any) => a.value_for_money_rank - b.value_for_money_rank)[0];

    return NextResponse.json({ all: rates, cheapest, fastest, bestValue });
  } catch (error) {
    console.error('EasyShip API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}
