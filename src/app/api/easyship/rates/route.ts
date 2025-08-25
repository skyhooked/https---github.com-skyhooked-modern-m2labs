// src/app/api/easyship/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

// Defaults for Easyship item classification
const DEFAULT_HS_CODE = '854370';         // effects pedals / electronic sound apparatus
const ORIGIN_COUNTRY_ALPHA2 = 'US';       // change if your ship-from country differs

// Optional per-SKU HS overrides (kept simple, add more as needed)
const HS_BY_SKU: Record<string, string> = {
  'M2L-TBO': '854370', // The Bomber Overdrive
};

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.json();
    console.log('📦 Received payload from frontend:', JSON.stringify(incoming, null, 2));

    // Build payload (keep your structure)
    const payload: any = { ...incoming };

    // v2024-09 uses "courier_settings" (compat for any legacy "courier_selection")
    if (payload.courier_selection && !payload.courier_settings) {
      payload.courier_settings = payload.courier_selection;
      delete payload.courier_selection;
    }

    // Be explicit about units (kept from your version)
    payload.shipping_settings = payload.shipping_settings || {};
    payload.shipping_settings.units =
      payload.shipping_settings.units || { weight: 'kg', dimensions: 'cm' };

    // ADD: ensure each item has hs_code or item_category_id, and origin country
    if (Array.isArray(payload?.parcels)) {
      payload.parcels = payload.parcels.map((parcel: any) => ({
        ...parcel,
        items: Array.isArray(parcel?.items)
          ? parcel.items.map((it: any) => {
              // If neither is present, try to fill hs_code from SKU, else default
              const hasClassification = !!it?.hs_code || !!it?.item_category_id;
              const hsFromSku = it?.sku ? HS_BY_SKU[it.sku] : undefined;
              return {
                ...it,
                hs_code: hasClassification ? it.hs_code : (hsFromSku || DEFAULT_HS_CODE),
                origin_country_alpha2: it?.origin_country_alpha2 || ORIGIN_COUNTRY_ALPHA2,
              };
            })
          : parcel?.items,
      }));
    }

    console.log('🚀 Sending to Easyship API:', JSON.stringify(payload, null, 2));
    console.log('🔑 Token present:', !!process.env.EASYSHIP_TOKEN);

    const resp = await fetch('https://public-api.easyship.com/2024-09/rates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EASYSHIP_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      // Enhanced error handling with detailed logging
      let parsed: any = null;
      try { 
        parsed = await resp.json(); 
        console.error('❌ Easyship API Error Response:', JSON.stringify(parsed, null, 2));
      } catch (parseError) { 
        console.error('❌ Failed to parse error response:', parseError);
      }
      
      const details = parsed?.error?.details?.join('; ');
      const msg = parsed?.error?.message || parsed?.message || (await resp.text());
      console.error(`❌ Easyship API ${resp.status}: ${details ? `${msg} (${details})` : msg}`);
      
      return NextResponse.json(
        { error: details ? `${msg} (${details})` : msg },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const rates = data.rates || [];

    // Keep your sorting logic
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
