import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// Type for Cloudflare R2 binding
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2Object | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  writeHttpMetadata(headers: Headers): void;
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    expires?: Date;
  };
  customMetadata?: Record<string, string>;
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

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  startAfter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

// Get R2 bucket from environment bindings
function getR2Bucket(): R2Bucket | null {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const bucket = globalThis.R2 || (globalThis as any).env?.R2 || (globalThis as any).DB?.env?.R2;
  
  console.log('R2 Bucket check:', {
    globalThis_R2: !!globalThis.R2,
    env_R2: !!(globalThis as any).env?.R2,
    bucket: !!bucket,
    envKeys: Object.keys((globalThis as any).env || {}),
    globalKeys: Object.keys(globalThis).filter(k => k.includes('R2') || k.includes('bucket'))
  });
  
  return bucket || null;
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${randomSuffix}.${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    const bucket = getR2Bucket();
    
    // Generate unique filename
    const filename = generateFilename(file.name);
    const key = `uploads/${filename}`;
    
    if (bucket) {
      // Use R2 binding if available
      try {
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Upload to R2
        await bucket.put(key, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000', // 1 year cache
          },
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('R2 upload via binding failed:', error);
        throw error;
      }
    } else {
      // Fallback: Use Cloudflare R2 REST API
      console.log('Using R2 REST API fallback');
      
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '75b5286f0b6ae344b3617e9357d53065';
      const bucketName = process.env.R2_BUCKET_NAME || 'm2labs-images';
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      if (!apiToken) {
        return NextResponse.json(
          { 
            error: 'R2 storage not configured. Missing API token.',
            details: 'Neither R2 binding nor API token is available.'
          }, 
          { status: 500 }
        );
      }
      
      // Upload via REST API
      const arrayBuffer = await file.arrayBuffer();
      const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': file.type,
          'Cache-Control': 'public, max-age=31536000',
        },
        body: arrayBuffer,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('R2 REST API upload failed:', uploadResponse.status, errorText);
        throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
      }
    }

    // Generate public URL for the image
    // Use our API endpoint to serve images from R2
    const publicPath = `/api/images/${filename}`;
    
    // Also provide the direct R2 URL for reference
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '75b5286f0b6ae344b3617e9357d53065';
    const bucketName = process.env.R2_BUCKET_NAME || 'm2labs-images';
    const r2PublicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      path: publicPath, // Keep this format for compatibility
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      r2Key: key,
      r2Url: r2PublicUrl,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
