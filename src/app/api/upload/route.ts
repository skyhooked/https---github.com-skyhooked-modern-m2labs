import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

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

    // On Cloudflare Pages (Edge), there is no writable disk.
    // Replace this section with an upload to R2/S3/etc.
    // Example contract kept stable for frontend:
    return NextResponse.json(
      {
        error: 'Uploads are not supported on Edge filesystem. Configure R2/S3 and update this route.',
      },
      { status: 501 }
    );
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
