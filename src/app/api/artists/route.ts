import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'edge'

// Static artist data for Edge Runtime
const staticArtistData = [
  {
    "name": "Caro Pohl",
    "image": "/images/uploads/1755221517314-cp-sc2.jpg",
    "genre": "Metal",
    "featured": true,
    "location": "Cologne, Germany",
    "bio": "Caro Pohl picked up a guitar at 14 and never needed permission to get loud. Her first was a Yamaha Pacifica. It wasn't about the gear. It was about pushing sound hard enough to make it hers. She was already deep into Rock and Metal by then. She learned by listening and playing until her hands caught up with her ears.\n\nAt 16, she had a band and a purpose. The setup was raw but deliberate. A Mesa Boogie Dual Rectifier at the core, dialed in to hit like it should. That amp still works hard in her studio sessions. These days, her live rig is streamlined. It's built around a Kemper Profiler, two control pedals, and now The Bomber Overdrive, which has earned a permanent place on her board. No clutter. Just precision.\n\nSince 2011, she's been the guitarist in Saddiscore. That's not just a band. That's where her sound lives. Heavy, focused, and fully under control. Caro doesn't overplay. She locks in. Every note has a job, and she makes sure it gets done.",
    "gear": [
      "The Bomber Overdrive"
    ],
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
    "gear": [
      "The Bomber Overdrive"
    ],
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
    "gear": [
      "The Bomber Overdrive"
    ],
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

export async function GET() {
  try {
    return NextResponse.json(staticArtistData)
  } catch (error) {
    console.error('Failed to get artists:', error)
    return NextResponse.json({ error: 'Failed to load artists' }, { status: 500 })
  }
}
