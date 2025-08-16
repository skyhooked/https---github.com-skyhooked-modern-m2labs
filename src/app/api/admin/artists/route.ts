import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type Artist = {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  [key: string]: unknown;
};

// Seed can be empty or you can paste some initial artists here.
const initialArtists: Artist[] = [];

// global (per-isolate) store
const g = globalThis as unknown as { __artistsStore?: { items: Artist[] } };
function store() {
  if (!g.__artistsStore) g.__artistsStore = { items: [...initialArtists] };
  return g.__artistsStore;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function GET() {
  return NextResponse.json(store().items);
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as Partial<Artist>;
    if (!data.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const artist: Artist = { id: genId(), name: data.name, ...data };
    store().items.push(artist);
    return NextResponse.json(artist, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
