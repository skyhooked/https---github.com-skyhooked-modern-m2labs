import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'

export const runtime = 'nodejs'

type Artist = {
  id: string
  name: string
  bio?: string
  imageUrl?: string
  [key: string]: unknown
}

// ===== GitHub config from environment =====
const OWNER = process.env.GITHUB_OWNER || ''
const REPO = process.env.GITHUB_REPO || ''
const TOKEN = process.env.GITHUB_TOKEN || ''
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'src/data/artists.json'
const GH_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`

// ===== Helpers =====
function mustEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function checkEnvVars() {
  if (!OWNER) throw new Error(`Missing required env var: GITHUB_OWNER`)
  if (!REPO) throw new Error(`Missing required env var: GITHUB_REPO`)
  if (!TOKEN) throw new Error(`Missing required env var: GITHUB_TOKEN`)
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

async function ghGetFile(): Promise<{ items: Artist[]; sha: string | null }> {
  const url = `${GH_BASE}?ref=${encodeURIComponent(BRANCH)}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${TOKEN}`, 'User-Agent': 'cf-pages' },
    cache: 'no-store',
  })

  if (res.status === 404) {
    // File does not exist yet
    return { items: [], sha: null }
  }

  if (!res.ok) {
    throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`)
  }

  const json = await res.json()
  const content = Buffer.from(json.content, 'base64').toString('utf8')
  const items = JSON.parse(content || '[]') as Artist[]
  return { items, sha: json.sha as string }
}

async function ghPutFile(jsonString: string, sha: string | null, message: string) {
  const body = {
    message,
    content: Buffer.from(jsonString, 'utf8').toString('base64'),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  }

  const res = await fetch(GH_BASE, {
    method: 'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      'User-Agent': 'cf-pages',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

// ===== Handlers =====
export async function GET() {
  try {
    checkEnvVars()
    const { items } = await ghGetFile()
    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

/**
 * POST behaviors:
 *  - If body is an array: replaces the entire artists list.
 *  - If body is a single object: appends one artist (id auto if missing).
 */
export async function POST(req: NextRequest) {
  try {
    checkEnvVars()
    const body = await req.json()

    // Replace entire list
    if (Array.isArray(body)) {
      const list = body as Partial<Artist>[]
      for (const a of list) {
        if (!a || !a.name) {
          return NextResponse.json({ error: 'Each artist must include name' }, { status: 400 })
        }
      }
      const normalized: Artist[] = list.map((a) => ({
        id: (a.id as string) || genId(),
        name: a.name as string,
        bio: a.bio,
        imageUrl: a.imageUrl,
        ...a,
      }))

      const jsonString = JSON.stringify(normalized, null, 2) + '\n'
      const { sha } = await ghGetFile()
      await ghPutFile(jsonString, sha, 'chore: replace artists.json via admin')
      return NextResponse.json({ ok: true })
    }

    // Append single artist
    const input = body as Partial<Artist>
    if (!input?.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { items, sha } = await ghGetFile()
    const newArtist: Artist = {
      id: input.id || genId(),
      name: input.name,
      bio: input.bio,
      imageUrl: input.imageUrl,
      ...input,
    }
    items.push(newArtist)

    const jsonString = JSON.stringify(items, null, 2) + '\n'
    await ghPutFile(jsonString, sha, `chore: add artist ${newArtist.id} via admin`)

    return NextResponse.json(newArtist, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
