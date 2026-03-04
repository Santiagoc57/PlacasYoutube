import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para determinar si un color es oscuro o claro
export function isColorDark(hexColor: string): boolean {
  // Eliminar el # si existe
  const color = hexColor.replace("#", "")

  // Convertir a RGB
  const r = Number.parseInt(color.substring(0, 2), 16)
  const g = Number.parseInt(color.substring(2, 4), 16)
  const b = Number.parseInt(color.substring(4, 6), 16)

  // Calcular luminosidad
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Si la luminosidad es menor a 0.5, el color es oscuro
  return luminance < 0.5
}

// Función para generar un ID único
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Función para convertir un archivo a base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Función para descargar una imagen
export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const sanitizeForFilename = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim()

const toDisplayName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()

export function getLeaguePrefix(leagueName: string | undefined): string {
  if (!leagueName) return "PARTIDO"

  const normalized = normalizeText(leagueName)

  if (normalized.startsWith("liga nacional")) return "LN"
  if (normalized.startsWith("liga femenina")) return "LF"
  if (normalized.startsWith("liga argentina")) return "LA"

  const initials = leagueName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3)

  return initials || "PARTIDO"
}

export function buildFixtureFilename(
  leagueName: string | undefined,
  homeTeamName: string,
  awayTeamName: string,
  extension = "png",
): string {
  const prefix = getLeaguePrefix(leagueName)
  const baseName = `${prefix}-${toDisplayName(homeTeamName)} vs. ${toDisplayName(awayTeamName)}`
  const sanitized = sanitizeForFilename(baseName)
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "png"
  return `${sanitized}.${safeExtension}`
}

const LEAGUE_LOGO_MAP: Record<string, string> = {
  "liga-nacional": "/logos/leagues/Liga-nacional.png",
  "liganacional": "/logos/leagues/Liga-nacional.png",
  "liga-nacional-playoffs": "/logos/leagues/Liga-nacional-playoffs.png",
  "liganacionalplayoffs": "/logos/leagues/Liga-nacional-playoffs.png",
  "liga-nacional-finales": "/logos/leagues/Liga-nacional-finales.png",
  "liganacionalfinales": "/logos/leagues/Liga-nacional-finales.png",
  ln: "/logos/leagues/Liga-nacional.png",

  "liga-femenina": "/logos/leagues/Liga-femenina.png",
  "ligafemenina": "/logos/leagues/Liga-femenina.png",
  "liga-femenina-playoffs": "/logos/leagues/Liga-femenina-playoffs.png",
  "ligafemeninaplayoffs": "/logos/leagues/Liga-femenina-playoffs.png",
  "liga-femenina-finales": "/logos/leagues/Liga-femenina-finales.png",
  "ligafemeninafinales": "/logos/leagues/Liga-femenina-finales.png",
  lf: "/logos/leagues/Liga-femenina.png",

  "liga-argentina": "/logos/leagues/Liga-argentina.png",
  "ligaargentina": "/logos/leagues/Liga-argentina.png",
  "liga-argentina-playoffs": "/logos/leagues/Liga-argentina-playoffs.png",
  "ligaargentinaplayoffs": "/logos/leagues/Liga-argentina-playoffs.png",
  "liga-argentina-finales": "/logos/leagues/Liga-argentina-finales.png",
  "ligaargentinafinales": "/logos/leagues/Liga-argentina-finales.png",
  la: "/logos/leagues/Liga-argentina.png",

  "liga-federal": "/logos/leagues/Liga-federal.png",
  "ligafederal": "/logos/leagues/Liga-federal.png",
  "liga-federal-playoffs": "/logos/leagues/Liga-federal-playoffs.png",
  "ligafederalplayoffs": "/logos/leagues/Liga-federal-playoffs.png",
  "liga-federal-finales": "/logos/leagues/Liga-federal-finales.png",
  "ligafederalfinales": "/logos/leagues/Liga-federal-finales.png",

  "liga-desarrollo": "/logos/leagues/Liga-desarrollo.png",
  "ligadesarrollo": "/logos/leagues/Liga-desarrollo.png",
  "liga-desarrollo-playoffs": "/logos/leagues/Liga-desarrollo-playoffs.png",
  "ligadesarrolloplayoffs": "/logos/leagues/Liga-desarrollo-playoffs.png",
  "liga-desarrollo-finales": "/logos/leagues/Liga-desarollo-finales.png",
  "ligadesarrollofinales": "/logos/leagues/Liga-desarollo-finales.png",
}

export function resolveLeagueLogo(leagueId?: string, fallback?: string): string {
  if (leagueId) {
    const key = leagueId.toLowerCase()
    if (LEAGUE_LOGO_MAP[key]) return LEAGUE_LOGO_MAP[key]
    const compactKey = key.replace(/[^a-z]/g, "")
    if (LEAGUE_LOGO_MAP[compactKey]) return LEAGUE_LOGO_MAP[compactKey]
  }
  if (fallback) return fallback
  return "/logos/leagues/Liga-nacional.png"
}

// Función para procesar texto de fixture
export function processFixtureText(text: string, teams: any[], leagues: any[]) {
  const lines = text.split("\n")
  let currentLeagueId = ""
  const newFixtures = []
  const errors = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Verificar si es una línea de liga
    if (line.endsWith(":")) {
      const leagueName = line.slice(0, -1).trim()
      const league = leagues.find((l) => l.name.toLowerCase() === leagueName.toLowerCase())

      if (league) {
        currentLeagueId = league.id
        continue
      } else {
        errors.push(`Liga no encontrada: ${leagueName}`)
        continue
      }
    }

    // Si no hay liga seleccionada, continuar
    if (!currentLeagueId) {
      errors.push(`No se ha seleccionado una liga para: ${line}`)
      continue
    }

    // Procesar partido
    const teamNames = line.split("-")
    if (teamNames.length !== 2) {
      errors.push(`Formato incorrecto: ${line}`)
      continue
    }

    const homeTeamName = teamNames[0].trim()
    const awayTeamName = teamNames[1].trim()

    const homeTeam = teams.find((t) => t.name.toLowerCase() === homeTeamName.toLowerCase())
    const awayTeam = teams.find((t) => t.name.toLowerCase() === awayTeamName.toLowerCase())

    if (!homeTeam) {
      errors.push(`Equipo local no encontrado: ${homeTeamName}`)
    }

    if (!awayTeam) {
      errors.push(`Equipo visitante no encontrado: ${awayTeamName}`)
    }

    if (!homeTeam || !awayTeam) continue

    newFixtures.push({
      id: generateId(),
      leagueId: currentLeagueId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    })
  }

  return { fixtures: newFixtures, errors }
}

