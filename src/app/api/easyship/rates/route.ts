// src/app/api/easyship/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

// HS code mapping for your products
const DEFAULT_HS_CODE = '854370'; // effects pedals / electronic sound apparatus
const ORIGIN_COUNTRY_ALPHA2 = 'US'; // update if needed

const HS_BY_SKU: Record<string, string> = {
  'M2L-TBO': '854370', // The Bomber Overdrive
  // add other SKUs here if you want per-SKU overrides
};

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.json();

    // Build payload
    const payload: any = { ...incoming };

    // v2024-09 uses "courier_settings" (migration away from "courier_selection")
    if (payload.courier_selection && !payload.courier_settings) {
      payload.courier_settings = payload.courier_selection;
      delete payload.courier_selection;
    }

    // Be explicit about units (recommended by docs)
    payload.shipping_settings = payload.shipping_settings || {};
    payload.shipping_settings.units =
      payload.shipping_settings.units || { weight: 'kg', dimensions: 'cm' };

    // Fill missing hs_code and origin_country_alpha2 on each item to prevent 422
    if (Array.isArray(payload?.parcels)) {
      payload.parcels = payload.parcels.map((parcel: any) => ({
        ...parcel,
        items: Array.isArray(parcel?.items)
          ? parcel.items.map((it: any) => ({
              ...it,
              hs_code: it?.hs_code || DEFAULT_HS_CODE,
              origin_country_alpha2: it?.origin_country_alpha2 || ORIGIN_COUNTRY_ALPHA2,
            }))
          : parcel?.items,
      }));
    }

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
      try {
        parsed = await resp.json();
      } catch {
        // fall through to text if not json
      }
      const details = parsed?.error?.details?.join('; ');
      const msg = parsed?.error?.message || parsed?.message || (await resp.text());
      return NextResponse.json(
        { error: details ? `${msg} (${details})` : msg },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const rates = data.rates || [];

    // pick cheapest / fastest / best value
    const cheapest = [...rates].sort(
      (a: any, b: any) => (a.total_charge ?? Infinity) - (b.total_charge ?? Infinity)
    )[0];
    const fastest = [...rates].sort(
      (a: any, b: any) => (a.min_delivery_time ?? Infinity) - (b.min_delivery_time ?? Infinity)
    )[0];
    const bestValue = [...rates].sort(
      (a: any, b: any) => (a.value_for_money_rank ?? Infinity) - (b.value_for_money_rank ?? Infinity)
    )[0];

    return NextResponse.json({ all: rates, cheapest, fastest, bestValue });
  } catch (error) {
    console.error('EasyShip API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}
