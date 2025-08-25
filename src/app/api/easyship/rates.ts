// functions/api/easyship/rates.ts
export interface Env {
  EASYSHIP_TOKEN: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const payload = await request.json();
    
    const resp = await fetch("https://api.easyship.com/2023-01/rates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.EASYSHIP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return new Response(text, { status: resp.status });
    }

    const data = JSON.parse(text);
    const rates = data.rates || [];
    
    // Sort and pick the best options to show
    const cheapest = [...rates].sort((a,b) => a.total_charge - b.total_charge)[0];
    const fastest = [...rates].sort((a,b) => a.min_delivery_time - b.min_delivery_time)[0];
    const bestValue = [...rates].sort((a,b) => a.value_for_money_rank - b.value_for_money_rank)[0];

    return new Response(JSON.stringify({ 
      all: rates, 
      cheapest, 
      fastest, 
      bestValue 
    }), { 
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
