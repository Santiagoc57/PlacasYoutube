"use client"

import type { ChangeEvent, Dispatch, SetStateAction } from "react"
import { useMemo } from "react"
import { Download, Home, Plane, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import type { Team, League } from "@/lib/types"
import { Button } from "@/components/ui/button"

type GlobalLogoOffset = {
  home: { x: number; y: number }
  away: { x: number; y: number }
}

interface PreviewControlsProps {
  teams: Team[]
  leagues: League[]
  homeTeam: Team | undefined
  awayTeam: Team | undefined
  homeColor: string
  setHomeColor: (color: string) => void
  awayColor: string
  setAwayColor: (color: string) => void
  homeColorBrightness: number
  setHomeColorBrightness: (brightness: number) => void
  awayColorBrightness: number
  setAwayColorBrightness: (brightness: number) => void
  leagueLogoSize: number
  setLeagueLogoSize: (size: number) => void
  selectedLeagueId: string
  setSelectedLeagueId: (id: string) => void
  customLeagueLogo: string | null
  setCustomLeagueLogo: (logo: string | null) => void
  homeLogoSize: number
  setHomeLogoSize: (size: number) => void
  awayLogoSize: number
  setAwayLogoSize: (size: number) => void
  globalLogoOffset: GlobalLogoOffset
  setGlobalLogoOffset: Dispatch<SetStateAction<GlobalLogoOffset>>
  onLeagueLogoUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyTempTeams: () => void | undefined
  onDownload: () => void
}

function readSliderValue(values: number[]): number | null {
  const firstValue = values?.[0]
  if (!Number.isFinite(firstValue)) return null
  return firstValue
}

export function PreviewControls({
  leagues,
  homeTeam,
  awayTeam,
  homeColor,
  setHomeColor,
  awayColor,
  setAwayColor,
  homeColorBrightness,
  setHomeColorBrightness,
  awayColorBrightness,
  setAwayColorBrightness,
  leagueLogoSize,
  setLeagueLogoSize,
  selectedLeagueId,
  setSelectedLeagueId,
  customLeagueLogo,
  setCustomLeagueLogo,
  homeLogoSize,
  setHomeLogoSize,
  awayLogoSize,
  setAwayLogoSize,
  globalLogoOffset,
  setGlobalLogoOffset,
  onLeagueLogoUpload,
  onApplyTempTeams,
  onDownload,
}: PreviewControlsProps) {
  const leagueOptions = useMemo<ComboboxOption[]>(
    () =>
      leagues
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((league) => ({ value: league.id, label: league.name })),
    [leagues],
  )

  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId)

  const leagueLogoSlider = useMemo(() => [leagueLogoSize], [leagueLogoSize])
  const awayLogoSlider = useMemo(() => [awayLogoSize], [awayLogoSize])
  const homeLogoSlider = useMemo(() => [homeLogoSize], [homeLogoSize])
  const awayXSlider = useMemo(() => [globalLogoOffset.away.x], [globalLogoOffset.away.x])
  const awayYSlider = useMemo(() => [globalLogoOffset.away.y], [globalLogoOffset.away.y])
  const homeXSlider = useMemo(() => [globalLogoOffset.home.x], [globalLogoOffset.home.x])
  const homeYSlider = useMemo(() => [globalLogoOffset.home.y], [globalLogoOffset.home.y])
  const awayBrightnessSlider = useMemo(() => [awayColorBrightness], [awayColorBrightness])
  const homeBrightnessSlider = useMemo(() => [homeColorBrightness], [homeColorBrightness])

  const updateLogoOffset = (side: "home" | "away", axis: "x" | "y", value: number) => {
    setGlobalLogoOffset((prev) => {
      if (prev[side][axis] === value) return prev
      return {
        ...prev,
        [side]: {
          ...prev[side],
          [axis]: value,
        },
      }
    })
  }

  return (
    <aside className="h-full space-y-5">
      <div className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-orange-200 bg-white/90 px-3 py-2 backdrop-blur">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Panel de Controles
        </h3>
        {onApplyTempTeams && (
          <Button variant="outline" size="sm" className="border-orange-200" onClick={onApplyTempTeams}>
            <RefreshCw className="h-4 w-4" />
            Aplicar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <section className="space-y-3 rounded-lg border border-orange-200 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liga y Branding</h4>
          <SearchableCombobox
            value={selectedLeagueId}
            onValueChange={setSelectedLeagueId}
            options={leagueOptions}
            placeholder="Selecciona liga"
            buttonClassName="h-10 border-orange-200 bg-white"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {customLeagueLogo ? (
                <img src={customLeagueLogo} alt="Logo personalizado" className="h-8 w-8 rounded border bg-white object-contain p-1" />
              ) : selectedLeague ? (
                <img src={selectedLeague.logo} alt={selectedLeague.name} className="h-8 w-8 rounded border bg-white object-contain p-1" />
              ) : null}
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">{selectedLeague?.name || "Sin liga"}</span>
            </div>

            <label className="cursor-pointer rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100">
              Subir logo
              <input type="file" accept="image/*" onChange={onLeagueLogoUpload} className="hidden" />
            </label>
          </div>

          {customLeagueLogo && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-600" onClick={() => setCustomLeagueLogo(null)} type="button">
              Quitar logo personalizado
            </Button>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escala logo liga</span>
              <span>{Math.round(leagueLogoSize * 100)}%</span>
            </div>
            <Slider
              value={leagueLogoSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                const rounded = Number(next.toFixed(2))
                if (rounded !== leagueLogoSize) setLeagueLogoSize(rounded)
              }}
              min={0.5}
              max={2}
              step={0.05}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-orange-200 bg-white p-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Plane className="h-3.5 w-3.5" />
            Logo Visitante (Izquierda)
          </h4>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escala</span>
              <span>{Math.round(awayLogoSize * 100)}%</span>
            </div>
            <Slider
              value={awayLogoSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                const rounded = Number(next.toFixed(2))
                if (rounded !== awayLogoSize) setAwayLogoSize(rounded)
              }}
              min={0.3}
              max={2}
              step={0.05}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Posición X</span>
              <span>{globalLogoOffset.away.x}</span>
            </div>
            <Slider
              value={awayXSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                updateLogoOffset("away", "x", Math.round(next))
              }}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Posición Y</span>
              <span>{globalLogoOffset.away.y}</span>
            </div>
            <Slider
              value={awayYSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                updateLogoOffset("away", "y", Math.round(next))
              }}
              min={-50}
              max={50}
              step={1}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-orange-200 bg-white p-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            Logo Local (Derecha)
          </h4>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escala</span>
              <span>{Math.round(homeLogoSize * 100)}%</span>
            </div>
            <Slider
              value={homeLogoSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                const rounded = Number(next.toFixed(2))
                if (rounded !== homeLogoSize) setHomeLogoSize(rounded)
              }}
              min={0.3}
              max={2}
              step={0.05}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Posición X</span>
              <span>{globalLogoOffset.home.x}</span>
            </div>
            <Slider
              value={homeXSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                updateLogoOffset("home", "x", Math.round(next))
              }}
              min={-50}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Posición Y</span>
              <span>{globalLogoOffset.home.y}</span>
            </div>
            <Slider
              value={homeYSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                updateLogoOffset("home", "y", Math.round(next))
              }}
              min={-50}
              max={50}
              step={1}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-orange-200 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colores y Brillo</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Color Visitante</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={awayColor || awayTeam?.primaryColor || "#ffffff"}
                  onChange={(event) => setAwayColor(event.target.value)}
                  className="h-8 w-8 rounded border"
                />
                <span className="max-w-[110px] truncate text-xs text-muted-foreground">{awayTeam?.name || "Visitante"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Brillo fondo (izq)</span>
              <span>{awayColorBrightness}%</span>
            </div>
            <Slider
              value={awayBrightnessSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                const rounded = Math.round(next)
                if (rounded !== awayColorBrightness) setAwayColorBrightness(rounded)
              }}
              min={50}
              max={150}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Color Local</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={homeColor || homeTeam?.primaryColor || "#ffffff"}
                  onChange={(event) => setHomeColor(event.target.value)}
                  className="h-8 w-8 rounded border"
                />
                <span className="max-w-[110px] truncate text-xs text-muted-foreground">{homeTeam?.name || "Local"}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Brillo fondo (der)</span>
              <span>{homeColorBrightness}%</span>
            </div>
            <Slider
              value={homeBrightnessSlider}
              onValueChange={(values) => {
                const next = readSliderValue(values)
                if (next === null) return
                const rounded = Math.round(next)
                if (rounded !== homeColorBrightness) setHomeColorBrightness(rounded)
              }}
              min={50}
              max={150}
              step={5}
            />
          </div>
        </section>
      </div>

      <Button onClick={onDownload} className="w-full gap-2 bg-primary hover:bg-primary/90">
        <Download className="h-4 w-4" />
        Descargar Imagen
      </Button>
    </aside>
  )
}
