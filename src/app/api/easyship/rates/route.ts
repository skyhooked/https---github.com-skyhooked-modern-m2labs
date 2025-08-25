// src/app/api/easyship/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    const resp = await fetch("https://public-api.easyship.com/2024-09/rates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EASYSHIP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return NextResponse.json({ error: errorText }, { status: resp.status });
    }

    const data = await resp.json();
    const rates = data.rates || [];
    
    // Sort and pick the best options to show
    const cheapest = [...rates].sort((a: any, b: any) => a.total_charge - b.total_charge)[0];
    const fastest = [...rates].sort((a: any, b: any) => a.min_delivery_time - b.min_delivery_time)[0];
    const bestValue = [...rates].sort((a: any, b: any) => a.value_for_money_rank - b.value_for_money_rank)[0];

    return NextResponse.json({ 
      all: rates, 
      cheapest, 
      fastest, 
      bestValue 
    });
    
  } catch (error) {
    console.error('EasyShip API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get shipping rates' }, 
      { status: 500 }
    );
  }
}
