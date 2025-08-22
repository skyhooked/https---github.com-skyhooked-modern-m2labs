import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const globalAny = globalThis as any;
    
    // Inspect what's available in the runtime
    const debug = {
      globalThis_keys: Object.keys(globalAny).filter(key => 
        key.includes('DB') || 
        key.includes('env') || 
        key.includes('binding') ||
        key.includes('context') ||
        key.includes('ASSETS') ||
        key.toUpperCase().includes('D1')
      ),
      all_global_keys: Object.keys(globalAny).slice(0, 30),
      env_available: !!globalAny.env,
      env_keys: globalAny.env ? Object.keys(globalAny.env) : [],
      process_env_db_keys: Object.keys(process.env).filter(k => k.includes('DB')),
      process_env_cf_keys: Object.keys(process.env).filter(k => k.includes('CF') || k.includes('CLOUDFLARE')),
      direct_DB_check: {
        global_DB: !!globalAny.DB,
        env_DB: !!(globalAny.env?.DB),
        __env_DB: !!(globalAny.__env?.DB),
        ASSETS_env_DB: !!(globalAny.ASSETS?.env?.DB),
        context_env_DB: !!(globalAny.context?.env?.DB),
        process_env_DB: !!(process.env as any).DB
      },
      request_headers: Object.fromEntries(request.headers.entries()),
      url: request.url
    };
    
    return NextResponse.json(debug);
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
