"use client"

import type { ChangeEvent } from "react"
import { useMemo, useState } from "react"
import type { Team, Fixture, League } from "@/lib/types"
import { resolveLeagueLogo, buildFixtureFilename, downloadImage } from "@/lib/utils"
import { PreviewHeader } from "./preview/preview-header"
import { PreviewCanvas } from "./preview/preview-canvas"
import { PreviewControls } from "./preview/preview-controls"
import type { usePreview } from "@/hooks/use-preview"

function getLeagueShortLabel(leagueName: string): string {
  const normalizedName = leagueName.toLowerCase()
  if (normalizedName.includes("femenina")) return "LF"
  if (normalizedName.includes("nacional")) return "LN"
  if (normalizedName.includes("argentina")) return "LA"
  return leagueName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3)
}

interface ThumbnailPreviewProps {
  teams: Team[]
  leagues: League[]
  fixtures: Fixture[]
  fixture: Fixture | null
  onSelectFixture: (fixture: Fixture) => void
  previewState: ReturnType<typeof usePreview>["state"]
  previewActions: ReturnType<typeof usePreview>["actions"]
  imagesLoaded?: boolean
}

export default function ThumbnailPreview({
  teams,
  leagues,
  fixtures,
  fixture,
  onSelectFixture,
  previewState,
  previewActions,
  imagesLoaded = false,
}: ThumbnailPreviewProps) {
  const {
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
    globalLogoOffset,
  } = previewState

  const {
    setHomeColor,
    setAwayColor,
    setHomeColorBrightness,
    setAwayColorBrightness,
    setGlobalLogoOffset,
    setSelectedLeagueId,
    setCustomLeagueLogo,
    setTempHomeTeamId,
    setTempAwayTeamId,
    setHomeLogoSize,
    setAwayLogoSize,
    handleUpdateFixtureTeams,
  } = previewActions

  const [localLeagueLogoSize, setLocalLeagueLogoSize] = useState(1.5)

  const baseLeague = leagues.find((league) => league.id === fixture?.leagueId)
  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId)

  const leagueForRender = useMemo(() => {
    const targetLeague = selectedLeague || baseLeague
    if (!targetLeague) return undefined

    return {
      ...targetLeague,
      logo: customLeagueLogo || resolveLeagueLogo(targetLeague.id, targetLeague.logo),
    }
  }, [selectedLeague, baseLeague, customLeagueLogo])

  const homeTeam = teams.find((team) => team.id === fixture?.homeTeamId)
  const awayTeam = teams.find((team) => team.id === fixture?.awayTeamId)

  const fixtureChips = useMemo(() => {
    return fixtures
      .filter(
        (fixtureItem) =>
          teams.some((team) => team.id === fixtureItem.homeTeamId) && teams.some((team) => team.id === fixtureItem.awayTeamId),
      )
      .map((fixtureItem) => {
        const home = teams.find((team) => team.id === fixtureItem.homeTeamId)?.name || "-"
        const away = teams.find((team) => team.id === fixtureItem.awayTeamId)?.name || "-"
        const leagueName = leagues.find((league) => league.id === fixtureItem.leagueId)?.name || ""
        const league = getLeagueShortLabel(leagueName)
        const isSelected = fixture?.id === fixtureItem.id
        return { fixture: fixtureItem, home, away, league, isSelected }
      })
  }, [fixtures, teams, leagues, fixture?.id])

  const handleLeagueLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setCustomLeagueLogo(loadEvent.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = async () => {
    if (!fixture) return

    const canvas = document.getElementById(`canvas-${fixture.id}`) as HTMLCanvasElement | null
    if (!canvas || !homeTeam || !awayTeam) return

    const dataUrl = canvas.toDataURL("image/png")
    const leagueName = leagueForRender?.name
    const filename = buildFixtureFilename(leagueName, homeTeam.name, awayTeam.name)
    downloadImage(dataUrl, filename)
  }

  if (!fixture) {
    return (
      <div className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-6 text-center">
        <div>
          <h2 className="mb-2 text-xl font-semibold">Vista Previa de Portada</h2>
          <p className="text-muted-foreground">Selecciona un partido para generar una vista previa.</p>
        </div>
        <p className="text-sm text-muted-foreground">No hay partidos cargados.</p>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3 p-3 md:space-y-4 md:p-4">
          <PreviewHeader
            teams={teams}
            leagues={leagues}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            tempHomeTeamId={tempHomeTeamId}
            setTempHomeTeamId={setTempHomeTeamId}
            tempAwayTeamId={tempAwayTeamId}
            setTempAwayTeamId={setTempAwayTeamId}
            leagueForRender={leagueForRender}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
            <PreviewCanvas
              fixture={fixture}
              teams={teams}
              leagues={leagues}
              globalLogoOffset={globalLogoOffset}
              homeColor={homeColor}
              awayColor={awayColor}
              homeColorBrightness={homeColorBrightness}
              awayColorBrightness={awayColorBrightness}
              selectedLeagueId={selectedLeagueId}
              customLeagueLogo={customLeagueLogo}
              homeLogoSize={homeLogoSize}
              awayLogoSize={awayLogoSize}
              leagueLogoSize={localLeagueLogoSize}
            />
          </div>

          {fixtureChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fixtureChips.map((item) => (
                <button
                  key={item.fixture.id}
                  onClick={() => onSelectFixture(item.fixture)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors ${item.isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/25"
                    : "border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                >
                  {item.home} vs {item.away}
                  <span className="ml-2 text-[11px] text-muted-foreground">{item.league}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-3 md:p-4 lg:border-l lg:border-t-0">
          <PreviewControls
            teams={teams}
            leagues={leagues}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeColor={homeColor}
            setHomeColor={setHomeColor}
            awayColor={awayColor}
            setAwayColor={setAwayColor}
            homeColorBrightness={homeColorBrightness}
            setHomeColorBrightness={setHomeColorBrightness}
            awayColorBrightness={awayColorBrightness}
            setAwayColorBrightness={setAwayColorBrightness}
            leagueLogoSize={localLeagueLogoSize}
            setLeagueLogoSize={setLocalLeagueLogoSize}
            selectedLeagueId={selectedLeagueId}
            setSelectedLeagueId={setSelectedLeagueId}
            customLeagueLogo={customLeagueLogo}
            setCustomLeagueLogo={setCustomLeagueLogo}
            homeLogoSize={homeLogoSize}
            setHomeLogoSize={setHomeLogoSize}
            awayLogoSize={awayLogoSize}
            setAwayLogoSize={setAwayLogoSize}
            globalLogoOffset={globalLogoOffset}
            setGlobalLogoOffset={setGlobalLogoOffset}
            onLeagueLogoUpload={handleLeagueLogoUpload}
            onApplyTempTeams={handleUpdateFixtureTeams}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </section>
  )
}
