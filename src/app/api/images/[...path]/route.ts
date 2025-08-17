import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Type for Cloudflare R2 binding
interface R2Bucket {
  get(key: string, options?: R2GetOptions): Promise<R2Object | null>;
}

interface R2Object {
  key: string;
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json(): Promise<any>;
  blob(): Promise<Blob>;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    expires?: Date;
  };
  customMetadata?: Record<string, string>;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
}

interface R2GetOptions {
  range?: { offset?: number; length?: number };
  onlyIf?: {
    etagMatches?: string;
    etagDoesNotMatch?: string;
    uploadedBefore?: Date;
    uploadedAfter?: Date;
  };
}

// Get R2 bucket from environment bindings
function getR2Bucket(): R2Bucket | null {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const globalAny = globalThis as any;
  return globalAny.R2 || globalAny.env?.R2 || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const bucket = getR2Bucket();

    // Await the params promise
    const resolvedParams = await params;
    
    // Reconstruct the full path
    const imagePath = resolvedParams.path.join('/');
    
    // For uploaded images, they'll be under 'uploads/' prefix
    let key = imagePath;
    if (!key.startsWith('uploads/')) {
      key = `uploads/${imagePath}`;
    }

    if (bucket) {
      // Use R2 binding if available
      try {
        const object = await bucket.get(key);
        
        if (!object) {
          return NextResponse.json(
            { error: 'Image not found' },
            { status: 404 }
          );
        }

        // Stream the image data
        const headers = new Headers();
        
        // Set content type from R2 metadata
        if (object.httpMetadata?.contentType) {
          headers.set('Content-Type', object.httpMetadata.contentType);
        }
        
        // Set cache headers
        headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
        headers.set('ETag', object.httpEtag);
        
        // Return the image stream
        return new NextResponse(object.body, {
          headers,
        });
      } catch (error) {
        console.error('R2 binding error:', error);
        // Fall through to REST API
      }
    }

    // Fallback: Use Cloudflare R2 REST API
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '75b5286f0b6ae344b3617e9357d53065';
    const bucketName = process.env.R2_BUCKET_NAME || 'm2labs-images';
    const apiToken = process.env.CF_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { error: 'R2 storage not configured' },
        { status: 500 }
      );
    }

    try {
      const objectUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;
      
      const response = await fetch(objectUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Image not found' },
            { status: 404 }
          );
        }
        throw new Error(`R2 API error: ${response.status}`);
      }

      // Forward the image response
      const headers = new Headers();
      const contentType = response.headers.get('content-type');
      if (contentType) {
        headers.set('Content-Type', contentType);
      }
      headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
      
      return new NextResponse(response.body, {
        headers,
      });
    } catch (fetchError) {
      console.error('R2 REST API error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to load image' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error serving image from R2:', error);
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    );
  }
}
