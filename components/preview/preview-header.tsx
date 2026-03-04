"use client"

import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import type { Team, League } from "@/lib/types"
import { useMemo } from "react"

interface PreviewHeaderProps {
  teams: Team[]
  leagues: League[]
  homeTeam: Team | undefined
  awayTeam: Team | undefined
  tempHomeTeamId: string
  setTempHomeTeamId: (id: string) => void
  tempAwayTeamId: string
  setTempAwayTeamId: (id: string) => void
  leagueForRender: (League & { logo: string }) | undefined
}

export function PreviewHeader({
  teams,
  homeTeam,
  awayTeam,
  tempHomeTeamId,
  setTempHomeTeamId,
  tempAwayTeamId,
  setTempAwayTeamId,
  leagueForRender,
}: PreviewHeaderProps) {
  const teamOptions = useMemo<ComboboxOption[]>(
    () =>
      teams
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => ({
          value: team.id,
          label: team.name,
          description: team.aliases?.length ? `Alias: ${team.aliases.join(", ")}` : undefined,
        })),
    [teams],
  )

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">Lienzo de Previsualización</h3>
          <p className="text-sm text-muted-foreground">
            {awayTeam?.name || "Visitante"} vs {homeTeam?.name || "Local"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5">
          {leagueForRender?.logo ? (
            <img src={leagueForRender.logo} alt={leagueForRender.name} className="h-6 w-6 object-contain" />
          ) : null}
          <span className="max-w-[220px] truncate text-xs font-semibold text-orange-700">
            {leagueForRender?.name || "Sin liga seleccionada"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logo visitante (izquierda)</span>
          <SearchableCombobox
            value={tempAwayTeamId}
            onValueChange={setTempAwayTeamId}
            options={teamOptions}
            placeholder="Selecciona visitante"
            buttonClassName="h-10 border-orange-200 bg-white"
          />
        </div>

        <div className="flex items-center justify-center self-end pb-2 text-sm font-bold text-primary">VS</div>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logo local (derecha)</span>
          <SearchableCombobox
            value={tempHomeTeamId}
            onValueChange={setTempHomeTeamId}
            options={teamOptions}
            placeholder="Selecciona local"
            buttonClassName="h-10 border-orange-200 bg-white"
          />
        </div>
      </div>
    </div>
  )
}
