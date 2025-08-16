// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Convert an ArrayBuffer to base64 without using Node's Buffer (works on Edge)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid call stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Read file bytes and convert to a data URL for immediate use on the client
    const bytes = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(bytes);

    // Create a "filename" (used only for metadata—no filesystem writes on Edge)
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;

    // Return a Data URL that can be used directly in <img src="...">
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl, // usable directly in the UI
      filename,
      size: file.size,
      type: file.type,
      storage: 'inline-data-url',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
