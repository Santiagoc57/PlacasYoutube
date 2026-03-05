"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import type { Fixture, League, Team } from "@/lib/types"
import { cn, generateId, resolveLeagueLogo } from "@/lib/utils"
import { parseFixtures, type ProcessedLineResult } from "@/lib/parse-fixtures"
import { AlertCircle, CalendarClock, CheckCircle2, Download, Eye, FileText, Trash2, XCircle } from "lucide-react"

interface FixtureGeneratorProps {
  teams: Team[]
  leagues: League[]
  fixtures: Fixture[]
  onAddFixture: (fixture: Fixture) => void
  onDeleteFixture: (fixtureId: string) => void
  onSelectFixture: (fixture: Fixture) => void
  onBulkAddFixtures: (fixtures: Fixture[]) => void
  onUpdateFixture: (fixtureId: string, changes: Partial<Fixture>) => void
  onClearAllFixtures: () => void
  onDownloadAll?: () => Promise<void> | void
  onDownloadSingle?: (fixture: Fixture) => Promise<void> | void
}

type EntryMode = "bulk" | "individual"

type ManualEntry = {
  leagueId: string
  homeTeamId: string
  awayTeamId: string
}

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

export default function FixtureGenerator({
  teams,
  leagues,
  fixtures,
  onAddFixture,
  onDeleteFixture,
  onSelectFixture,
  onBulkAddFixtures,
  onUpdateFixture,
  onClearAllFixtures,
  onDownloadAll,
  onDownloadSingle,
}: FixtureGeneratorProps) {
  const [entryMode, setEntryMode] = useState<EntryMode>("bulk")
  const [leagueId, setLeagueId] = useState("")
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [processingStatus, setProcessingStatus] = useState("")
  const [bulkErrors, setBulkErrors] = useState<string[]>([])
  const [bulkWarnings, setBulkWarnings] = useState<string[]>([])
  const [bulkResults, setBulkResults] = useState<ProcessedLineResult[]>([])
  const [manualEntries, setManualEntries] = useState<Record<number, ManualEntry>>({})
  const [manualAdded, setManualAdded] = useState<Record<number, boolean>>({})
  const [editingQuickMatch, setEditingQuickMatch] = useState<{ lineIndex: number; value: string } | null>(null)
  const [editingTeamCell, setEditingTeamCell] = useState<{ fixtureId: string; side: "home" | "away" } | null>(null)
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([])
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const getTeamById = (id: string) => teams.find((team) => team.id === id)
  const getLeagueById = (id: string) => leagues.find((league) => league.id === id)

  useEffect(() => {
    setSelectedFixtureIds((prev) => prev.filter((id) => fixtures.some((fixture) => fixture.id === id)))
    setEditingTeamCell((prev) => (prev && fixtures.some((fixture) => fixture.id === prev.fixtureId) ? prev : null))
  }, [fixtures])

  const leagueOptions = useMemo<ComboboxOption[]>(
    () =>
      leagues
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((league) => ({
          value: league.id,
          label: league.name,
        })),
    [leagues],
  )

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

  const fixtureRows = useMemo(() => {
    return fixtures
      .slice()
      .sort((a, b) => {
        const leagueA = getLeagueById(a.leagueId)?.name || ""
        const leagueB = getLeagueById(b.leagueId)?.name || ""
        if (leagueA !== leagueB) return leagueA.localeCompare(leagueB)
        const homeA = getTeamById(a.homeTeamId)?.name || ""
        const homeB = getTeamById(b.homeTeamId)?.name || ""
        if (homeA !== homeB) return homeA.localeCompare(homeB)
        const awayA = getTeamById(a.awayTeamId)?.name || ""
        const awayB = getTeamById(b.awayTeamId)?.name || ""
        return awayA.localeCompare(awayB)
      })
      .map((fixture) => {
        const homeTeam = getTeamById(fixture.homeTeamId)
        const awayTeam = getTeamById(fixture.awayTeamId)
        const league = getLeagueById(fixture.leagueId)
        const hasAssets = Boolean(homeTeam && awayTeam && league)
        const parsedDate = fixture.date ? new Date(fixture.date) : null
        const validDate = parsedDate && !Number.isNaN(parsedDate.valueOf())
        const dateLabel = validDate
          ? parsedDate.toLocaleString("es-AR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sin fecha"

        return {
          fixture,
          homeTeam,
          awayTeam,
          league,
          hasAssets,
          dateLabel,
          leagueLogo: league ? resolveLeagueLogo(fixture.leagueId, league.logo) : null,
        }
      })
  }, [fixtures, teams, leagues])

  const quickPastedMatches = useMemo(() => {
    if (!bulkInput.trim()) return []

    const rawLines = bulkInput.split(/\r?\n/)

    const items: Array<{ text: string; leagueShort: string; lineIndex: number }> = []
    let currentLeague = ""

    for (const [lineIndex, rawLine] of rawLines.entries()) {
      const line = rawLine.trim()
      if (!line) continue

      const normalized = line.toLowerCase()
      const looksLeagueHeader =
        normalized.startsWith("liga ") ||
        normalized === "ln" ||
        normalized === "lf" ||
        normalized === "la" ||
        normalized.includes("liga nacional") ||
        normalized.includes("liga femenina") ||
        normalized.includes("liga argentina")

      if (looksLeagueHeader) {
        currentLeague = line
        continue
      }

      const cleanLine = line.replace(/\s+/g, " ")
      if (!cleanLine) continue

      items.push({
        text: cleanLine,
        leagueShort: currentLeague ? getLeagueShortLabel(currentLeague) : "",
        lineIndex,
      })
    }

    return items
  }, [bulkInput])

  const updateQuickMatchLine = (lineIndex: number, newLine: string) => {
    const normalizedLine = newLine.replace(/\s+/g, " ").trim()
    if (!normalizedLine) return

    setBulkInput((prev) => {
      const lines = prev.split(/\r?\n/)
      if (lineIndex < 0 || lineIndex >= lines.length) return prev
      lines[lineIndex] = normalizedLine
      return lines.join("\n")
    })
  }

  const allSelected = fixtureRows.length > 0 && fixtureRows.every((row) => selectedFixtureIds.includes(row.fixture.id))

  const handleToggleFixture = (fixtureId: string, checked: boolean) => {
    setSelectedFixtureIds((prev) => {
      if (checked) {
        if (prev.includes(fixtureId)) return prev
        return [...prev, fixtureId]
      }
      return prev.filter((id) => id !== fixtureId)
    })
  }

  const handleToggleAll = (checked: boolean) => {
    setSelectedFixtureIds(checked ? fixtureRows.map((row) => row.fixture.id) : [])
  }

  const handleDeleteSelected = () => {
    selectedFixtureIds.forEach((fixtureId) => onDeleteFixture(fixtureId))
    setSelectedFixtureIds([])
  }

  const handleInlineTeamChange = (fixtureId: string, side: "home" | "away", teamId: string) => {
    if (!teamId) return
    onUpdateFixture(fixtureId, side === "home" ? { homeTeamId: teamId } : { awayTeamId: teamId })
    setEditingTeamCell(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!leagueId || !homeTeamId || !awayTeamId) return

    onAddFixture({
      id: generateId(),
      leagueId,
      homeTeamId,
      awayTeamId,
    })

    setHomeTeamId("")
    setAwayTeamId("")
  }

  const processFixtureText = (text: string) => {
    setProcessingStatus("Procesando fixtures...")

    const { fixtures: parsedFixtures, errors, warnings, processedLines } = parseFixtures(text, teams, leagues)

    if (parsedFixtures.length > 0) {
      onBulkAddFixtures(parsedFixtures)
    }

    const totalLines = processedLines.length
    const addedLines = processedLines.filter((line) => line.status === "added").length
    const summary = totalLines
      ? `${addedLines}/${totalLines} partidos agregados automáticamente.`
      : parsedFixtures.length
        ? `${parsedFixtures.length} partidos agregados.`
        : "Sin partidos válidos."

    setProcessingStatus(summary)
    setBulkErrors(errors)
    setBulkWarnings(warnings)
    setBulkResults((prev) => [...prev, ...processedLines])
    setManualAdded({})

    const initialManualSelections: Record<number, ManualEntry> = {}

    processedLines.forEach((line) => {
      if (line.status === "skipped" && !line.isHeader) {
        const leagueIdFromLine = line.leagueName
          ? leagues.find((league) => league.name.toLowerCase() === line.leagueName?.toLowerCase())?.id || ""
          : leagueId || leagues[0]?.id || ""

        initialManualSelections[line.lineNumber] = {
          leagueId: leagueIdFromLine,
          homeTeamId: line.home?.suggestions?.[0]?.teamId || "",
          awayTeamId: line.away?.suggestions?.[0]?.teamId || "",
        }
      }
    })

    setManualEntries(initialManualSelections)

    if (errors.length > 0) {
      console.error("Errores al procesar fixtures:", errors)
    }
  }

  const handleBulkSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!bulkInput.trim()) return
    processFixtureText(bulkInput)
  }

  const updateManualEntry = (lineNumber: number, field: keyof ManualEntry, value: string) => {
    setManualEntries((prev) => ({
      ...prev,
      [lineNumber]: {
        leagueId: prev[lineNumber]?.leagueId || "",
        homeTeamId: prev[lineNumber]?.homeTeamId || "",
        awayTeamId: prev[lineNumber]?.awayTeamId || "",
        [field]: value,
      },
    }))
  }

  const handleManualAdd = (line: ProcessedLineResult) => {
    const selections = manualEntries[line.lineNumber]
    if (!selections) return
    if (!selections.leagueId || !selections.homeTeamId || !selections.awayTeamId) return

    const newFixture: Fixture = {
      id: generateId(),
      leagueId: selections.leagueId,
      homeTeamId: selections.homeTeamId,
      awayTeamId: selections.awayTeamId,
    }

    setManualAdded((prev) => ({ ...prev, [line.lineNumber]: true }))

    setBulkResults((prevResults) => {
      const leagueNameResolved = getLeagueById(selections.leagueId)?.name
      const homeName = getTeamById(selections.homeTeamId)?.name
      const awayName = getTeamById(selections.awayTeamId)?.name

      return prevResults.map((result) => {
        if (result.lineNumber !== line.lineNumber) return result

        const updatedHome = result.home
          ? { ...result.home, resolvedName: homeName || result.home.resolvedName || result.home.raw }
          : { raw: homeName || "", resolvedName: homeName, suggestions: [] }

        const updatedAway = result.away
          ? { ...result.away, resolvedName: awayName || result.away.resolvedName || result.away.raw }
          : { raw: awayName || "", resolvedName: awayName, suggestions: [] }

        return {
          ...result,
          status: "added" as const,
          message: "Agregado manualmente",
          leagueName: leagueNameResolved || result.leagueName,
          home: updatedHome,
          away: updatedAway,
        }
      })
    })

    onAddFixture(newFixture)
  }

  const clearBulkFeedback = () => {
    setBulkResults([])
    setBulkErrors([])
    setBulkWarnings([])
    setProcessingStatus("")
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight md:text-[2.15rem]">Gestión de Fixtures</h2>
          <p className="text-sm text-muted-foreground">Procesa calendarios entrantes y gestiona partidos para la generación de miniaturas.</p>
        </div>

        <Tabs value={entryMode} onValueChange={(value) => setEntryMode(value as EntryMode)}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-slate-200 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger
              value="bulk"
              className="rounded-none border-b-2 border-transparent pb-3 pt-2 text-sm font-semibold text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Carga Masiva
            </TabsTrigger>
            <TabsTrigger
              value="individual"
              className="rounded-none border-b-2 border-transparent pb-3 pt-2 text-sm font-semibold text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Carga Individual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="pt-6">
            <div className="flex w-full">
              <Card className="w-full border-slate-200 bg-white shadow-none">
                <CardContent className="space-y-4 p-4 md:p-5">
                  <Label className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
                    <FileText className="h-5 w-5 text-slate-600" />
                    Pegar calendario
                  </Label>

                  <form onSubmit={handleBulkSubmit} className="space-y-3">
                    <Textarea
                      value={bulkInput}
                      onChange={(event) => setBulkInput(event.target.value)}
                      rows={3}
                      className="min-h-[88px] max-h-[110px] resize-none border-slate-200 bg-slate-50 font-mono text-sm leading-relaxed text-slate-700"
                      placeholder={"Liga Nacional\nEquipo1 vs Equipo2\nEquipo3 vs Equipo4\n..."}
                    />

                    {quickPastedMatches.length > 0 && (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Vista rápida ({quickPastedMatches.length}) · auto columnas
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {quickPastedMatches.slice(0, 80).map((item, index) => (
                            <div key={`${index}-${item.text}`} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs">
                              {editingQuickMatch?.lineIndex === item.lineIndex ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingQuickMatch.value}
                                    onChange={(event) =>
                                      setEditingQuickMatch((prev) => (prev ? { ...prev, value: event.target.value } : prev))
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault()
                                        if (!editingQuickMatch) return
                                        updateQuickMatchLine(editingQuickMatch.lineIndex, editingQuickMatch.value)
                                        setEditingQuickMatch(null)
                                      }
                                      if (event.key === "Escape") {
                                        event.preventDefault()
                                        setEditingQuickMatch(null)
                                      }
                                    }}
                                    className="h-8 text-xs"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => setEditingQuickMatch(null)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => {
                                        if (!editingQuickMatch) return
                                        updateQuickMatchLine(editingQuickMatch.lineIndex, editingQuickMatch.value)
                                        setEditingQuickMatch(null)
                                      }}
                                    >
                                      Guardar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="-m-1 flex w-full items-center justify-between gap-2 rounded p-1 text-left hover:bg-slate-50"
                                  onClick={() => setEditingQuickMatch({ lineIndex: item.lineIndex, value: item.text })}
                                  title="Editar nombre de equipos"
                                >
                                  <span className="truncate text-slate-800">
                                    <span className="font-semibold">{index + 1}.</span> {item.text}
                                  </span>
                                  {item.leagueShort && (
                                    <span className="shrink-0 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                      {item.leagueShort}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {quickPastedMatches.length > 80 && (
                          <p className="text-[11px] text-muted-foreground">
                            Mostrando los primeros 80 partidos de {quickPastedMatches.length}.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50" onClick={() => setBulkInput("")}>
                        Limpiar
                      </Button>
                      <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                        Procesar
                      </Button>
                    </div>
                  </form>

                </CardContent>
              </Card>
            </div>

            <div className="mt-4 space-y-2">
              {processingStatus && (
                <Alert>
                  <AlertDescription>{processingStatus}</AlertDescription>
                </Alert>
              )}

              {bulkWarnings.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      {bulkWarnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {bulkErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-1">
                      {bulkErrors.map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

              {bulkResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">Resultados del procesamiento</h3>
                    <Button variant="outline" size="sm" onClick={clearBulkFeedback}>
                      Limpiar resultados
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {bulkResults.map((line) => {
                      const selections = manualEntries[line.lineNumber] || { leagueId: "", homeTeamId: "", awayTeamId: "" }
                      const manualDisabled = manualAdded[line.lineNumber]
                      const isOk = line.status === "added" || Boolean(line.isHeader)
                      const homeLabel = line.home?.resolvedName || line.home?.raw
                      const awayLabel = line.away?.resolvedName || line.away?.raw
                      const matchLabel = homeLabel && awayLabel ? `${homeLabel} vs ${awayLabel}` : line.rawText
                      const leagueShort = line.leagueType || (line.leagueName ? getLeagueShortLabel(line.leagueName) : "")

                      return (
                        <div key={`${line.lineNumber}-${line.rawText}`} className="h-full rounded-lg border bg-card p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {line.lineNumber}. {matchLabel}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {isOk ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Correcto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" aria-label="Error" />
                                )}
                                {!isOk && <span className="text-xs text-red-600">{line.message}</span>}
                              </div>
                              {leagueShort && <p className="text-xs text-muted-foreground">Liga: {leagueShort}</p>}
                            </div>

                            {line.status === "added" && (
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {line.home?.matchedByAlias && <p>Local resuelto por alias</p>}
                                {line.away?.matchedByAlias && <p>Visitante resuelto por alias</p>}
                              </div>
                            )}
                          </div>

                          {line.status === "skipped" && !line.isHeader && (
                            <div className="mt-4 space-y-3">
                              <div className="grid gap-2 md:grid-cols-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Liga</Label>
                                  <SearchableCombobox
                                    value={selections.leagueId}
                                    onValueChange={(value) => updateManualEntry(line.lineNumber, "leagueId", value)}
                                    options={leagueOptions}
                                    placeholder="Selecciona liga"
                                    buttonClassName="h-10"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Equipo local</Label>
                                  <SearchableCombobox
                                    value={selections.homeTeamId}
                                    onValueChange={(value) => updateManualEntry(line.lineNumber, "homeTeamId", value)}
                                    options={teamOptions}
                                    suggestions={line.home?.suggestions?.map((suggestion) => ({
                                      value: suggestion.teamId,
                                      label: getTeamById(suggestion.teamId)?.name || suggestion.name,
                                      description: suggestion.reason,
                                      group: "Sugerencias",
                                    }))}
                                    placeholder="Selecciona local"
                                    buttonClassName="h-10"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Equipo visitante</Label>
                                  <SearchableCombobox
                                    value={selections.awayTeamId}
                                    onValueChange={(value) => updateManualEntry(line.lineNumber, "awayTeamId", value)}
                                    options={teamOptions}
                                    suggestions={line.away?.suggestions?.map((suggestion) => ({
                                      value: suggestion.teamId,
                                      label: getTeamById(suggestion.teamId)?.name || suggestion.name,
                                      description: suggestion.reason,
                                      group: "Sugerencias",
                                    }))}
                                    placeholder="Selecciona visitante"
                                    buttonClassName="h-10"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!selections.leagueId || !selections.homeTeamId || !selections.awayTeamId || manualDisabled}
                                  onClick={() => handleManualAdd(line)}
                                >
                                  {manualDisabled ? "Agregado" : "Agregar manualmente"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
          </TabsContent>

          <TabsContent value="individual" className="pt-6">
            <Card className="border-slate-200 bg-white shadow-none">
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Liga</Label>
                      <SearchableCombobox
                        value={leagueId}
                        onValueChange={setLeagueId}
                        options={leagueOptions}
                        placeholder="Selecciona una liga"
                        buttonClassName="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Equipo local</Label>
                      <SearchableCombobox
                        value={homeTeamId}
                        onValueChange={setHomeTeamId}
                        options={teamOptions}
                        placeholder="Selecciona local"
                        buttonClassName="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Equipo visitante</Label>
                      <SearchableCombobox
                        value={awayTeamId}
                        onValueChange={setAwayTeamId}
                        options={teamOptions}
                        placeholder="Selecciona visitante"
                        buttonClassName="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Agregar partido</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Lista de partidos</h3>

          <div className="flex flex-wrap items-center gap-2">
            {selectedFixtureIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4" />
                Eliminar seleccionados ({selectedFixtureIds.length})
              </Button>
            )}

            {fixtures.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={onClearAllFixtures}>
                  Limpiar partidos
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!onDownloadAll) return
                    setIsDownloadingAll(true)
                    try {
                      await onDownloadAll()
                    } finally {
                      setIsDownloadingAll(false)
                    }
                  }}
                  disabled={isDownloadingAll}
                >
                  <Download className="h-4 w-4" />
                  {isDownloadingAll ? "Descargando..." : "Descargar todos"}
                </Button>
              </>
            )}
          </div>
        </div>

        {fixtureRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
            No hay partidos cargados.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-10 p-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => handleToggleAll(event.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liga</th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha/Hora</th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipo local</th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipo visitante</th>
                    <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {fixtureRows.map((row) => (
                    <tr
                      key={row.fixture.id}
                      className={cn(
                        "border-b border-slate-200 last:border-b-0",
                        row.hasAssets ? "hover:bg-slate-50" : "bg-red-50/50 hover:bg-red-50",
                      )}
                    >
                      <td className="p-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedFixtureIds.includes(row.fixture.id)}
                          onChange={(event) => handleToggleFixture(row.fixture.id, event.target.checked)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                      </td>

                      <td className="p-3 align-middle">
                        {row.league ? (
                          <div className="flex items-center gap-2">
                            {row.leagueLogo && (
                              <img src={row.leagueLogo} alt={row.league.name} className="h-6 w-6 object-contain" />
                            )}
                            <Badge variant="outline" className="border-slate-300 bg-slate-100 font-medium text-slate-700">
                              {row.league.name}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-red-600">Liga faltante</span>
                        )}
                      </td>

                      <td className="p-3 align-middle text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {row.dateLabel}
                        </span>
                      </td>

                      <td className="p-3 align-middle font-medium">
                        {editingTeamCell?.fixtureId === row.fixture.id && editingTeamCell.side === "home" ? (
                          <div className="space-y-2">
                            <SearchableCombobox
                              value={row.fixture.homeTeamId}
                              onValueChange={(value) => handleInlineTeamChange(row.fixture.id, "home", value)}
                              options={teamOptions}
                              placeholder="Selecciona local"
                              buttonClassName="h-9"
                            />
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setEditingTeamCell(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : row.homeTeam ? (
                          <button
                            type="button"
                            onClick={() => setEditingTeamCell({ fixtureId: row.fixture.id, side: "home" })}
                            className="-m-1 flex w-full items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-slate-100"
                            title="Cambiar equipo local"
                          >
                            {row.homeTeam.logo ? (
                              <img
                                src={row.homeTeam.logo}
                                alt={row.homeTeam.name}
                                className="h-8 w-8 rounded-md border border-slate-200 bg-white object-contain p-0.5"
                              />
                            ) : null}
                            <span>{row.homeTeam.name}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="-m-1 rounded-md p-1 text-left text-red-600 hover:bg-red-50"
                            onClick={() => setEditingTeamCell({ fixtureId: row.fixture.id, side: "home" })}
                          >
                            Equipo faltante
                          </button>
                        )}
                      </td>

                      <td className="p-3 align-middle font-medium">
                        {editingTeamCell?.fixtureId === row.fixture.id && editingTeamCell.side === "away" ? (
                          <div className="space-y-2">
                            <SearchableCombobox
                              value={row.fixture.awayTeamId}
                              onValueChange={(value) => handleInlineTeamChange(row.fixture.id, "away", value)}
                              options={teamOptions}
                              placeholder="Selecciona visitante"
                              buttonClassName="h-9"
                            />
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setEditingTeamCell(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : row.awayTeam ? (
                          <button
                            type="button"
                            onClick={() => setEditingTeamCell({ fixtureId: row.fixture.id, side: "away" })}
                            className="-m-1 flex w-full items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-slate-100"
                            title="Cambiar equipo visitante"
                          >
                            {row.awayTeam.logo ? (
                              <img
                                src={row.awayTeam.logo}
                                alt={row.awayTeam.name}
                                className="h-8 w-8 rounded-md border border-slate-200 bg-white object-contain p-0.5"
                              />
                            ) : null}
                            <span>{row.awayTeam.name}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="-m-1 rounded-md p-1 text-left text-red-600 hover:bg-red-50"
                            onClick={() => setEditingTeamCell({ fixtureId: row.fixture.id, side: "away" })}
                          >
                            Equipo faltante
                          </button>
                        )}
                      </td>

                      <td className="p-3 align-middle">
                        {row.hasAssets ? (
                          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Listo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-600">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Error
                          </Badge>
                        )}
                      </td>

                      <td className="p-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Vista previa"
                            disabled={!row.hasAssets}
                            onClick={() => onSelectFixture(row.fixture)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Descargar"
                            disabled={!row.hasAssets || !onDownloadSingle}
                            onClick={() => onDownloadSingle?.(row.fixture)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDeleteFixture(row.fixture.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
              <span>Mostrando {fixtureRows.length} partidos</span>
              <div className="inline-flex items-center gap-1">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
