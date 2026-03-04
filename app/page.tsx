"use client"

import { useState, useEffect } from "react"
import { normalizeName } from "../components/team-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TeamManager from "@/components/team-manager"
import FixtureGenerator from "@/components/fixture-generator"
import ThumbnailPreview from "@/components/thumbnail-preview"
import LogoPositionConfig from "@/components/logo-position-config"
import type { Team, Fixture, League } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { downloadFixture } from "@/lib/download-fixture"
import { usePreview } from "@/hooks/use-preview"

// Datos iniciales de ligas - CORREGIDO: Asegurando que las rutas sean correctas
const leagues: League[] = [
  {
    id: "liga-nacional",
    name: "Liga Nacional",
    logo: "/logos/leagues/Liga-nacional.png",
  },
  {
    id: "liga-nacional-playoffs",
    name: "Liga Nacional Playoffs",
    logo: "/logos/leagues/Liga-nacional-playoffs.png",
  },
  {
    id: "liga-nacional-finales",
    name: "Liga Nacional Finales",
    logo: "/logos/leagues/Liga-nacional-finales.png",
  },
  {
    id: "liga-femenina",
    name: "Liga Femenina",
    logo: "/logos/leagues/Liga-femenina.png",
  },
  {
    id: "liga-femenina-playoffs",
    name: "Liga Femenina Playoffs",
    logo: "/logos/leagues/Liga-femenina-playoffs.png",
  },
  {
    id: "liga-femenina-finales",
    name: "Liga Femenina Finales",
    logo: "/logos/leagues/Liga-femenina-finales.png",
  },
  {
    id: "liga-federal",
    name: "Liga Federal",
    logo: "/logos/leagues/Liga-federal.png",
  },
  {
    id: "liga-federal-playoffs",
    name: "Liga Federal Playoffs",
    logo: "/logos/leagues/Liga-federal-playoffs.png",
  },
  {
    id: "liga-federal-finales",
    name: "Liga Federal Finales",
    logo: "/logos/leagues/Liga-federal-finales.png",
  },
  {
    id: "liga-desarrollo",
    name: "Liga Desarrollo",
    logo: "/logos/leagues/Liga-desarrollo.png",
  },
  {
    id: "liga-desarrollo-playoffs",
    name: "Liga Desarrollo Playoffs",
    logo: "/logos/leagues/Liga-desarrollo-playoffs.png",
  },
  {
    id: "liga-desarrollo-finales",
    name: "Liga Desarrollo Finales",
    logo: "/logos/leagues/Liga-desarollo-finales.png",
  },
  {
    id: "liga-argentina",
    name: "Liga Argentina",
    logo: "/logos/leagues/Liga-argentina.png",
  },
  {
    id: "liga-argentina-playoffs",
    name: "Liga Argentina Playoffs",
    logo: "/logos/leagues/Liga-argentina-playoffs.png",
  },
  {
    id: "liga-argentina-finales",
    name: "Liga Argentina Finales",
    logo: "/logos/leagues/Liga-argentina-finales.png",
  },
]

// Colores por defecto de equipos (top-level)
const DEFAULT_TEAM_COLORS: Record<string, string> = {
  // Equipos del manifiesto con sus colores
  Amancay: "#FDB913",
  Argentino: "#1976D2",
  Atenas: "#00600E",
  "AtléTico San Isidro": "#D60027",
  "Barrio Parque": "#ffffffff",
  Berazategui: "#FFE600",
  Bigua: "#0B8A2A",
  Boca: "#00205B",
  Bochas: "#0D47A1",
  Centenario: "#1A4DA1",
  "Central Entrerriano": "#C00000",
  Chanares: "#FF9300",
  Ciclista: "#009739",
  "Club AtléTico Estudiantes": "#ffffffff",
  "ColóN SF": "#D00000",
  Comunicaciones: "#F6D743",
  "Deportivo Norte": "#2A6FBD",
  "El Talar": "#FFE600",
  Ferro: "#3BA935",
  "Fusion Riojana": "#31f897",
  GELP: "#1565C0", // Azul
  "Gimnasia Cr": "#5fba46",
  Gorriones: "#eb3736",
  Hindu: "#FFE600",
  Hindú: "#FFE600",
  "Hispano Americano": "#3d98edff",
  "Huracan Las Heras": "#FFFFFF",
  "Independiente B.B.C.": "#ff4000ffff",
  "Independiente De Oliva": "#2D2D7C",
  "Independiente Neuquen": "#ff7700ff",
  Instituto: "#B80000",
  "Jujuy Basquet": "#005FAE",
  "La Union": "#1565C0",
  "La UnióN C": "#ff0000ff",
  Lanus: "#FFFFFF",
  Montmartre: "#E1B465",
  Nautico: "#1565C0",
  Obera: "#428dbf",
  Obras: "#FFE600",
  Olimpico: "#FFFFFF",
  Pergamino: "#FF7F27", // Naranja
  Pico: "#FFFFFF",
  Provincial: "#BE0F23",
  Quilmes: "#D71921",
  Suardi: "#D00000",
  Viedma: "#1565C0", // Azul
  "Villa Mitre": "#2E7D32", // Verde
  "Villa San MartíN": "#1565C0", // Azul
  "Racing (Ch)": "#f9fcffff",
  Rocamora: "#D00000",
  "San Jose": "#5DB0E6",
  "Union deportiva San jose": "#1F5FA9",
  "Union Florida": "#29347c",
  "Sportivo Nau": "#1565C0",
  Peñarol: "#FFFFFF",
  Platense: "#432915",
  Quimsa: "#003366",
  Regatas: "#5DC3F3",
  Riachuelo: "#3c2a9a",
  "San Lorenzo": "#283b56",
  "San martin de Corrientes": "#EF7B17",
  "Union SF": "#ec1c24",
  Zarate: "#4FC3F7",
  Independiente: "#C4001D",
  "Racing de Avellaneda": "#74B3E7",
  "Rivadavia Básquet": "#FF7F27",
  "Salta Basket": "#00bfffff",
  "Santa Paula de Gálvez": "#1A4DA1",
  "Sportivo Suardi": "#D00000",
  "Tomás de Rocamora": "#D00000",
  "Unión de Mar del Plata": "#1976D2",
}

const normalizedColorMap = new Map<string, string>(
  Object.entries(DEFAULT_TEAM_COLORS).map(([k, v]) => [normalizeName(k), v]),
)

function defaultColorFor(teamName: string): string | null {
  const norm = normalizeName(teamName)
  return normalizedColorMap.get(norm) || null
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null)
  const [activeTab, setActiveTab] = useState("teams")
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Usar el nuevo hook para manejar el estado de la vista previa
  const { state: previewState, actions: previewActions } = usePreview({
    teams,
    leagues,
    selectedFixture,
    setSelectedFixture,
    setFixtures,
  })

  // Extraer valores necesarios del estado del hook
  const { homeLogoSize, awayLogoSize, globalLogoOffset, homeColor, awayColor, homeColorBrightness, awayColorBrightness } = previewState
  const { setGlobalLogoOffset, setHomeLogoSize, setAwayLogoSize, handlePreviewTeam } = previewActions

  // Envolver handlePreviewTeam para cambiar de tab también
  const onPreviewTeam = (team: Team) => {
    handlePreviewTeam(team)
    setActiveTab("preview")
  }

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedTeams = localStorage.getItem("basketballTeams")

    if (savedTeams) {
      try {
        setTeams(JSON.parse(savedTeams))
      } catch (e) {
        console.error("Error al cargar equipos guardados:", e)
      }
    }

    // Inicializar fixtures como vacío por defecto (evita cargar viejos)
    setFixtures([])
  }, [])

  // Guardar datos cuando cambian
  useEffect(() => {
    if (teams.length > 0) {
      try {
        localStorage.setItem("basketballTeams", JSON.stringify(teams))
      } catch (e: any) {
        if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          showNotification(
            "No hay suficiente espacio para guardar más equipos. Borra datos viejos o limpia el almacenamiento local.",
            "error",
          )
        } else {
          showNotification("Error inesperado al guardar equipos.", "error")
        }
      }
    }

    if (fixtures.length > 0) {
      try {
        localStorage.setItem("basketballFixtures", JSON.stringify(fixtures))
      } catch (e: any) {
        if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          showNotification(
            "No hay suficiente espacio para guardar más partidos. Borra datos viejos o limpia el almacenamiento local.",
            "error",
          )
        } else {
          showNotification("Error inesperado al guardar partidos.", "error")
        }
      }
    }
  }, [teams, fixtures])

  // Autocargar/mergear equipos desde carpeta pública: primero manifest estático, luego API
  useEffect(() => {
    const loadTeamsFromPublic = async () => {
      try {
        // 1) Intentar manifest estático generado en build
        let mapped: Team[] = []
        try {
          const mres = await fetch("/teams.manifest.json", { cache: "no-store" })
          if (mres.ok) {
            const manifest: { baseUrl?: string; teams: Array<{ name: string; file: string; logo: string }> } =
              await mres.json()
            mapped = (manifest.teams || []).map((item) => {
              const color = defaultColorFor(item.name) || "#FFFFFF"
              return { id: item.name, name: item.name, logo: item.logo, primaryColor: color, aliases: [] }
            })
          }
        } catch { }

        // 2) Si no hubo manifest o venía vacío, intentar API en dev/self-host
        if (mapped.length === 0) {
          const res = await fetch("/api/list-teams", { cache: "no-store" })
          if (!res.ok) return
          const payload: {
            ok: boolean
            baseUrl?: string
            teams: Array<{ name: string; file: string; logo: string }>
          } = await res.json()
          mapped = (payload.teams || []).map((item) => {
            const color = defaultColorFor(item.name) || "#FFFFFF"
            return { id: item.name, name: item.name, logo: item.logo, primaryColor: color, aliases: [] }
          })
        }

        if (mapped.length) {
          const mappedByName = new Map(mapped.map((t) => [normalizeName(t.name), t]))
          let hasUpdates = false
          const updatedTeams = teams.map((team) => {
            const fromPublic = mappedByName.get(normalizeName(team.name))
            if (!fromPublic) return team
            if (team.logo !== fromPublic.logo) {
              hasUpdates = true
              return { ...team, logo: fromPublic.logo }
            }
            return team
          })

          const existing = new Set(updatedTeams.map((t) => normalizeName(t.name)))
          const toAdd = mapped.filter((t) => !existing.has(normalizeName(t.name)))

          if (hasUpdates || toAdd.length) {
            const next = [...updatedTeams, ...toAdd]
            setTeams(next)
            localStorage.setItem("basketballTeams", JSON.stringify(next))
            if (toAdd.length) {
              showNotification(`${toAdd.length} equipos agregados desde carpeta pública`, "success")
            }
          }
        }
      } catch (e) {
        console.warn("No se pudo listar equipos desde la carpeta pública", e)
      }
    }
    void loadTeamsFromPublic()
  }, [teams])

  // Auto-aplicar colores por defecto a equipos ya existentes solo si difiere del color por defecto
  useEffect(() => {
    if (teams.length === 0) return
    let changed = false
    const updated = teams.map((t) => {
      const def = defaultColorFor(t.name)
      if (def && t.primaryColor?.toLowerCase() !== def.toLowerCase()) {
        changed = true
        return { ...t, primaryColor: def }
      }
      return t
    })
    if (changed) {
      setTeams(updated)
      try {
        localStorage.setItem("basketballTeams", JSON.stringify(updated))
      } catch { }
    }
  }, [teams])

  // Precargar las imágenes de las ligas y la plantilla
  useEffect(() => {
    const imagesToLoad = [
      "/logos/leagues/Liga-argentina.png",
      "/logos/leagues/Liga-nacional.png",
      "/logos/leagues/Liga-femenina.png",
      "/logos/plantilla.png",
    ]

    let loadedCount = 0
    const totalImages = imagesToLoad.length

    const preloadImage = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          loadedCount++
          console.log(`Imagen cargada: ${src} (${loadedCount}/${totalImages})`)
          resolve(true)
        }
        img.onerror = () => {
          console.error(`Error al cargar imagen: ${src}`)
          resolve(false)
        }
        img.src = src
      })
    }

    Promise.all(imagesToLoad.map(preloadImage))
      .then(() => {
        setImagesLoaded(true)
      })
      .catch((error) => {
        console.error("Error al precargar imágenes:", error)
        setImagesLoaded(true) // Continuar de todos modos
      })
  }, [])

  // Función para mostrar notificaciones (debe estar antes de su uso)
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Función para agregar equipos (debe estar antes de su uso)
  const addTeam = (team: Team) => {
    setTeams((prev) => [...prev, team])
    showNotification("Equipo agregado correctamente", "success")
  }

  const updateTeam = (updatedTeam: Team) => {
    setTeams((prev) => prev.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)))
    showNotification("Equipo actualizado correctamente", "success")
  }

  const deleteTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== teamId))
    // También eliminar fixtures que usen este equipo
    setFixtures((prev) => prev.filter((fixture) => fixture.homeTeamId !== teamId && fixture.awayTeamId !== teamId))
    showNotification("Equipo eliminado correctamente", "success")
  }

  const addFixture = (fixture: Fixture) => {
    setFixtures((prev) => [...prev, fixture])
    setSelectedFixture(fixture)
    setActiveTab("preview")
    showNotification("Partido agregado correctamente", "success")
  }

  const deleteFixture = (fixtureId: string) => {
    setFixtures((prev) => prev.filter((fixture) => fixture.id !== fixtureId))
    if (selectedFixture?.id === fixtureId) {
      setSelectedFixture(null)
    }
    showNotification("Partido eliminado correctamente", "success")
  }

  const clearAllFixtures = () => {
    setFixtures([])
    setSelectedFixture(null)
    showNotification("Se limpiaron todos los partidos", "success")
  }

  const selectFixture = (fixture: Fixture) => {
    setSelectedFixture(fixture)
    setActiveTab("preview")
  }

  const bulkAddTeams = (newTeams: Team[]) => {
    setTeams((prev) => {
      // Filtrar equipos que ya existen por nombre
      const existingTeamNames = prev.map((team) => team.name.toLowerCase())
      const filteredNewTeams = newTeams.filter((team) => !existingTeamNames.includes(team.name.toLowerCase()))

      return [...prev, ...filteredNewTeams]
    })

    showNotification(`${newTeams.length} equipos agregados correctamente`, "success")
  }

  const bulkAddFixtures = (newFixtures: Fixture[]) => {
    setFixtures((prev) => [...prev, ...newFixtures])
    showNotification(`${newFixtures.length} partidos agregados correctamente`, "success")
  }

  useEffect(() => {
    if (activeTab !== "preview") return
    if (selectedFixture) return

    const firstValidFixture = fixtures.find(
      (fixture) => teams.some((team) => team.id === fixture.homeTeamId) && teams.some((team) => team.id === fixture.awayTeamId),
    )

    if (firstValidFixture) {
      setSelectedFixture(firstValidFixture)
    }
  }, [activeTab, selectedFixture, fixtures, teams])

  const updateFixture = (fixtureId: string, changes: Partial<Fixture>) => {
    setFixtures((prev) => prev.map((f) => (f.id === fixtureId ? { ...f, ...changes } : f)))
    if (selectedFixture && selectedFixture.id === fixtureId) {
      setSelectedFixture({ ...selectedFixture, ...changes })
    }
  }

  const downloadSingleFixture = async (fixture: Fixture) => {
    await downloadFixture({
      fixture,
      teams,
      leagues,
      homeColor,
      awayColor,
      homeColorBrightness,
      awayColorBrightness,
      homeLogoSize,
      awayLogoSize,
      globalLogoOffset,
    })
  }

  const bulkExportDefaultSizeFor = (teamName?: string): number => {
    if (!teamName) return 1.3
    const n = normalizeName(teamName)
    if (n === normalizeName("GELP") || n.includes("gimnasia") || n.includes("gelp")) return 1.5
    if (n.includes("quilmes")) return 1.45
    if (n.includes("fusion riojana") || n.includes("fusionriojana")) return 1.45
    return 1.3
  }

  const downloadAllFixtures = async () => {
    if (fixtures.length === 0) return
    const validFixtures = fixtures.filter(
      (f) => teams.some((t) => t.id === f.homeTeamId) && teams.some((t) => t.id === f.awayTeamId),
    )
    const skipped = fixtures.length - validFixtures.length
    if (skipped > 0) {
      showNotification(`${skipped} partidos omitidos por no encontrar equipos.`, "error")
    }
    for (const f of validFixtures) {
      // Fuerza tamaños base a 1.30 en bulk export, salvo excepciones
      const homeTeam = teams.find((t) => t.id === f.homeTeamId)
      const awayTeam = teams.find((t) => t.id === f.awayTeamId)
      const effHomeSize = bulkExportDefaultSizeFor(homeTeam?.name)
      const effAwaySize = bulkExportDefaultSizeFor(awayTeam?.name)
      // No pasar homeColor/awayColor para que use los colores propios del equipo
      await downloadFixture({
        fixture: f,
        teams,
        leagues,
        globalLogoOffset,
        homeLogoSize: effHomeSize,
        awayLogoSize: effAwaySize,
      })
      // pausa entre descargas para evitar saturación
      await new Promise((r) => setTimeout(r, 700))
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-4 md:px-5 lg:px-6 lg:py-5">
      <h1 className="mb-4 text-center text-2xl font-bold md:mb-5 md:text-3xl">Generador de Portadas para YouTube</h1>

      {notification && (
        <Alert variant={notification.type === "success" ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="logo-config">Config. Logos</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <TeamManager
            teams={teams}
            onAddTeam={addTeam}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            onBulkAddTeams={bulkAddTeams}
            onPreviewTeam={onPreviewTeam}
          />
        </TabsContent>

        <TabsContent value="fixtures" forceMount>
          <FixtureGenerator
            teams={teams}
            leagues={leagues}
            fixtures={fixtures}
            onAddFixture={addFixture}
            onDeleteFixture={deleteFixture}
            onSelectFixture={selectFixture}
            onBulkAddFixtures={bulkAddFixtures}
            onUpdateFixture={updateFixture}
            onClearAllFixtures={clearAllFixtures}
            onDownloadAll={downloadAllFixtures}
            onDownloadSingle={downloadSingleFixture}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-5">
          <ThumbnailPreview
            fixture={selectedFixture}
            fixtures={fixtures}
            teams={teams}
            leagues={leagues}
            imagesLoaded={imagesLoaded}
            onSelectFixture={selectFixture}
            previewState={previewState}
            previewActions={previewActions}
          />
        </TabsContent>

        <TabsContent value="logo-config">
          <LogoPositionConfig
            globalLogoOffset={globalLogoOffset}
            setGlobalLogoOffset={setGlobalLogoOffset}
            homeLogoSize={homeLogoSize}
            setHomeLogoSize={setHomeLogoSize}
            awayLogoSize={awayLogoSize}
            setAwayLogoSize={setAwayLogoSize}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
