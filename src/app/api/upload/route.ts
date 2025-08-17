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
function getR2Bucket(): R2Bucket {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  return globalThis.R2 || (globalThis as any).env?.R2;
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
    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 storage not configured' }, 
        { status: 500 }
      );
    }

    // Generate unique filename
    const filename = generateFilename(file.name);
    const key = `uploads/${filename}`;

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

    // R2 public URL format: https://pub-{subdomain}.r2.dev/{key}
    // For now, we'll use the custom domain approach in production
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME || 'm2labs-images';
    
    // Generate the R2 public URL
    // Note: In production, you'd want to use a custom domain
    const imageUrl = `https://pub-${accountId?.slice(0, 8)}.r2.dev/${key}`;
    
    // For now, return a path that works with both local and R2
    const publicPath = `/images/${filename}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      path: publicPath, // Keep this format for compatibility
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      r2Key: key,
      r2Url: imageUrl,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
