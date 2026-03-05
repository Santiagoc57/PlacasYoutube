import { Team, League, Fixture } from "@/lib/types"
import { generateId } from "@/lib/utils"

export interface ParseResult {
  fixtures: Fixture[]
  errors: string[]
  warnings: string[]
  processedLines: ProcessedLineResult[]
}

export type LeagueType = "LN" | "LF" | "LA";

export interface TeamSuggestion {
  teamId: string;
  name: string;
  reason: string;
  distance: number;
}

export interface TeamLineInfo {
  raw: string
  resolvedName?: string
  matchedByAlias?: boolean
  suggestions: TeamSuggestion[]
  autoCorrected?: boolean
  distance?: number
}

export interface ProcessedLineResult {
  lineNumber: number
  rawText: string
  status: "added" | "skipped"
  message: string
  leagueName?: string
  leagueType?: LeagueType;
  isHeader?: boolean
  home?: TeamLineInfo
  away?: TeamLineInfo
}

type TeamMatchEntry = {
  team: Team
  source: "name" | "alias"
}

const FLEX_ALIAS_PAIRS: Array<[string, string]> = [
  ["Berazategui", "Club Deportivo Berazategui"],
  ["Chañares", "Club Atlético Chañares"],
  ["El Talar", "Club Social y Deportivo El Talar"],
  ["Gorriones", "Club Gorriones"],
  ["Lanús", "Club Atlético Lanús"],
  ["Lanus", "Club Atlético Lanús"],
  ["Montmartre", "Club Atlético Montmartre"],
  ["Argentino", "Club Atlético Argentino de Junín"],
  ["Argentino Junín", "Club Atlético Argentino de Junín"],
  ["Argentino de Junín", "Club Atlético Argentino de Junín"],
  ["Atenas", "Asociación Deportiva Atenas (Córdoba)"],
  ["Boca", "Club Atlético Boca Juniors"],
  ["Boca Juniors", "Club Atlético Boca Juniors"],
  ["Ferro", "Ferro Carril Oeste"],
  ["Gimnasia (cr)", "Gimnasia y Esgrima de Comodoro Rivadavia"],
  ["Gimnasia cr", "Gimnasia y Esgrima de Comodoro Rivadavia"],
  ["Gimnasia de Comodoro", "Gimnasia y Esgrima de Comodoro Rivadavia"],
  ["Gimnasia de Comodoro", "Gimnasia Cr"],
  ["Independiente de Oliva", "Club Atlético Independiente de Oliva"],
  ["Independiente Oliva", "Club Atlético Independiente de Oliva"],
  ["Independiente (O)", "Club Atlético Independiente de Oliva"],
  ["Independiente O", "Club Atlético Independiente de Oliva"],
  ["Independiente (Oliva)", "Club Atlético Independiente de Oliva"],
  ["Instituto", "Instituto Atlético Central Córdoba"],
  ["La Unión", "La Unión de Formosa"],
  ["La Union", "La Unión de Formosa"],
  ["Unión", "Club Atlético Unión (Santa Fe)"],
  ["Union", "Club Atlético Unión (Santa Fe)"],
  ["Oberá", "Oberá Tenis Club"],
  ["Obera", "Oberá Tenis Club"],
  ["Obras", "Obras Basket (Obras Sanitarias)"],
  ["Peñarol", "Club Atlético Peñarol (Mar del Plata)"],
  ["Platense", "Club Atlético Platense"],
  ["Quimsa", "Asociación Atlética Quimsa (Santiago del Estero)"],
  ["Regatas", "Club de Regatas Corrientes"],
  ["Riachuelo", "Club Atlético Riachuelo"],
  ["San Lorenzo", "Club Atlético San Lorenzo de Almagro"],
  ["San Martín de Corrientes", "Club San Martín de Corrientes"],
  ["San Martin de Corrientes", "Club San Martín de Corrientes"],
  ["San Martín", "Club San Martín de Corrientes"],
  ["San Martin", "Club San Martín de Corrientes"],
  ["Unión SF", "Club Atlético Unión (Santa Fe)"],
  ["Union SF", "Club Atlético Unión (Santa Fe)"],
  ["Unión de Santa Fe", "Club Atlético Unión (Santa Fe)"],
  ["Union de Santa Fe", "Club Atlético Unión (Santa Fe)"],
  ["Zárate", "Zárate Basket"],
  ["Zarate", "Zárate Basket"],
  ["Biguá", "Bigua"],
  ["Bigua", "Bigua"],
  ["Bochas", "Club Atlético Bochas Sport"],
  ["Fusion Riojana", "Fusion Riojana Basket"],
  ["Fusión Riojana", "Fusion Riojana Basket"],
  ["Hindú", "Club Atlético Hindú (Resistencia)"],
  ["Hindu", "Club Atlético Hindú (Resistencia)"],
  ["Independiente", "Club Atlético Independiente (Avellaneda)"],
  ["Independiente Neuquén", "Club Independiente de Neuquén"],
  ["Independiente Neuquen", "Club Independiente de Neuquén"],
  ["Independiente (Nqn)", "Club Independiente de Neuquén"],
  ["Independiente Nqn", "Club Independiente de Neuquén"],
  ["Náutico", "Club Náutico Sportivo Avellaneda"],
  ["Nautico", "Club Náutico Sportivo Avellaneda"],
  ["Náutico Sporting", "Club Náutico Sportivo Avellaneda"],
  ["Nautico Sporting", "Club Náutico Sportivo Avellaneda"],
  // Variantes reportadas por el usuario
  ["La Unión (FSA)", "La Unión de Formosa"],
  ["La Union (FSA)", "La Unión de Formosa"],
  ["Náutico Avellaneda", "Club Náutico Sportivo Avellaneda"],
  ["Nautico Avellaneda", "Club Náutico Sportivo Avellaneda"],
  ["Gorriones (IV)", "Club Gorriones"],
  ["San Isidro", "Atlético San Isidro"],
  ["Atletico San Isidro", "Atlético San Isidro"],
  ["Centenario (VT)", "Centenario"],
  ["Olímpico", "Olimpico"],
  ["Olimpico", "Olimpico"],
  ["Racing (Ch)", "Racing Club de Chivilcoy"],
  ["Rocamora", "Tomás de Rocamora (Concepción del Uruguay)"],
  ["San José", "Club Atlético San José"],
  ["San Jose", "Club Atlético San José"],
  ["Unión Deportiva San José", "Unión Deportiva San José"],
  ["Union Deportiva San Jose", "Unión Deportiva San José"],
  ["Unión Florida", "Club Unión Florida"],
  ["Union Florida", "Club Unión Florida"],
  ["Sportivo Náutico", "Club Sportivo Náutico"],
  ["Sportivo Nautico", "Club Sportivo Náutico"],
  // Refuerzos adicionales
  ["Estudiantes (T)", "Club Atlético Estudiantes"],
  ["Gimnasia de La Plata", "GELP"],
  ["Gimnasia La Plata", "GELP"],
  ["Gimnasia LP", "GELP"],
  // Reportados por el usuario (abreviaturas y ciudades)
  ["San Martín (C)", "San Martín de Corrientes"],
  ["San Martin (C)", "San Martín de Corrientes"],
  ["San Martín (C", "San Martín de Corrientes"],
  ["San Martin (C", "San Martín de Corrientes"],
  ["Peñarol (MDP)", "Club Atlético Peñarol (Mar del Plata)"],
  ["Penarol (MDP)", "Club Atlético Peñarol (Mar del Plata)"],
  ["Olímpico (LB)", "Olimpico"],
  ["Olimpico (LB)", "Olimpico"],
  ["Unión (MDP)", "Unión de Mar del Plata"],
  ["Union (MDP)", "Unión de Mar del Plata"],
  ["Unión (mdp)", "Unión de Mar del Plata"],
  ["Union (mdp)", "Unión de Mar del Plata"],
  ["Gimnasia y Esgrima", "GELP"],
  ["Santa Paula", "Santa Paula de Gálvez"],
  ["La Unión de Colón", "La Unión C"],
  ["La Union de Colon", "La Unión C"],
  ["EL BIGUA (NQN)", "Bigua"],
  ["El Bigua (NQN)", "Bigua"],
  ["El Biguá (NQN)", "Bigua"],
  ["Bochas (CC)", "Bochas"],
  ["Gorriones (RIO IV)", "Club Gorriones"],
  ["Gorriones (Rio IV)", "Club Gorriones"],
  ["Gorriones (Río IV)", "Club Gorriones"],
  ["Union FSA", "La Unión de Formosa"],
];

// Alias adicionales para reconocimiento robusto de equipos
// Claves y valores deben estar en minúsculas y sin tildes como devuelve el preprocesamiento base
const TEAM_ALIASES: Record<string, string> = {
  // Nombres alternativos comunes
  "gimasia y esgrima la plata": "gelp",
  "gimnasia y esgrima la plata": "gelp",
  "gimnasia la plata": "gelp",
  "quilmes de mar del plata": "quilmes",
  "quilmes mdp": "quilmes",
  "centenario de venado tuerto": "centenario",
  "tomas de rocamora": "rocamora",
  "tomás de rocamora": "rocamora",
  "provincial de rosario": "provincial",
  "sportivo suardi": "suardi",
  "club ciclista juninense de junin": "ciclista",
  "ciclista juninense": "ciclista",
  "pico football club": "pico",
  "pico fc": "pico",
  "deportivo norte de armstrong": "deportivo norte",
  "villa san martin de resistencia": "villa san martin",
  "villa san martin": "villa san martin",
  "villa san martín de resistencia": "villa san martin",
  "villa san martín": "villa san martin",
  "villa mitre de bahia blanca": "villa mitre",
  "villa mitre": "villa mitre",
  "comunicaciones de mercedes": "comunicaciones",
  "la union de colon": "la union c",
  "la unión de colón": "la union c",
  "bochas de colonia caroya": "bochas",
  "colón de santa fe": "colon sf",
  "colon de santa fe": "colon sf",
  "colón": "colon sf",
  "colon": "colon sf",
  "racing de avellaneda": "racing de avellaneda",
  "racing a": "racing de avellaneda",
  "san martin de corrientes": "san martin",
  "san martin corr": "san martin",
  "atletico san isidro": "san isidro",
  "atletico si": "san isidro",
  "independiente bbc": "independiente",
  "independiente b.b.c.": "independiente",
  "independiente de oliva": "independiente oliva",
  "independiente neuquen": "independiente neuquen",
  "independiente nqn": "independiente neuquen",
  "huracan las heras": "huracan",
  "huracán las heras": "huracan",
  "deportivo viedma": "viedma",
  "dep viedma": "viedma",
  "viedma": "viedma",
  "dep norte": "deportivo norte",
  // Añadir más alias según sea necesario
  "club ciclista juninense": "ciclista",
  "club ciclista": "ciclista",
  "juninense": "ciclista",
  "rosario": "provincial",
  "mercedes": "comunicaciones",
  "bahia blanca": "villa mitre",
  "resistencia": "villa san martin",
  "sp suardi": "suardi",
};

// Conjuntos de equipos por tipo de liga (normalizados)
const LA_TEAMS = new Set<string>([
  "amancay",
  "atletico san isidro",
  "barrio parque",
  "bochas",
  "centenario",
  "central entrerriano",
  "ciclista",
  "club atletico estudiantes",
  "colon sf",
  "comunicaciones",
  "deportivo norte",
  "el talar",
  "fusion riojana",
  "gelp",
  "hindu",
  "hindu c",
  "hispano americano",
  "huracan las heras",
  "independiente b.b.c.",
  "jujuy basquet",
  "la union c",
  "lanus",
  "pergamino",
  "pico",
  "provincial",
  "quilmes",
  "racing de avellaneda",
  "rivadavia basquet",
  "rocamora",
  "salta basket",
  "santa paula de galvez",
  "suardi",
  "union de mar del plata",
  "viedma",
  "villa mitre",
  "villa san martin",
].map((x) => normalizeName(x)))

const LF_TEAMS = new Set<string>([
  "bigua",
  "bochas",
  "chanares",
  "dep berazategui",
  "berazategui",
  "el talar",
  "ferro",
  "fusion riojana",
  "gorriones",
  "hindu c",
  "independiente neuquen",
  "instituto",
  "lanus",
  "montmartre",
  "nautico r",
  "nautico",
  "obras",
  "olimpico",
  "penarol",
  "quimsa",
  "riachuelo",
  "rocamora",
  "san jose",
  "u florida",
  "union florida",
  "union deportiva san jose",
].map((x) => normalizeName(x)))

const LN_TEAMS = new Set<string>([
  "argentino",
  "atenas",
  "boca juniors",
  "boca",
  "ferro",
  "gimnasia cr",
  "independiente o",
  "independiente de oliva",
  "instituto",
  "la union",
  "obera",
  "obera tc",
  "obras",
  "olimpico",
  "penarol",
  "platense",
  "quimsa",
  "racing ch",
  "regatas c",
  "riachuelo",
  "san lorenzo",
  "san martin corrientes",
  "union sf",
  "zarate",
  "zarate basket",
].map((x) => normalizeName(x)))

const leagueTypeKeywordMap: Record<LeagueType, string> = {
  LN: "liganacional",
  LF: "ligafemenina",
  LA: "ligaargentina",
}

function findLeagueByType(type: LeagueType, leagues: League[]): League | null {
  const primary = leagueTypeKeywordMap[type]
  if (!primary) return null
  const alternatives: string[] = [
    primary,
    primary.replace("liga", ""), // e.g., ligafemenina -> femenina
    type.toLowerCase(),            // ln, lf, la
  ]

  type Candidate = { league: League; nameNorm: string; idNorm: string }
  const cands: Candidate[] = leagues.map((lg) => ({
    league: lg,
    nameNorm: normalizeName(lg.name),
    idNorm: normalizeName(lg.id),
  })).filter(({ nameNorm, idNorm }) => alternatives.some((kw) => nameNorm.includes(kw) || idNorm.includes(kw)))

  if (cands.length === 0) return null

  // Rank: exact equals to primary keyword > startsWith primary > includes primary > others
  const hasPlayoffWord = (s: string) => /(playoff|play-offs|final|semifinal|cuartos)/i.test(s)

  cands.sort((a, b) => {
    const aExact = a.nameNorm === primary || a.idNorm === primary
    const bExact = b.nameNorm === primary || b.idNorm === primary
    if (aExact !== bExact) return aExact ? -1 : 1

    const aStarts = a.nameNorm.startsWith(primary) || a.idNorm.startsWith(primary)
    const bStarts = b.nameNorm.startsWith(primary) || b.idNorm.startsWith(primary)
    if (aStarts !== bStarts) return aStarts ? -1 : 1

    const aIncl = a.nameNorm.includes(primary) || a.idNorm.includes(primary)
    const bIncl = b.nameNorm.includes(primary) || b.idNorm.includes(primary)
    if (aIncl !== bIncl) return aIncl ? -1 : 1

    // Finally, prefer NOT playoffs/finals by default for the base type
    const aPlay = hasPlayoffWord(a.nameNorm) || hasPlayoffWord(a.idNorm)
    const bPlay = hasPlayoffWord(b.nameNorm) || hasPlayoffWord(b.idNorm)
    if (aPlay !== bPlay) return aPlay ? 1 : -1
    return a.league.name.localeCompare(b.league.name)
  })

  return cands[0].league
}

function inferLeagueTypeFromLeague(league: League): LeagueType | undefined {
  const normalized = normalizeName(league.name)
  // Buscar con espacio porque normalizeName preserva espacios
  if (normalized.includes("liga femenina") || normalized.includes("ligafemenina")) return "LF"
  if (normalized.includes("liga nacional") || normalized.includes("liganacional")) return "LN"
  if (normalized.includes("liga argentina") || normalized.includes("ligaargentina")) return "LA"
  return undefined
}

// Extrae una liga si la línea termina con el nombre de una liga (p.ej. "Obera vs Unión Liga Nacional")
function extractTrailingLeagueFromLine(line: string, leagues: League[]): { cleanedLine: string; league: League | null } {
  const normLine = normalizeName(line)
  let best: { league: League; norm: string } | null = null
  for (const lg of leagues) {
    const normName = normalizeName(lg.name)
    if (!normName) continue
    if (normLine.endsWith(normName)) {
      if (!best || normName.length > best.norm.length) {
        best = { league: lg, norm: normName }
      }
    }
  }
  if (!best) return { cleanedLine: line, league: null }

  // Remover usando el nombre real de la liga como regex al final (case-insensitive)
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Permitir separadores (/, -, |, espacios) y un artículo opcional (el|la|los|las) antes del nombre de la liga
  const pattern = new RegExp(`(?:[\\/,\\-\\|\\s]*)(?:(?:el|la|los|las)\\s+)?${escape(best.league.name)}\\s*$`, "i")
  const cleaned = line.replace(pattern, "").replace(/[:\-\s]+$/, "").trim()
  return { cleanedLine: cleaned, league: best.league }
}

function containsTeamSeparator(line: string): boolean {
  return /\bvs\.?\b/i.test(line) || /[-–—]/.test(line) || /,/.test(line) || /\t/.test(line)
}

function splitTeams(line: string): [string, string] | null {
  const separators = [/\bvs\.?\b/i, /[-–—]/, /,/, /\t/]
  for (const regex of separators) {
    if (regex.test(line)) {
      const parts = line.split(regex).map((part) => part.trim()).filter(Boolean)
      if (parts.length >= 2) {
        return [parts[0], parts[parts.length - 1]]
      }
    }
  }
  return null
}

function extractLeagueCodes(line: string): { cleanedLine: string; type?: LeagueType } {
  let detected: LeagueType | undefined
  // Case-sensitive: only match uppercase tokens LN, LF, LA (optionally wrapped)
  const cleaned = line.replace(/[\[\(\{]?\b(LN|LF|LA)\b[\)\]\}]?/g, (_, code: string) => {
    detected = code as LeagueType
    return " "
  })
  return { cleanedLine: cleaned.replace(/\s{2,}/g, " ").trim(), type: detected }
}

const AUTOCORRECT_DISTANCE_THRESHOLD = 2

/**
 * Analiza un bloque de texto pegado por el usuario y devuelve los fixtures válidos junto
 * con una lista de errores.  
 * Formatos admitidos por línea:
 * 1. Encabezado de liga: "Liga X:" o simplemente "Liga X" (sin separadores de equipos).
 * 2. Formato CSV/TSV: "local,visitante" o con tabulaciones (útil para copiar de Sheets).
 * 3. Separadores flexibles entre equipos: "vs", "-", "–", ",".
 * 4. Liga inline usando "@": "Local vs Visitante @ Liga Y".
 */
export function parseFixtures(
  text: string,
  teams: Team[],
  leagues: League[],
): ParseResult {
  const leagueMap = new Map<string, League>()
  leagues.forEach((lg) => leagueMap.set(normalizeName(lg.name), lg))
  const teamMap = new Map<string, TeamMatchEntry[]>()
  const teamsById = new Map<string, Team>()

  const registerTeamKey = (rawKey: string, team: Team, source: "name" | "alias") => {
    const key = normalizeName(rawKey)
    if (!key) return
    const existing = teamMap.get(key) || []
    if (!existing.some((entry) => entry.team.id === team.id && entry.source === source)) {
      existing.push({ team, source })
      teamMap.set(key, existing)
    }
  }

  teams.forEach((team) => {
    teamsById.set(team.id, team)
    registerTeamKey(team.name, team, "name")
    ;(team.aliases || []).forEach((alias) => registerTeamKey(alias, team, "alias"))
  })

  const canonicalByNorm = new Map<string, Team>()
  teams.forEach((t) => canonicalByNorm.set(normalizeName(t.name), t))

  const findBestTeamForCanonical = (canonical: string): Team | null => {
    const cNorm = normalizeName(canonical)
    let best: { team: Team; score: number; dist: number } | null = null
    for (const t of teams) {
      const tNorm = normalizeName(t.name)
      const inclusion = cNorm.includes(tNorm) || tNorm.includes(cNorm)
      const dist = levenshteinDistance(cNorm, tNorm)
      const score = inclusion ? -1 : dist // inclusión gana a cualquier distancia
      if (!best || score < best.score || (score === best.score && dist < best.dist)) {
        best = { team: t, score, dist }
      }
    }
    if (!best) return null
    // aceptar si hay inclusión o distancia razonable
    if (best.score === -1 || best.dist <= 3) return best.team
    return null
  }

  FLEX_ALIAS_PAIRS.forEach(([alias, canonical]) => {
    let team = canonicalByNorm.get(normalizeName(canonical)) || findBestTeamForCanonical(canonical)
    if (team) {
      registerTeamKey(alias, team, "alias")
      registerTeamKey(canonical, team, "alias")
    }
  })

  const leagueTypeCache = new Map<LeagueType, League | null>()
  const getLeagueByType = (type: LeagueType) => {
    if (!leagueTypeCache.has(type)) {
      leagueTypeCache.set(type, findLeagueByType(type, leagues))
    }
    return leagueTypeCache.get(type) || null
  }

  // Preferir por defecto la Liga Nacional si existe
  const defaultLeague: League | null = findLeagueByType("LN", leagues) || leagues[0] || null

  const lines = text.split(/\r?\n/)
  let currentLeague: League | null = null
  let currentLeagueType: LeagueType | undefined
  let lockLeagueFromHeader = false
  const fixtures: Fixture[] = []
  const errors: string[] = []
  const warnings: string[] = []
  const processedLines: ProcessedLineResult[] = []
  let fallbackLeagueUsed = false

  lines.forEach((raw, idx) => {
    const originalLine = raw
    let trimmed = raw.trim()
    if (!trimmed) return

    const { cleanedLine, type: inlineCodeType } = extractLeagueCodes(trimmed)
    let inlineType = inlineCodeType
    let line = cleanedLine

    let leagueOverride: League | null = null
    if (line.includes("@")) {
      const atIndex = line.indexOf("@")
      if (atIndex >= 0) {
        const teamsPart = line.slice(0, atIndex).trim()
        const leaguePart = line.slice(atIndex + 1).trim()
        if (teamsPart) {
          line = teamsPart
        }
        const normalizedLeague = normalizeName(leaguePart.replace(/[:\-]+$/, ""))
        if (normalizedLeague) {
          leagueOverride =
            leagueMap.get(normalizedLeague) ||
            leagues.find((lg) => normalizeName(lg.name).includes(normalizedLeague)) ||
            null
          if (leagueOverride) {
            inlineType = inlineType || inferLeagueTypeFromLeague(leagueOverride)
          }
        }
      }
    }

    const isLeagueHeader = !containsTeamSeparator(line)

    // Intentar detectar liga al final de la línea (p.ej. "... Liga Nacional")
    // SOLO si NO es un encabezado de liga
    if (!leagueOverride && !isLeagueHeader) {
      const trailing = extractTrailingLeagueFromLine(line, leagues)
      if (trailing.league) {
        line = trailing.cleanedLine
        leagueOverride = trailing.league
        inlineType = inlineType || inferLeagueTypeFromLeague(trailing.league)
      }
    }

    if (isLeagueHeader) {
      const headerText = line.replace(/[:\-\s]+$/, "").trim()
      console.log(`[DEBUG] headerText ANTES de normalizar = "${headerText}"`)
      const normalizedHeader = normalizeName(headerText)
      console.log(`[DEBUG] normalizedHeader DESPUES de normalizar = "${normalizedHeader}"`)
      let detectedLeague: League | null = null

      // 1. Buscar coincidencia exacta en el nombre de la liga
      detectedLeague = leagues.find((lg) => normalizeName(lg.name) === normalizedHeader) || null

      // 2. Buscar por palabras clave de tipo de liga PRIMERO (más específico)
      if (!detectedLeague) {
        let headerType: LeagueType | undefined
        console.log(`[DEBUG] normalizedHeader = "${normalizedHeader}"`)
        if (normalizedHeader.includes("femenina")) {
          headerType = "LF"
          console.log(`[DEBUG] Detectado keyword 'femenina', headerType = LF`)
        }
        else if (normalizedHeader.includes("nacional")) {
          headerType = "LN"
          console.log(`[DEBUG] Detectado keyword 'nacional', headerType = LN`)
        }
        else if (normalizedHeader.includes("argentina")) headerType = "LA"
        if (headerType) {
          detectedLeague = findLeagueByType(headerType, leagues)
          inlineType = headerType
          console.log(`[DEBUG] getLeagueByType(${headerType}) = "${detectedLeague?.name}"`)
        }
      }

      // 3. Buscar si el encabezado matchea el inicio del nombre de la liga (ej: "Liga Nacional" matchea "Liga Nacional Playoffs")
      if (!detectedLeague) {
        const candidates = leagues.filter((lg) => {
          const lgNorm = normalizeName(lg.name)
          // Solo matchear si la liga empieza con el encabezado completo
          return lgNorm.startsWith(normalizedHeader)
        })
        if (candidates.length > 0) {
          // Preferir coincidencia sin playoffs/finales si el encabezado no las menciona
          const hasPlayoffKeyword = /playoff|final|semifinal|cuarto/i.test(headerText)
          if (!hasPlayoffKeyword) {
            const nonPlayoff = candidates.find((lg) => !/playoff|final|semifinal|cuarto/i.test(lg.name))
            detectedLeague = nonPlayoff || candidates[0]
          } else {
            detectedLeague = candidates[0]
          }
        }
      }

      if (detectedLeague) {
        currentLeague = detectedLeague
        currentLeagueType = inlineType || inferLeagueTypeFromLeague(detectedLeague)
        lockLeagueFromHeader = true
        console.log(`[DEBUG] Línea ${idx + 1}: Encabezado "${originalLine.trim()}" → Liga detectada: "${detectedLeague.name}" (tipo: ${currentLeagueType})`)
        processedLines.push({
          lineNumber: idx + 1,
          rawText: originalLine,
          status: "skipped",
          message: `Liga seleccionada: ${detectedLeague.name}`,
          leagueName: detectedLeague.name,
          leagueType: currentLeagueType,
          isHeader: true,
        })
      } else {
        // No se pudo reconocer la liga, pero limpiar la liga anterior
        currentLeague = null
        currentLeagueType = undefined
        lockLeagueFromHeader = false
        console.log(`[DEBUG] Línea ${idx + 1}: Encabezado "${originalLine.trim()}" → NO detectada`)
        warnings.push(`Línea ${idx + 1}: No se pudo reconocer la liga "${originalLine.trim()}"`)
        processedLines.push({
          lineNumber: idx + 1,
          rawText: originalLine,
          status: "skipped",
          message: "Liga no reconocida",
          isHeader: true,
        })
      }
      return
    }

    const teamNames = splitTeams(line)

    if (!teamNames) {
      errors.push(`Línea ${idx + 1}: Formato incorrecto. Usa 'Equipo vs Equipo'.`)
      processedLines.push({
        lineNumber: idx + 1,
        rawText: originalLine,
        status: "skipped",
        message: "Formato incorrecto (Equipo vs Equipo)",
      })
      return
    }

    const stripAfterPipe = (s: string) => s.replace(/\|\s*.*$/, "").trim()
    const [homeRaw0, awayRaw0] = teamNames
    const homeRaw = stripAfterPipe(homeRaw0)
    const awayRaw = stripAfterPipe(awayRaw0)

    const cleanToken = (s: string) => s
      .replace(/^[^A-Za-z0-9\u00C0-\u017F]+/, "")
      .replace(/[^A-Za-z0-9\u00C0-\u017F]+$/, "")
      .trim()

    let leagueType: LeagueType | undefined = inlineType || currentLeagueType
    let leagueForFixture: League | null = leagueOverride

    // Si venimos de un encabezado y no hay override explícito, forzar herencia de la liga del encabezado
    if (!leagueForFixture && lockLeagueFromHeader && currentLeague) {
      leagueForFixture = currentLeague
      leagueType = leagueType || currentLeagueType
      console.log(`[DEBUG] Línea ${idx + 1}: Heredando liga desde encabezado = "${currentLeague.name}"`)
    }

    if (!leagueForFixture && inlineType) {
      // si hay código explícito, no forzar fallback diferente
      leagueForFixture = findLeagueByType(inlineType, leagues)
      // En presencia de override/código explícito, desbloquear herencia del encabezado
      if (leagueForFixture) lockLeagueFromHeader = false
    }

    if (!leagueForFixture && currentLeague) {
      leagueForFixture = currentLeague
      console.log(`[DEBUG] Línea ${idx + 1}: Usando currentLeague = "${currentLeague.name}"`)
    }

    if (!leagueForFixture && leagueType) {
      leagueForFixture = findLeagueByType(leagueType, leagues)
      console.log(`[DEBUG] Línea ${idx + 1}: Usando leagueType "${leagueType}" = "${leagueForFixture?.name}"`)
    }

    if (!leagueForFixture && !inlineType && !leagueType && defaultLeague) {
      leagueForFixture = defaultLeague
      fallbackLeagueUsed = true
      console.log(`[DEBUG] Línea ${idx + 1}: Usando defaultLeague = "${defaultLeague.name}"`)
    }

    if (!leagueForFixture) {
      errors.push(`Línea ${idx + 1}: No se pudo determinar la liga.`)
      processedLines.push({
        lineNumber: idx + 1,
        rawText: originalLine,
        status: "skipped",
        message: "Liga no reconocida",
      })
      return
    }

    leagueType = leagueType || inferLeagueTypeFromLeague(leagueForFixture)
    // Solo actualizar currentLeague si NO se usó el fallback default
    // Esto permite que los encabezados de liga posteriores se respeten
    if (!fallbackLeagueUsed || leagueOverride || inlineType) {
      currentLeague = leagueForFixture
      currentLeagueType = leagueType
    }
    // Resetear flag después de usarlo
    if (fallbackLeagueUsed) fallbackLeagueUsed = false

    let homeResult = resolveTeam(
      cleanToken(homeRaw),
      teamMap,
      teams,
      normalizeName,
      teamsById,
      { leagueType },
    )
    let awayResult = resolveTeam(
      cleanToken(awayRaw),
      teamMap,
      teams,
      normalizeName,
      teamsById,
      { leagueType },
    )

    if (!homeResult.team && awayResult.team) {
      homeResult = resolveTeam(
        cleanToken(homeRaw),
        teamMap,
        teams,
        normalizeName,
        teamsById,
        { leagueType, opponentTeam: awayResult.team },
      )
    }
    if (!awayResult.team && homeResult.team) {
      awayResult = resolveTeam(
        cleanToken(awayRaw),
        teamMap,
        teams,
        normalizeName,
        teamsById,
        { leagueType, opponentTeam: homeResult.team },
      )
    }

    const issues: string[] = []
    if (!homeResult.team && homeResult.issue) issues.push(homeResult.issue)
    if (!awayResult.team && awayResult.issue) issues.push(awayResult.issue)

    if (homeResult.lineInfo.autoCorrected) {
      warnings.push(
        `Línea ${idx + 1}: Se corrigió automáticamente "${homeRaw}" a "${homeResult.lineInfo.resolvedName}".`,
      )
    }
    if (awayResult.lineInfo.autoCorrected) {
      warnings.push(
        `Línea ${idx + 1}: Se corrigió automáticamente "${awayRaw}" a "${awayResult.lineInfo.resolvedName}".`,
      )
    }

    const hasError = issues.length > 0

    if (hasError) {
      errors.push(...issues)
      processedLines.push({
        lineNumber: idx + 1,
        rawText: originalLine,
        status: "skipped",
        message: issues.join(" | "),
        leagueName: leagueForFixture.name,
        leagueType,
        home: homeResult.lineInfo,
        away: awayResult.lineInfo,
      })
      return
    }

    const homeTeam = homeResult.team!
    const awayTeam = awayResult.team!

    // Inferir tipo de liga por categorías si aún no está definido y no hubo override/encabezado
    if (!inlineType && !currentLeagueType && !leagueOverride) {
      const hNorm = normalizeName(homeTeam.name)
      const aNorm = normalizeName(awayTeam.name)
      const cats: Array<LeagueType | undefined> = []
      const homeCats: LeagueType[] = [
        LA_TEAMS.has(hNorm) ? "LA" : undefined,
        LF_TEAMS.has(hNorm) ? "LF" : undefined,
        LN_TEAMS.has(hNorm) ? "LN" : undefined,
      ].filter(Boolean) as LeagueType[]
      const awayCats: LeagueType[] = [
        LA_TEAMS.has(aNorm) ? "LA" : undefined,
        LF_TEAMS.has(aNorm) ? "LF" : undefined,
        LN_TEAMS.has(aNorm) ? "LN" : undefined,
      ].filter(Boolean) as LeagueType[]
      const common = homeCats.find((c) => awayCats.includes(c))
      if (common) {
        leagueType = common
        const inferred = findLeagueByType(common, leagues)
        if (inferred) {
          leagueForFixture = inferred
        }
      }
    }

    fixtures.push({
      id: generateId(),
      leagueId: leagueForFixture.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
    })

    processedLines.push({
      lineNumber: idx + 1,
      rawText: originalLine,
      status: "added",
      message: `${homeTeam.name} vs ${awayTeam.name}`,
      leagueName: leagueForFixture.name,
      leagueType,
      home: homeResult.lineInfo,
      away: awayResult.lineInfo,
    })
  })

  return { fixtures, errors, warnings, processedLines };
}

function resolveTeam(
  raw: string,
  teamMap: Map<string, TeamMatchEntry[]>,
  teams: Team[],
  normalizeName: (value: string) => string,
  teamsById: Map<string, Team>,
  context?: {
    leagueType?: LeagueType
    opponentTeam?: Team | null
  },
): {
  team: Team | null
  issue: string | null
  lineInfo: TeamLineInfo
} {
  const normalized = normalizeName(raw)
  const normalizedRaw = normalized

  const findTeamByNorm = (norm: string) => {
    const matches = teamMap.get(norm) || []
    return matches[0]?.team || teams.find((t) => normalizeName(t.name) === norm) || null
  }

  const teamInSet = (team: Team, set: Set<string>) => set.has(normalizeName(team.name))
  const isTeamLAOnly = (team: Team) => {
    const n = normalizeName(team.name)
    return LA_TEAMS.has(n) && !LN_TEAMS.has(n) && !LF_TEAMS.has(n)
  }
  const isTeamLNOnly = (team: Team) => {
    const n = normalizeName(team.name)
    return LN_TEAMS.has(n) && !LA_TEAMS.has(n) && !LF_TEAMS.has(n)
  }
  const opponentIsLAOnly = context?.opponentTeam ? isTeamLAOnly(context.opponentTeam) : false
  const opponentIsLNOnly = context?.opponentTeam ? isTeamLNOnly(context.opponentTeam) : false

  const pickGelpForGimnasia = () => {
    return findTeamByNorm("gelp")
  }

  const pickGimnasiaCr = () => {
    return findTeamByNorm("gimnasia cr")
  }

  const pickRacingByContext = () => {
    if (context?.leagueType === "LA" || opponentIsLAOnly) {
      return findTeamByNorm("racing avellaneda")
    }
    if (context?.leagueType === "LN" || opponentIsLNOnly) {
      return findTeamByNorm("racing ch")
    }
    return null
  }

  // Disambiguation rules for Unión
  if (normalized === "union" || normalized === "la union") {
    // simple normalization that preserves tokens
    const simple = (s: string) => s
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    const nameNorm = (t: Team) => simple(t.name + " " + (t.aliases || []).join(" "))

    // "Unión" (sin "la") → buscar "Union SF"
    const unionSF = teams.find((t) => {
      const n = nameNorm(t)
      return n.includes("union sf") || n.includes("union santa fe") || n.includes("santa fe")
    })

    // Candidatos a "La Unión": Colon vs Formosa
    const laUnionColon = teams.find((t) => {
      const n = nameNorm(t)
      return n.includes("la union c") || n.includes("colon")
    })
    const laUnionFormosa = teams.find((t) => {
      const n = nameNorm(t)
      return n.includes("la union") || n.includes("formosa")
    })

    let chosen: Team | undefined
    if (normalized === "union") {
      chosen = unionSF
    } else {
      // por defecto preferir Colón (La Unión C); si el texto claramente apunta a Formosa, usar Formosa
      const rawSimple = simple(raw)
      const mentionsFormosa = /formosa/.test(rawSimple)
      chosen = mentionsFormosa ? laUnionFormosa : (laUnionColon || laUnionFormosa)
    }

    if (chosen) {
      return {
        team: chosen,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: chosen.name,
          matchedByAlias: true,
          suggestions: [],
          autoCorrected: false,
          distance: 0,
        },
      }
    }
  }
  const directMatches = normalized ? teamMap.get(normalized) || [] : []

  // Caso especial: "Racing" según liga/contexto
  if (directMatches.length === 0 && normalizedRaw === "racing") {
    const racingTeam = pickRacingByContext()
    if (racingTeam) {
      return {
        team: racingTeam,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: racingTeam.name,
          matchedByAlias: false,
          suggestions: [],
          autoCorrected: true,
          distance: 0,
        },
      }
    }
  }

  // Caso especial: "Gimnasia" en contexto LA
  if (
    directMatches.length === 0 &&
    normalizedRaw === "gimnasia" &&
    (context?.leagueType === "LA" || opponentIsLAOnly)
  ) {
    const gelpTeam = pickGelpForGimnasia()
    if (gelpTeam) {
      return {
        team: gelpTeam,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: gelpTeam.name,
          matchedByAlias: false,
          suggestions: [],
          autoCorrected: true,
          distance: 0,
        },
      }
    }
  }

  // Caso especial: "Gimnasia" en contexto LN
  if (
    directMatches.length === 0 &&
    normalizedRaw === "gimnasia" &&
    (context?.leagueType === "LN" || opponentIsLNOnly)
  ) {
    const gimnasiaCr = pickGimnasiaCr()
    if (gimnasiaCr) {
      return {
        team: gimnasiaCr,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: gimnasiaCr.name,
          matchedByAlias: false,
          suggestions: [],
          autoCorrected: true,
          distance: 0,
        },
      }
    }
  }

  if (directMatches.length === 1) {
    const entry = directMatches[0]
    return {
      team: entry.team,
      issue: null,
      lineInfo: {
        raw,
        resolvedName: entry.team.name,
        matchedByAlias: entry.source === "alias",
        suggestions: [],
        autoCorrected: false,
        distance: 0,
      },
    }
  }

  if (directMatches.length > 1) {
    // Desambiguar por tipo de liga si hay contexto
    if (context?.leagueType) {
      const leagueFiltered = directMatches.filter((e) => {
        const n = normalizeName(e.team.name)
        if (context.leagueType === "LA") return LA_TEAMS.has(n)
        if (context.leagueType === "LN") return LN_TEAMS.has(n)
        if (context.leagueType === "LF") return LF_TEAMS.has(n)
        return false
      })
      if (leagueFiltered.length === 1) {
        const chosen = leagueFiltered[0]
        return {
          team: chosen.team,
          issue: null,
          lineInfo: {
            raw,
            resolvedName: chosen.team.name,
            matchedByAlias: chosen.source === "alias",
            suggestions: directMatches.map((entry) => ({
              teamId: entry.team.id,
              name: entry.team.name,
              reason: `Coincidencia por liga ${context.leagueType}`,
              distance: 0,
            })),
            autoCorrected: true,
            distance: 0,
          },
        }
      }
    }

    if (opponentIsLAOnly) {
      const laOnly = directMatches.filter((e) => teamInSet(e.team, LA_TEAMS))
      if (laOnly.length === 1) {
        const chosen = laOnly[0]
        return {
          team: chosen.team,
          issue: null,
          lineInfo: {
            raw,
            resolvedName: chosen.team.name,
            matchedByAlias: chosen.source === "alias",
            suggestions: directMatches.map((entry) => ({
              teamId: entry.team.id,
              name: entry.team.name,
              reason: "Coincidencia por rival LA",
              distance: 0,
            })),
            autoCorrected: true,
            distance: 0,
          },
        }
      }
    }

    // Preferir coincidencia exacta por nombre normalizado del equipo
    const rawNorm = normalizeName(raw)
    const exactByName = directMatches.filter((e) => normalizeName(e.team.name) === rawNorm)
    if (exactByName.length >= 1) {
      const chosen = exactByName[0]
      return {
        team: chosen.team,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: chosen.team.name,
          matchedByAlias: chosen.source === "alias",
          suggestions: directMatches.map((entry) => ({ teamId: entry.team.id, name: entry.team.name, reason: "Coincidencia exacta normalizada", distance: 0 })),
          autoCorrected: false,
          distance: 0,
        },
      }
    }

    // Desambiguar usando la menor distancia de Levenshtein al texto original
    const scored = directMatches.map((entry) => {
      const candidates = [entry.team.name, ...(entry.team.aliases || [])]
      const d = Math.min(
        ...candidates.map((c) => levenshteinDistance(rawNorm, normalizeName(c)))
      )
      return { entry, distance: d }
    }).sort((a, b) => a.distance - b.distance)

    if (scored.length && Number.isFinite(scored[0].distance)) {
      const best = scored[0]
      // si hay empate claro, mantener ambigüedad
      if (scored.length === 1 || scored[0].distance < scored[1].distance) {
        const t = best.entry.team
        return {
          team: t,
          issue: null,
          lineInfo: {
            raw,
            resolvedName: t.name,
            matchedByAlias: best.entry.source === "alias",
            suggestions: scored.map((s) => ({ teamId: s.entry.team.id, name: s.entry.team.name, reason: `Distancia ${s.distance}`, distance: s.distance })),
            autoCorrected: false,
            distance: best.distance,
          },
        }
      }
    }

    return {
      team: null,
      issue: `El nombre "${raw.trim()}" es ambiguo: hay más de un equipo con ese alias/nombre`,
      lineInfo: {
        raw,
        suggestions: directMatches.map((entry) => ({
          teamId: entry.team.id,
          name: entry.team.name,
          reason: entry.source === "alias" ? "Coincidencia exacta por alias" : "Coincidencia exacta por nombre",
          distance: 0,
        })),
      },
    }
  }

  const suggestions = getTeamSuggestions(raw, teams, normalizeName)
  const bestSuggestion = suggestions[0]

  if (bestSuggestion && bestSuggestion.distance <= AUTOCORRECT_DISTANCE_THRESHOLD) {
    const bestTeam = teamsById.get(bestSuggestion.teamId)
    if (bestTeam) {
      return {
        team: bestTeam,
        issue: null,
        lineInfo: {
          raw,
          resolvedName: bestTeam.name,
          matchedByAlias: false,
          suggestions,
          autoCorrected: true,
          distance: bestSuggestion.distance,
        },
      }
    }
  }

  return {
    team: null,
    issue: `Equipo no encontrado "${raw.trim()}"`,
    lineInfo: {
      raw,
      suggestions,
      autoCorrected: false,
    },
  }
}

function getTeamSuggestions(
  raw: string,
  teams: Team[],
  normalizeName: (value: string) => string,
  limit = 3,
): TeamSuggestion[] {
  const normalizedRaw = normalizeName(raw)
  if (!normalizedRaw) return []

  const scored = teams.map((team) => {
    const distances = [team.name, ...(team.aliases || [])]
      .map((candidate) => levenshteinDistance(normalizedRaw, normalizeName(candidate)))
      .filter((distance) => Number.isFinite(distance))

    const bestDistance = distances.length ? Math.min(...distances) : Number.POSITIVE_INFINITY
    return { team, distance: bestDistance }
  })

  return scored
    .filter((entry) => Number.isFinite(entry.distance))
    .sort((a, b) => a.distance - b.distance || a.team.name.localeCompare(b.team.name))
    .slice(0, limit)
    .map((entry) => ({
      teamId: entry.team.id,
      name: entry.team.name,
      reason: `Distancia ${entry.distance}`,
      distance: entry.distance,
    }));
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function normalizeName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // Intento 1: alias directo sobre el texto base ya limpiado
  if (TEAM_ALIASES[base]) {
    return TEAM_ALIASES[base]
  }

  const tokens = base.split(" ").filter(Boolean)
  if (tokens.length === 0) return ""

  const stopwords = new Set([
    "club","de","juniors","junior","asociacion","asociación","atletico","atlético","basket","basquet","basquetbol","básquet",
    "c","ca","bc","sa","y","the","el","los","las","del","fc","bc"
  ])
  const extended = new Set(["san","santo","union","unión"]) // preservar si es único token

  let kept: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    // Preserve 'liga' always (for league names)
    if (t === "liga") {
      kept.push(t)
      continue
    }
    // Preserve 'la' when followed by 'union' to differentiate 'La Unión' vs 'Unión'
    if (t === "la" && (tokens[i+1] === "union")) {
      kept.push(t)
      continue
    }
    if (stopwords.has(t)) continue
    if (extended.has(t)) {
      const others = tokens.filter((x, idx) => idx !== i && !stopwords.has(x))
      if (others.length === 0) kept.push(t)
      continue
    }
    kept.push(t)
  }

  let normalized = kept.join(" ").trim()
  if (!normalized) normalized = tokens[0] // fallback mínimo

  // Intento 2: aplicar alias sobre el normalizado
  if (TEAM_ALIASES[normalized]) {
    normalized = TEAM_ALIASES[normalized]
  }

  const corrections: { [key: string]: string } = {
    "voka": "boca",
    "vokita": "boca",
    "bokita": "boca",
    "quimza": "quimsa",
    "quinza": "quimsa",
    "rriver": "river",
    "riber": "river",
    "indpte": "independiente",
    "indte": "independiente",
    "sanloren": "san lorenzo",
    "sanlo": "san lorenzo",
    "obera tc": "obera",
    "oberatc": "obera",
    "sanmartin": "san martin",
    "sanmartinc": "san martin corrientes",
    "sanmartinctes": "san martin corrientes",
    "gimnasia de comodoro": "gimnasia cr",
    "gimnasia de comodoro rivadavia": "gimnasia cr",
    "union de santa fe": "union sf",
  }

  return corrections[normalized] || normalized
}
