import { useState, useEffect, useCallback } from "react"
import type { Team, Fixture, League } from "@/lib/types"

export type GlobalLogoOffset = {
  home: { x: number; y: number }
  away: { x: number; y: number }
}

interface UsePreviewProps {
  teams: Team[]
  leagues: League[]
  selectedFixture: Fixture | null
  setSelectedFixture: (fixture: Fixture | null) => void
  setFixtures: React.Dispatch<React.SetStateAction<Fixture[]>>
}

// Función auxiliar para normalizar nombres (la misma que ya existe)
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase()
    .replace(/\b(club|de|juniors?|asociacion|asociación|atletico|atlético|basket|basquet|básquet|c\.a\.?|c\.?|b\.c\.?|b\.?|s\.a\.?|s\.?|y|the|el|la|los|las|del|san|santo|union|unión|ufc?\.?|uf)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function usePreview({ teams, leagues, selectedFixture, setSelectedFixture, setFixtures }: UsePreviewProps) {
  // --- GLOBAL LOGO OFFSET STATE ---
  const [globalLogoOffset, setGlobalLogoOffset] = useState<GlobalLogoOffset>({
    home: { x: -3, y: 0 },
    away: { x: 3, y: 0 },
  })

  // Estados
  const [homeColor, setHomeColor] = useState<string>("")
  const [awayColor, setAwayColor] = useState<string>("")
  const [homeColorBrightness, setHomeColorBrightness] = useState(100)
  const [awayColorBrightness, setAwayColorBrightness] = useState(100)
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("")
  const [customLeagueLogo, setCustomLeagueLogo] = useState<string | null>(null)
  const [tempHomeTeamId, setTempHomeTeamId] = useState<string>("")
  const [tempAwayTeamId, setTempAwayTeamId] = useState<string>("")
  const [homeLogoSize, setHomeLogoSize] = useState<number>(1.3)
  const [awayLogoSize, setAwayLogoSize] = useState<number>(1.3)

  // Persistencia por partido
  const [previewStateByFixture, setPreviewStateByFixture] = useState<
    Record<
      string,
      {
        homeColor: string
        awayColor: string
        homeColorBrightness: number
        awayColorBrightness: number
        selectedLeagueId: string
        customLeagueLogo: string | null
        tempHomeTeamId: string
        tempAwayTeamId: string
        homeLogoSize: number
        awayLogoSize: number
      }
    >
  >({})

  const getDefaultLogoSizeForTeamName = useCallback((teamName: string): number => {
    const n = normalizeName(teamName)
    if (n === normalizeName("GELP") || n.includes("gimnasia") || n.includes("gelp")) return 1.6
    if (n.includes("quilmes")) return 1.55
    return 1.3
  }, [])

  // Sincronizar/restaurar estados de vista previa al seleccionar un fixture
  useEffect(() => {
    if (!selectedFixture) return
    const saved = previewStateByFixture[selectedFixture.id]
    if (saved) {
      if (homeColor !== saved.homeColor) setHomeColor(saved.homeColor)
      if (awayColor !== saved.awayColor) setAwayColor(saved.awayColor)
      if (homeColorBrightness !== saved.homeColorBrightness) setHomeColorBrightness(saved.homeColorBrightness)
      if (awayColorBrightness !== saved.awayColorBrightness) setAwayColorBrightness(saved.awayColorBrightness)
      if (selectedLeagueId !== saved.selectedLeagueId) setSelectedLeagueId(saved.selectedLeagueId)
      if (customLeagueLogo !== saved.customLeagueLogo) setCustomLeagueLogo(saved.customLeagueLogo)
      if (tempHomeTeamId !== saved.tempHomeTeamId) setTempHomeTeamId(saved.tempHomeTeamId)
      if (tempAwayTeamId !== saved.tempAwayTeamId) setTempAwayTeamId(saved.tempAwayTeamId)
      if (homeLogoSize !== saved.homeLogoSize) setHomeLogoSize(saved.homeLogoSize)
      if (awayLogoSize !== saved.awayLogoSize) setAwayLogoSize(saved.awayLogoSize)
      return
    }
    // Si no hay estado guardado, inicializar desde el fixture y equipos
    const homeTeam = teams.find((t) => t.id === selectedFixture.homeTeamId)
    const awayTeam = teams.find((t) => t.id === selectedFixture.awayTeamId)
    const league = leagues.find((l) => l.id === selectedFixture.leagueId)
    if (homeTeam) setHomeColor(homeTeam.primaryColor || "")
    if (awayTeam) setAwayColor(awayTeam.primaryColor || "")
    setHomeColorBrightness(100)
    setAwayColorBrightness(100)
    setTempHomeTeamId(selectedFixture.homeTeamId)
    setTempAwayTeamId(selectedFixture.awayTeamId)
    if (league) setSelectedLeagueId(selectedFixture.leagueId)
    setCustomLeagueLogo(null)
    // tamaños por defecto por equipo
    if (homeTeam) setHomeLogoSize(getDefaultLogoSizeForTeamName(homeTeam.name))
    if (awayTeam) setAwayLogoSize(getDefaultLogoSizeForTeamName(awayTeam.name))
  }, [selectedFixture, teams, leagues, getDefaultLogoSizeForTeamName])

  // Cuando se cambia el equipo seleccionado en la vista previa, actualizar color y tamaño por defecto
  useEffect(() => {
    if (!tempHomeTeamId) return
    const t = teams.find((x) => x.id === tempHomeTeamId)
    if (t) {
      if (homeColor !== t.primaryColor) setHomeColor(t.primaryColor)
      const sz = getDefaultLogoSizeForTeamName(t.name)
      if (homeLogoSize !== sz) setHomeLogoSize(sz)
    }
  }, [tempHomeTeamId, teams, getDefaultLogoSizeForTeamName])

  useEffect(() => {
    if (!tempAwayTeamId) return
    const t = teams.find((x) => x.id === tempAwayTeamId)
    if (t) {
      if (awayColor !== t.primaryColor) setAwayColor(t.primaryColor)
      const sz = getDefaultLogoSizeForTeamName(t.name)
      if (awayLogoSize !== sz) setAwayLogoSize(sz)
    }
  }, [tempAwayTeamId, teams, getDefaultLogoSizeForTeamName])

  // Guardar automáticamente cambios de vista previa por fixture
  useEffect(() => {
    if (!selectedFixture) return
    setPreviewStateByFixture((prev) => {
      const prevSnap = prev[selectedFixture.id]
      const nextSnap = {
        homeColor,
        awayColor,
        homeColorBrightness,
        awayColorBrightness,
        selectedLeagueId,
        customLeagueLogo,
        tempHomeTeamId,
        tempAwayTeamId,
        homeLogoSize,
        awayLogoSize,
      }
      
      // Simple shallow comparison for performance
      const unchanged =
        prevSnap &&
        prevSnap.homeColor === nextSnap.homeColor &&
        prevSnap.awayColor === nextSnap.awayColor &&
        prevSnap.homeColorBrightness === nextSnap.homeColorBrightness &&
        prevSnap.awayColorBrightness === nextSnap.awayColorBrightness &&
        prevSnap.selectedLeagueId === nextSnap.selectedLeagueId &&
        prevSnap.customLeagueLogo === nextSnap.customLeagueLogo &&
        prevSnap.tempHomeTeamId === nextSnap.tempHomeTeamId &&
        prevSnap.tempAwayTeamId === nextSnap.tempAwayTeamId &&
        prevSnap.homeLogoSize === nextSnap.homeLogoSize &&
        prevSnap.awayLogoSize === nextSnap.awayLogoSize
        
      if (unchanged) return prev
      return { ...prev, [selectedFixture.id]: nextSnap }
    })
  }, [
    selectedFixture,
    homeColor,
    awayColor,
    homeColorBrightness,
    awayColorBrightness,
    selectedLeagueId,
    customLeagueLogo,
    tempHomeTeamId,
    tempAwayTeamId,
    homeLogoSize,
    awayLogoSize,
  ])

  // Vista previa rápida de un equipo
  const handlePreviewTeam = (team: Team) => {
    // Buscar otro equipo para visitante
    const otherTeam = teams.find((t) => t.id !== team.id) || team
    const previewFixture: Fixture = {
      id: "preview",
      homeTeamId: team.id,
      awayTeamId: otherTeam.id,
      leagueId: leagues[0]?.id || "",
      date: new Date().toISOString(),
    }
    setSelectedFixture(previewFixture)
    // setActiveTab("preview") // This needs to be handled in the parent component
  }

  // Actualizar los equipos del fixture activo desde los selects temporales
  const handleUpdateFixtureTeams = () => {
    if (!selectedFixture) return
    const updatedFixture = {
      ...selectedFixture,
      homeTeamId: tempHomeTeamId,
      awayTeamId: tempAwayTeamId,
    }
    setFixtures((prev) => prev.map((f) => (f.id === selectedFixture.id ? updatedFixture : f)))
    setSelectedFixture(updatedFixture)
  }

  return {
    state: {
      globalLogoOffset,
      homeColor,
      awayColor,
      homeColorBrightness,
      awayColorBrightness,
      selectedLeagueId,
      customLeagueLogo,
      tempHomeTeamId,
      tempAwayTeamId,
      homeLogoSize,
      awayLogoSize,
    },
    actions: {
      setGlobalLogoOffset,
      setHomeColor,
      setAwayColor,
      setHomeColorBrightness,
      setAwayColorBrightness,
      setSelectedLeagueId,
      setCustomLeagueLogo,
      setTempHomeTeamId,
      setTempAwayTeamId,
      setHomeLogoSize,
      setAwayLogoSize,
      handlePreviewTeam,
      handleUpdateFixtureTeams,
    },
  }
}
