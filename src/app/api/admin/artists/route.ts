import { NextRequest, NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'

export const runtime = 'edge'

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

// Static fallback data when GitHub API is not available
const fallbackArtistData = [
  {
    "name": "Caro Pohl",
    "image": "/images/uploads/1755221517314-cp-sc2.jpg",
    "genre": "Metal",
    "featured": true,
    "location": "Cologne, Germany",
    "bio": "Caro Pohl picked up a guitar at 14 and never needed permission to get loud. Her first was a Yamaha Pacifica. It wasn't about the gear. It was about pushing sound hard enough to make it hers. She was already deep into Rock and Metal by then. She learned by listening and playing until her hands caught up with her ears.\n\nAt 16, she had a band and a purpose. The setup was raw but deliberate. A Mesa Boogie Dual Rectifier at the core, dialed in to hit like it should. That amp still works hard in her studio sessions. These days, her live rig is streamlined. It's built around a Kemper Profiler, two control pedals, and now The Bomber Overdrive, which has earned a permanent place on her board. No clutter. Just precision.\n\nSince 2011, she's been the guitarist in Saddiscore. That's not just a band. That's where her sound lives. Heavy, focused, and fully under control. Caro doesn't overplay. She locks in. Every note has a job, and she makes sure it gets done.",
    "gear": ["The Bomber Overdrive"],
    "website": "https://saddiscore.de/",
    "socialMedia": {
      "instagram": "@saddiscore",
      "spotify": "https://open.spotify.com/artist/0XkyklXB3YOwxTuSylThrw",
      "bandcamp": "",
      "tidal": "https://tidal.com/artist/5395187"
    },
    "testimonial": "",
    "showBandsintown": false,
    "bandsintownArtistName": "",
    "customSections": [],
    "id": "caro-pohl-25f8",
    "slug": "caro-pohl"
  },
  {
    "name": "Hector Guzman",
    "image": "/images/HG.webp",
    "genre": "Producer",
    "featured": true,
    "location": "Los Angeles, CA",
    "bio": "Hector Guzman is a producer and mix engineer based in Los Angeles. His credits include major-label and independent artists across genres spanning from Alternative Rock, Hip-hop, and Country.\n\nSelected credits: Gracie Abrams, Phoebe Bridgers, Lucy Dacus, boygenius, Claud, Clairo, Better Oblivion Community Center, Conor Oberst, The Beths, and Japanese Breakfast.",
    "gear": ["The Bomber Overdrive"],
    "website": "https://www.hectorguzman.com/",
    "socialMedia": {
      "instagram": "@hectorguzman.co",
      "spotify": "",
      "bandcamp": "",
      "tidal": ""
    },
    "testimonial": "",
    "showBandsintown": false,
    "bandsintownArtistName": "",
    "customSections": [],
    "id": "hector-guzman-9b3e",
    "slug": "hector-guzman"
  },
  {
    "name": "Loraine James",
    "image": "/images/Lorainepfp.jpg",
    "genre": "Electronic/Experimental",
    "featured": true,
    "location": "London, UK",
    "bio": "Loraine James has carved out a distinctive space in electronic music through her innovative blend of broken beat, jungle, ambient, and experimental sounds. Her work transcends traditional genre boundaries, creating deeply personal and emotionally resonant compositions that have earned critical acclaim and a devoted following.\n\nBased in London, Loraine's music reflects both her technical prowess and emotional depth. Her albums, including 'Detail' (2019), 'For You And I' (2020), and 'Reflection' (2021), showcase her ability to weave complex rhythmic patterns with lush, atmospheric textures. Her sound palette draws from UK electronic traditions while pushing into uncharted territory, incorporating elements of footwork, IDM, and contemporary classical music.\n\nLoraine's live performances are known for their dynamic range and emotional intensity. She seamlessly blends programmed beats with live manipulation, creating immersive sonic landscapes that can shift from delicate ambient passages to intense, rhythm-driven sections. Her use of The Bomber Overdrive adds a crucial layer of warmth and saturation to her electronic productions, helping to bridge the gap between digital precision and analog character.\n\nAs both a solo artist and collaborator, Loraine continues to push the boundaries of electronic music. Her work has been featured on respected labels like Hyperdub and she's performed at major festivals worldwide. Her approach to music-making is both cerebral and deeply felt, resulting in compositions that challenge listeners while remaining emotionally accessible.",
    "gear": ["The Bomber Overdrive"],
    "website": "https://lorainejames.bandcamp.com/",
    "socialMedia": {
      "instagram": "@lorainejames",
      "spotify": "https://open.spotify.com/artist/7j0rlQs0PAjRtJcIGIax4E",
      "bandcamp": "https://lorainejames.bandcamp.com/",
      "tidal": ""
    },
    "testimonial": "",
    "showBandsintown": false,
    "bandsintownArtistName": "",
    "customSections": [],
    "id": "loraine-james-8c2d",
    "slug": "loraine-james"
  }
]

// ===== Handlers =====
export async function GET() {
  try {
    // Try to get from GitHub first
    try {
      checkEnvVars()
      const { items } = await ghGetFile()
      return NextResponse.json(items)
    } catch (githubError) {
      // If GitHub API fails, return fallback data
      console.warn('GitHub API unavailable, using fallback data:', githubError)
      return NextResponse.json(fallbackArtistData)
    }
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
    const body = await req.json()
    
    // Check if GitHub API is available
    const hasGitHubConfig = OWNER && REPO && TOKEN
    
    if (!hasGitHubConfig) {
      // GitHub not configured, use local fallback
      console.warn('GitHub API not configured, using local storage fallback')
      
      // For now, just return success with the submitted data
      // In a real implementation, you'd store this in your D1 database
      const input = body as Partial<Artist>
      if (!input?.name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
      }
      
      const newArtist: Artist = {
        id: input.id || genId(),
        name: input.name,
        bio: input.bio,
        imageUrl: input.imageUrl,
        ...input,
      }
      
      return NextResponse.json(newArtist, { status: 201 })
    }

    // GitHub is configured, proceed with GitHub API operations
    checkEnvVars()

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
