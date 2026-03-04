import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function toTitleCase(name: string) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const publicDir = path.join(process.cwd(), "public")
  const candidates = [
    { dir: path.join(publicDir, "Logos equipos"), baseUrl: "/Logos%20equipos/" },
    { dir: path.join(publicDir, "logos-equipos"), baseUrl: "/logos-equipos/" },
    { dir: path.join(publicDir, "logos equipos"), baseUrl: "/logos%20equipos/" },
  ] as const

  for (const c of candidates) {
    try {
      const entries = await fs.readdir(c.dir, { withFileTypes: true })
      const files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((name) => /\.(png|jpg|jpeg|webp|svg)$/i.test(name))

      if (files.length === 0) continue

      const teams = files.map((file) => {
        const nameRaw = file.replace(/\.(png|jpg|jpeg|webp|svg)$/i, "")
        const prettyName = toTitleCase(nameRaw)
        return {
          name: prettyName,
          file,
          logo: `${c.baseUrl}${file}`,
        }
      })

      return NextResponse.json({ ok: true, baseUrl: c.baseUrl, teams })
    } catch (e) {
      // try next candidate
    }
  }

  return NextResponse.json({ ok: false, teams: [] }, { status: 404 })
}
