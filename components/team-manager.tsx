"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Team } from "@/lib/types"
import { generateId, fileToBase64 } from "@/lib/utils"
import { Trash2, Edit, Eye, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeamManagerProps {
  teams: Team[]
  onAddTeam: (team: Team) => void
  onUpdateTeam: (team: Team) => void
  onDeleteTeam: (teamId: string) => void
  onBulkAddTeams: (teams: Team[]) => void
  onPreviewTeam: (team: Team) => void
}

// Mapa de nombres alternativos a nombres canónicos
const TEAM_ALIASES: Record<string, string> = {
  // Nombres alternativos comunes
  'gimasia y esgrima la plata': 'gelp',
  'gimnasia y esgrima la plata': 'gelp',
  'gimnasia la plata': 'gelp',
  'quilmes de mar del plata': 'quilmes',
  'quilmes mdp': 'quilmes',
  'centenario de venado tuerto': 'centenario',
  'tomas de rocamora': 'rocamora',
  'tomás de rocamora': 'rocamora',
  'provincial de rosario': 'provincial',
  'sportivo suardi': 'suardi',
  'club ciclista juninense de junin': 'ciclista',
  'ciclista juninense': 'ciclista',
  'pico football club': 'pico',
  'pico fc': 'pico',
  'deportivo norte de armstrong': 'deportivo norte',
  'villa san martin de resistencia': 'villa san martin',
  'villa san martin': 'villa san martin',
  'villa san martín de resistencia': 'villa san martin',
  'villa san martín': 'villa san martin',
  'villa mitre de bahia blanca': 'villa mitre',
  'villa mitre': 'villa mitre',
  'comunicaciones de mercedes': 'comunicaciones',
  'la union de colon': 'la union c',
  'la unión de colón': 'la union c',
  'bochas de colonia caroya': 'bochas',
  'colón de santa fe': 'colon sf',
  'colón': 'colon sf',
  'colon': 'colon sf',
  'racing': 'racing de avellaneda',
  'racing de avellaneda': 'racing de avellaneda',
  'racing (ch)': 'racing de avellaneda',
  'san martin de corrientes': 'san martin',
  'san martin corr': 'san martin',
  'atletico san isidro': 'san isidro',
  'atletico si': 'san isidro',
  'independiente bbc': 'independiente',
  'independiente b.b.c.': 'independiente',
  'independiente de oliva': 'independiente oliva',
  'independiente neuquen': 'independiente neuquen',
  'independiente nqn': 'independiente neuquen',
  'huracan las heras': 'huracan',
  'huracán las heras': 'huracan',
  'deportivo viedma': 'viedma',
  'viedma': 'viedma',
  // Añadir más alias según sea necesario
  'club ciclista juninense': 'ciclista',
  'club ciclista': 'ciclista',
  'juninense': 'ciclista',
  'rosario': 'provincial',
  'mercedes': 'comunicaciones',
  'bahia blanca': 'villa mitre',
  'resistencia': 'villa san martin',
};

// Función utilitaria para normalizar nombres (quita tildes, minúsculas, elimina palabras comunes)
export function normalizeName(name: string): string {
  // Convertir a minúsculas, quitar tildes y caracteres especiales
  let normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^a-z0-9 ]/g, " ") // Reemplaza caracteres especiales por espacios
    .replace(/\b(?:club|de|juniors?|asociacion|atletico|basket|basquet|c\.?a\.?|b\.?c\.?|s\.?a\.?|y|el|la|los|las|del|san|santo|union|ufc?|f\.?c\.?|cd|cf|sd|ud|cp|cpf|cpd|football|futbol|club deportivo|asociacion deportiva|atletico|atletica|deportivo|sportivo|deportes|sport|team|fc|cf|ud|cd|sd|cpd|cpf)\b/gi, "") // Elimina palabras comunes
    .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno solo
    .trim();

  // Verificar si el nombre normalizado tiene un alias
  const alias = TEAM_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  return normalized;
}

// Diccionario de colores predominantes por equipo
const defaultTeamColors: Record<string, string> = {
  // Equipos del manifiesto con sus colores
  "Amancay": "#FDB913",
  "Argentino": "#1976D2",
  "Atenas": "#00600E",
  "AtléTico San Isidro": "#D60027",
  "Barrio Parque": "#2E8B57",
  "Berazategui": "#FFE600",
  "Bigua": "#0B8A2A",
  "Boca": "#00205B",
  "Bochas": "#0D47A1",
  "Centenario": "#1A4DA1", // Color similar a Santa Paula de Gálvez
  "Central Entrerriano": "#C00000",
  "Chanares": "#FF9300",
  "Ciclista": "#009739",
  "Club AtléTico Estudiantes": "#000000",
  "ColóN SF": "#D00000",
  "Comunicaciones": "#F6D743",
  "Deportivo Norte": "rgba(0, 208, 255, 1)",
  "El Talar": "#FFE600",
  "Ferro": "#3BA935",
  "Fusion Riojana": "#31f897",  
  "GELP": "#1565C0",  // Azul
  "Gimnasia Cr": "#5fba46",
  "Gorriones": "#eb3736",
  "Hindu": "#FFE600",
  "Hindú": "#FFE600",
  "Hispano Americano": "#1A4DA1", // Mismo que Centenario
  "Huracan Las Heras": "#FFFFFF",
  "Independiente B.B.C.": "#C4001D",
  "Independiente De Oliva": "#2D2D7C",
  "Independiente Neuquen": "#D32F2F",
  "Instituto": "#B80000",
  "Jujuy Basquet": "#005FAE",
  "La Union": "#1565C0",
  "La UnióN C": "#1565C0", // Mismo que La Union
  "Lanus": "#FFFFFF",
  "Montmartre": "#E1B465",
  "Nautico": "#1565C0",
  "Obera": "#428dbf",
  "Obras": "#FFE600",
  "Olimpico": "#FFFFFF",
  "Pergamino": "#FF7F27",  // Naranja
  "Pico": "#FFFFFF",
  "Provincial": "#BE0F23",
  "Quilmes": "#D71921",
  "Suardi": "#D00000",
  "Viedma": "#1565C0",  // Azul
  "Villa Mitre": "#2E7D32",  // Verde
  "Villa San MartíN": "#1565C0",  // Azul
  "Racing (Ch)": "#74B3E7",
  "Rocamora": "#D00000",
  "San Jose": "5DB0E6",
  "Union deportiva San jose": "#1F5FA9",
  "Union Florida": "#29347c",
  "Sportivo Nau": "#1565C0",
  "Peñarol": "#FFFFFF",
  "Platense": "#432915",
  "Quimsa": "#003366",
  "Regatas": "#5DC3F3",
  "Riachuelo": "#3c2a9a",
  "San Lorenzo": "#283b56",
  "San martin de Corrientes": "#EF7B17",
  "Union SF": "#ec1c24",
  "Zarate": "#4FC3F7",
  "Independiente": "#C4001D",
  "Racing de Avellaneda": "#74B3E7",
  "Rivadavia Básquet": "#FF7F27",
  "Salta Basket": "#DA2128",
  "Santa Paula de Gálvez": "#1A4DA1",
  "Sportivo Suardi": "#D00000",
  "Tomás de Rocamora": "#D00000",
  "Unión de Mar del Plata": "#1976D2",
  "Villa Mitre de Bahía Blanca": "#006838",
  "Villa San Martín de Resistencia": "#1F5FA9"
};

export default function TeamManager({
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onBulkAddTeams,
  onPreviewTeam,
}: TeamManagerProps) {
  // Mapa normalizado nombre->color para resolver variaciones (tildes, artículos, alias simples)
  const normalizedColorMap = useMemo(() => {
    const map = new Map<string, string>()
    Object.entries(defaultTeamColors).forEach(([key, value]) => {
      map.set(normalizeName(key), value)
    })
    return map
  }, [])

  const getDefaultColorForTeamName = (teamName: string): string | null => {
    const norm = normalizeName(teamName)
    return normalizedColorMap.get(norm) || null
  }

  const handleApplyDefaultColors = () => {
    teams.forEach((t) => {
      const color = getDefaultColorForTeamName(t.name)
      if (color && t.primaryColor !== color) {
        onUpdateTeam({ ...t, primaryColor: color })
      }
    })
  }

  const handleImportFromPublic = async () => {
    try {
      let data: Array<{ name: string; file: string; logo: string }> = []
      // 1) Intentar manifest estático (Netlify/Producción)
      try {
        const mres = await fetch("/teams.manifest.json", { cache: "no-store" })
        if (mres.ok) {
          const manifest: { baseUrl?: string; teams: Array<{ name: string; file: string; logo: string }> } = await mres.json()
          data = manifest.teams || []
        }
      } catch {}

      // 2) Fallback a API local en dev
      if (data.length === 0) {
        const res = await fetch("/api/list-teams", { cache: "no-store" })
        if (!res.ok) return
        const payload: { ok: boolean; teams: Array<{ name: string; file: string; logo: string }> } = await res.json()
        data = payload.teams || []
      }
      const existingNames = new Set(teams.map((t) => normalizeName(t.name)))
      const toAdd: Team[] = []
      for (const item of data) {
        const norm = normalizeName(item.name)
        if (existingNames.has(norm)) continue
        const color = getDefaultColorForTeamName(item.name) || "#FFFFFF"
        toAdd.push({
          id: generateId(),
          name: item.name,
          logo: item.logo,
          primaryColor: color,
          aliases: [],
        })
      }
      if (toAdd.length > 0) {
        onBulkAddTeams(toAdd)
      }
    } catch (e) {
      console.warn("No se pudo importar desde carpeta pública", e)
    }
  }
  const [name, setName] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState("#ff0000")
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [aliasInput, setAliasInput] = useState("")
  const [aliases, setAliases] = useState<string[]>([])
  const [bulkUploadStatus, setBulkUploadStatus] = useState<{
    loading: boolean
    message: string
    success: boolean
  }>({ loading: false, message: "", success: false })

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await fileToBase64(file)
        setLogo(base64)
      } catch (error) {
        console.error("Error al convertir el logo a base64:", error)
      }
    }
  }

  const normalizedTeamName = useMemo(() => normalizeName(name), [name])
  const duplicateTeam = useMemo(
    () => teams.find((t) => t.id !== editingTeam?.id && normalizeName(t.name) === normalizedTeamName && normalizedTeamName !== ""),
    [teams, editingTeam, normalizedTeamName],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !logo) return
    if (duplicateTeam) return

    // Buscar color predominante usando nombre normalizado
    const colorForTeam =
      Object.entries(defaultTeamColors).find(([key]) => normalizeName(key) === normalizedTeamName)?.[1] ||
      primaryColor;
    const sanitizedAliases = Array.from(
      new Set(
        aliases
          .map((alias) => alias.trim())
          .filter((alias) => alias.length > 0),
      ),
    )
    const newTeam: Team = {
      id: editingTeam ? editingTeam.id : generateId(),
      name,
      logo: logo || "",
      primaryColor: colorForTeam,
      aliases: sanitizedAliases,
    };

    if (editingTeam) {
      onUpdateTeam(newTeam);
      setEditingTeam(null);
    } else {
      onAddTeam(newTeam);
    }

    // Limpiar el formulario
    setName("");
    setLogo(null);
    setPrimaryColor("#ff0000");
    setAliases([])
    setAliasInput("")
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setName(team.name)
    setLogo(team.logo)
    setPrimaryColor(team.primaryColor)
    setAliases(team.aliases ?? [])
    setAliasInput("")
  }

  const handleCancel = () => {
    setEditingTeam(null)
    setName("")
    setLogo(null)
    setPrimaryColor("#ff0000")
    setAliases([])
    setAliasInput("")
  }

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkUploadStatus({
      loading: true,
      message: `Procesando ${files.length} archivos...`,
      success: false,
    });

    const newTeams: Team[] = [];
    const processedFiles: string[] = [];
    const duplicatedTeams: string[] = [];

    // Para evitar duplicados por nombre
    const existingNames = teams.map((t) => normalizeName(t.name));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Extraer el nombre del equipo del nombre del archivo
        let teamName = file.name.split(".")[0];
        teamName = teamName.replace(/_/g, " ").replace(/-/g, " ").trim();
        const normalizedBulkName = normalizeName(teamName)

        // Verificar duplicados
        if (
          normalizedBulkName &&
          (existingNames.includes(normalizedBulkName) ||
            newTeams.some((t) => normalizeName(t.name) === normalizedBulkName))
        ) {
          duplicatedTeams.push(teamName);
          continue;
        }

        // Convertir a base64
        const base64 = await fileToBase64(file);
        // Buscar color predominante usando nombre normalizado
        const normalizedTeamName = normalizeName(teamName);
        // Buscar coincidencia por nombre normalizado
        const colorForTeam =
          Object.entries(defaultTeamColors).find(([key]) => normalizeName(key) === normalizedTeamName)?.[1] ||
          `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;
        // Crear el equipo
        const newTeam: Team = {
          id: generateId(),
          name: teamName,
          logo: base64,
          primaryColor: colorForTeam,
          aliases: [],
        };
        newTeams.push(newTeam);
        processedFiles.push(teamName);
        // Actualizar el estado para mostrar el progreso
        if (i % 10 === 0 || i === files.length - 1) {
          setBulkUploadStatus({
            loading: true,
            message: `Procesados ${i + 1} de ${files.length} archivos...`,
            success: false,
          });
        }
      } catch (error) {
        console.error(`Error al procesar el archivo ${file.name}:`, error);
      }
    }

    // Agregar todos los equipos nuevos
    onBulkAddTeams(newTeams);

    // Limpiar el input de archivos
    e.target.value = "";

    // Mostrar feedback final
    let message = `${newTeams.length} equipos agregados correctamente.`;
    if (duplicatedTeams.length > 0) {
      message += `\n${duplicatedTeams.length} archivos ignorados por nombre duplicado: ${duplicatedTeams.join(", ")}`;
    }
    setBulkUploadStatus({
      loading: false,
      message,
      success: duplicatedTeams.length === 0,
    });
  }

  const handleAliasAdd = () => {
    const trimmed = aliasInput.trim()
    if (!trimmed) return
    const normalized = normalizeName(trimmed)
    if (!normalized) return
    const exists = aliases.some((alias) => normalizeName(alias) === normalized)
    if (exists || normalizeName(name) === normalized) {
      setAliasInput("")
      return
    }
    setAliases((prev) => [...prev, trimmed])
    setAliasInput("")
  }

  const handleAliasRemove = (alias: string) => {
    setAliases((prev) => prev.filter((item) => item !== alias))
  }

  const handleAliasKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleAliasAdd()
    }
  }

  const normalizedDisplay = normalizedTeamName || "—"

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleImportFromPublic}>
            Importar desde carpeta pública
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleApplyDefaultColors}>
          Aplicar colores por defecto
        </Button>
      </div>
      <Tabs defaultValue="bulk">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="individual">Agregar Individual</TabsTrigger>
          <TabsTrigger value="bulk">Carga Masiva</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>{editingTeam ? "Editar Equipo" : "Agregar Nuevo Equipo"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Equipo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  {name && (
                    <p className="text-xs text-muted-foreground">
                      Se buscará como: <span className="font-medium">{normalizedDisplay}</span>
                    </p>
                  )}
                  {duplicateTeam && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>
                        Ya existe un equipo que coincide con este nombre normalizado ({duplicateTeam.name}).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="aliases">Alias y apodos</Label>
                  <div className="flex gap-2">
                    <Input
                      id="aliases"
                      placeholder="Ej: Ciclón"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      onKeyDown={handleAliasKeyDown}
                    />
                    <Button type="button" variant="outline" onClick={handleAliasAdd} disabled={!aliasInput.trim()}>
                      Agregar
                    </Button>
                  </div>
                  {aliases.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aliases.map((alias) => (
                        <span
                          key={alias}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                        >
                          {alias}
                          <button type="button" onClick={() => handleAliasRemove(alias)} className="text-muted-foreground/70 hover:text-muted-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logo">Logo del Equipo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} required={!editingTeam} />
                  {logo && (
                    <div className="mt-2">
                      <img src={logo || "/placeholder.svg"} alt="Logo Preview" className="w-20 h-20 object-contain" />
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {editingTeam ? (
                  <>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!name || !logo || !!duplicateTeam}>
                      Guardar Cambios
                    </Button>
                  </>
                ) : (
                  <Button type="submit" className="w-full" disabled={!name || !logo || !!duplicateTeam}>
                    Agregar Equipo
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Carga Masiva de Equipos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bulkLogos">Seleccionar Múltiples Logos</Label>
                <p className="text-sm text-muted-foreground">
                  El nombre del archivo será usado como nombre del equipo. Se asignará un color aleatorio a cada equipo.
                </p>
                <Input id="bulkLogos" type="file" accept="image/*" multiple onChange={handleBulkUpload} />
              </div>

              {bulkUploadStatus.message && (
                <Alert variant={bulkUploadStatus.success ? "default" : "destructive"}>
                  <AlertDescription>
                    {bulkUploadStatus.loading && (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        {bulkUploadStatus.message}
                      </div>
                    )}
                    {!bulkUploadStatus.loading && bulkUploadStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Nota: Puedes editar los equipos después de cargarlos para ajustar sus colores o nombres.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {teams
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((team) => (
          <Card key={team.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {team.aliases && team.aliases.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {team.aliases.map((alias) => (
                    <span key={alias} className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {alias}
                    </span>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-4">
                <img src={team.logo || "/placeholder.svg"} alt={team.name} className="w-16 h-16 object-contain" />
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: team.primaryColor }} />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="icon" onClick={() => onPreviewTeam(team)} className="flex-1">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleEdit(team)} className="flex-1">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDeleteTeam(team.id)} className="flex-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
