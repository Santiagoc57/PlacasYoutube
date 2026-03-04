import type { Fixture, Team, League } from "./types"
import { buildFixtureFilename, downloadImage, resolveLeagueLogo } from "./utils"

interface DownloadFixtureOptions {
  fixture: Fixture
  teams: Team[]
  leagues: League[]
  homeColor?: string
  awayColor?: string
  homeColorBrightness?: number
  awayColorBrightness?: number
  homeLogoSize?: number
  awayLogoSize?: number
  globalLogoOffset?: {
    home: { x: number; y: number }
    away: { x: number; y: number }
  }
}

const loadImage = (src: string, fallbackText: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    const timeout = setTimeout(() => {
      console.warn(`Timeout al cargar imagen: ${src}`)
      resolve(img)
    }, 2000)

    img.onload = () => {
      clearTimeout(timeout)
      resolve(img)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      console.error(`Error al cargar imagen: ${src}`)
      const canvas = document.createElement("canvas")
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#cccccc"
        ctx.beginPath()
        ctx.arc(100, 100, 90, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#333333"
        ctx.font = "bold 20px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(fallbackText, 100, 100)
      }
      img.src = canvas.toDataURL()
    }

    img.src = src
  })
}

const adjustBrightness = (hexColor: string, percent: number): string => {
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  const factor = percent / 100
  const newR = Math.min(255, Math.round(r * factor))
  const newG = Math.min(255, Math.round(g * factor))
  const newB = Math.min(255, Math.round(b * factor))

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
}

export async function downloadFixture(options: DownloadFixtureOptions): Promise<void> {
  const {
    fixture,
    teams,
    leagues,
    homeColor,
    awayColor,
    homeColorBrightness = 100,
    awayColorBrightness = 100,
    homeLogoSize = 1.3,
    awayLogoSize = 1.3,
    globalLogoOffset = { home: { x: -3, y: 0 }, away: { x: 3, y: 0 } },
  } = options

  const homeTeam = teams.find((t) => t.id === fixture.homeTeamId)
  const awayTeam = teams.find((t) => t.id === fixture.awayTeamId)
  let baseLeague = leagues.find((l) => l.id === fixture.leagueId)

  // Resolver liga por código corto si no se encuentra por id
  if (!baseLeague && fixture.leagueId) {
    const code = fixture.leagueId.toUpperCase()
    const keyword = code === "LN" ? "liganacional" : code === "LF" ? "ligafemenina" : code === "LA" ? "ligaargentina" : null
    if (keyword) {
      baseLeague = leagues.find((l) => {
        const nameNorm = l.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "")
        const idNorm = l.id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "")
        return nameNorm.includes(keyword) || idNorm.includes(keyword)
      }) || null as any
    }
  }

  if (!homeTeam || !awayTeam || !baseLeague) {
    console.warn("Descarga omitida: faltan equipos o liga para el fixture", fixture)
    return
  }

  const resolvedLogo = resolveLeagueLogo(baseLeague.id, baseLeague.logo)
  const league = { ...baseLeague, logo: resolvedLogo }

  const adjustedHomeColor = adjustBrightness(homeColor || homeTeam.primaryColor, homeColorBrightness)
  const adjustedAwayColor = adjustBrightness(awayColor || awayTeam.primaryColor, awayColorBrightness)

  // Crear canvas temporal
  const width = 1920
  const height = 1080
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  try {
    // 1. Cargar plantilla
    const templateImage = await loadImage("/logos/plantilla.png", "TEMPLATE")

    // 2. Dibujar fondo dividido
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = adjustedHomeColor
    ctx.fillRect(0, 0, width / 2, height)
    ctx.fillStyle = adjustedAwayColor
    ctx.fillRect(width / 2, 0, width / 2, height)

    // 3. Dibujar plantilla
    ctx.drawImage(templateImage, 0, 0, width, height)

    // 4. Cargar y dibujar logos
    const leagueLogoImg = await loadImage(league.logo, league.name)
    const logoSize = width * 0.09375 * 1.5
    const leagueAspectRatio = leagueLogoImg.width / leagueLogoImg.height
    let leagueLogoWidth = logoSize
    let leagueLogoHeight = logoSize
    if (leagueAspectRatio > 1) {
      leagueLogoHeight = logoSize / leagueAspectRatio
    } else {
      leagueLogoWidth = logoSize * leagueAspectRatio
    }
    ctx.drawImage(leagueLogoImg, width / 2 - leagueLogoWidth / 2, height * 0.046, leagueLogoWidth, leagueLogoHeight)

    // Logo equipo local
    const homeLogoImg = await loadImage(homeTeam.logo, homeTeam.name)
    const teamLogoSize = width * 0.1927
    ctx.save()
    ctx.translate(
      width * 0.166 + (globalLogoOffset.home.x || 0) / 100 * width,
      height * 0.5 + (globalLogoOffset.home.y || 0) / 100 * height
    )
    const scaledHomeLogoSize = teamLogoSize * homeLogoSize
    ctx.drawImage(
      homeLogoImg,
      -scaledHomeLogoSize / 2,
      -scaledHomeLogoSize / 2,
      scaledHomeLogoSize,
      scaledHomeLogoSize
    )
    ctx.restore()

    // Logo equipo visitante
    const awayLogoImg = await loadImage(awayTeam.logo, awayTeam.name)
    ctx.save()
    ctx.translate(
      width * 0.834 + (globalLogoOffset.away.x || 0) / 100 * width,
      height * 0.5 + (globalLogoOffset.away.y || 0) / 100 * height
    )
    const scaledAwayLogoSize = teamLogoSize * awayLogoSize
    ctx.drawImage(
      awayLogoImg,
      -scaledAwayLogoSize / 2,
      -scaledAwayLogoSize / 2,
      scaledAwayLogoSize,
      scaledAwayLogoSize
    )
    ctx.restore()

    // 5. Descargar
    const filename = buildFixtureFilename(league.name, homeTeam.name, awayTeam.name)
    downloadImage(canvas.toDataURL("image/png"), filename)
  } catch (error) {
    console.error("Error al generar la portada:", error)
  }
}
