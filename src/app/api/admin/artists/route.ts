import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'artists.json');

export async function GET() {
  try {
    const json = await fs.readFile(DATA_PATH, 'utf8');
    const data = JSON.parse(json);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    // File not found yet => return empty list
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!Array.isArray(payload)) {
      return new NextResponse('Invalid payload (expected array)', { status: 400 });
    }
    
    // Save artist data
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
    
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return new NextResponse('Failed to save', { status: 500 });
  }
}
