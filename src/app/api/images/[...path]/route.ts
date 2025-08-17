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
function getR2Bucket(): R2Bucket {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  return globalThis.R2 || (globalThis as any).env?.R2;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const bucket = getR2Bucket();
    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 storage not configured' },
        { status: 500 }
      );
    }

    // Await the params promise
    const resolvedParams = await params;
    
    // Reconstruct the full path
    const imagePath = resolvedParams.path.join('/');
    
    // For uploaded images, they'll be under 'uploads/' prefix
    let key = imagePath;
    if (!key.startsWith('uploads/')) {
      key = `uploads/${imagePath}`;
    }

    // Get the object from R2
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
    console.error('Error serving image from R2:', error);
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    );
  }
}
