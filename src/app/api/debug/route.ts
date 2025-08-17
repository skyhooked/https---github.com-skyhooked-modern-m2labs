import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('🔍 Debug endpoint called')
    
    const globalAny = globalThis as any
    
    // Check for D1 binding
    const db = globalAny.DB || 
               globalAny.env?.DB || 
               globalAny.__env?.DB ||
               globalAny.ASSETS?.env?.DB ||
               globalAny.context?.env?.DB
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasDB: !!db,
      dbType: db ? typeof db : 'undefined',
      availableGlobalKeys: Object.keys(globalAny).filter(k => !k.startsWith('_')).slice(0, 20),
      availableEnvKeys: Object.keys(globalAny.env || {}),
      environmentVars: {
        D1_DATABASE_ID: process.env.D1_DATABASE_ID ? 'present' : 'missing',
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? 'present' : 'missing',
        CF_API_TOKEN: process.env.CF_API_TOKEN ? 'present' : 'missing',
      },
      runtime: 'edge',
      bindingLocations: {
        'globalThis.DB': !!globalAny.DB,
        'globalThis.env?.DB': !!globalAny.env?.DB,
        'globalThis.__env?.DB': !!globalAny.__env?.DB,
        'globalThis.ASSETS?.env?.DB': !!globalAny.ASSETS?.env?.DB,
        'globalThis.context?.env?.DB': !!globalAny.context?.env?.DB,
      }
    }
    
    console.log('Debug info:', debugInfo)
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      ...debugInfo
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
