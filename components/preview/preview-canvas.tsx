"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { Team, Fixture, League } from "@/lib/types"
import { downloadImage, buildFixtureFilename, resolveLeagueLogo } from "@/lib/utils"

interface PreviewCanvasProps {
    fixture: Fixture
    teams: Team[]
    leagues: League[]
    globalLogoOffset: {
        home: { x: number; y: number }
        away: { x: number; y: number }
    }
    homeColor: string
    awayColor: string
    homeColorBrightness: number
    awayColorBrightness: number
    selectedLeagueId: string
    customLeagueLogo: string | null
    homeLogoSize: number
    awayLogoSize: number
    leagueLogoSize: number
    onRenderError?: (error: string | null) => void
}

export function PreviewCanvas({
    fixture,
    teams,
    leagues,
    globalLogoOffset,
    homeColor,
    awayColor,
    homeColorBrightness,
    awayColorBrightness,
    selectedLeagueId,
    customLeagueLogo,
    homeLogoSize,
    awayLogoSize,
    leagueLogoSize,
    onRenderError
}: PreviewCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRendering, setIsRendering] = useState(false)
    const [renderError, setRenderError] = useState<string | null>(null)
    const [templateLoaded, setTemplateLoaded] = useState(false)
    const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null)

    // Report errors to parent if callback provided
    useEffect(() => {
        if (onRenderError) onRenderError(renderError)
    }, [renderError, onRenderError])

    const getTeamById = (id: string) => teams.find((team) => team.id === id)
    const baseLeague = leagues.find(l => l.id === fixture.leagueId)
    const selectedLeague = leagues.find(l => l.id === selectedLeagueId)

    const leagueForRender = useMemo(() => {
        const targetLeague = selectedLeague || baseLeague
        if (!targetLeague) return undefined
        const resolvedLogo = customLeagueLogo || resolveLeagueLogo(targetLeague.id, targetLeague.logo)
        return {
            ...targetLeague,
            logo: resolvedLogo,
        }
    }, [selectedLeague, baseLeague, customLeagueLogo])

    // Cargar la plantilla al inicio
    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const img = new Image()
                img.crossOrigin = "anonymous"

                img.onload = () => {
                    console.log("Plantilla cargada correctamente")
                    setTemplateImage(img)
                    setTemplateLoaded(true)
                }

                img.onerror = (error) => {
                    console.error("Error al cargar la plantilla:", error)
                    setRenderError("No se pudo cargar la plantilla base")
                }

                img.src = "/logos/plantilla.png"
            } catch (error) {
                console.error("Error al cargar la plantilla:", error)
                setRenderError("Error al cargar la plantilla base")
            }
        }

        loadTemplate()
    }, [])

    const adjustBrightness = (hexColor: string, percent: number): string => {
        // Convertir hex a RGB
        const r = Number.parseInt(hexColor.slice(1, 3), 16)
        const g = Number.parseInt(hexColor.slice(3, 5), 16)
        const b = Number.parseInt(hexColor.slice(5, 7), 16)

        // Ajustar brillo
        const factor = percent / 100
        const newR = Math.min(255, Math.round(r * factor))
        const newG = Math.min(255, Math.round(g * factor))
        const newB = Math.min(255, Math.round(b * factor))

        // Convertir de nuevo a hex
        return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
    }

    const loadImage = (src: string, fallbackText: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"

            const timeout = setTimeout(() => {
                console.warn(`Timeout al cargar imagen: ${src}`)
                resolve(img)
            }, 5000)

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

                    const words = fallbackText.split(" ")
                    let line = ""
                    const lines = []
                    let y = 100

                    for (let i = 0; i < words.length; i++) {
                        const testLine = line + words[i] + " "
                        const metrics = ctx.measureText(testLine)
                        if (metrics.width > 180 && i > 0) {
                            lines.push(line)
                            line = words[i] + " "
                        } else {
                            line = testLine
                        }
                    }
                    lines.push(line)

                    if (lines.length > 1) {
                        y = 100 - (lines.length - 1) * 12
                    }

                    for (let i = 0; i < lines.length; i++) {
                        ctx.fillText(lines[i], 100, y + i * 24)
                    }
                }
                img.src = canvas.toDataURL()
            }
            img.src = src
        })
    }

    const renderThumbnailToCanvas = async (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        if (!fixture || !templateLoaded) return

        const homeTeam = getTeamById(fixture.homeTeamId)
        const awayTeam = getTeamById(fixture.awayTeamId)
        const league = leagueForRender
        if (!homeTeam || !awayTeam || !league) return

        const adjustedHomeColor = adjustBrightness(homeColor || homeTeam.primaryColor, homeColorBrightness)
        const adjustedAwayColor = adjustBrightness(awayColor || awayTeam.primaryColor, awayColorBrightness)

        // 1. Dibujar fondo dividido horizontal
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = adjustedHomeColor
        ctx.fillRect(0, 0, width / 2, height)
        ctx.fillStyle = adjustedAwayColor
        ctx.fillRect(width / 2, 0, width / 2, height)

        // 2. Dibujar la plantilla
        if (templateImage) {
            ctx.drawImage(templateImage, 0, 0, width, height)
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            ctx.fillRect(width / 3, 0, width / 3, height)
            ctx.fillStyle = "#FFFFFF"
            ctx.font = `bold ${Math.round(width * 0.06)}px Arial`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("HIGHLIGHTS", width / 2, height / 2)
            ctx.font = `bold ${Math.round(width * 0.018)}px Arial`
            ctx.fillText("BASQUETPASS.TV", width / 2, height - 80 * (height / 720))
        }

        // 3. Dibujar logos
        try {
            // Logo de la liga
            const leagueLogoImg = await loadImage(league.logo, league.name)
            const logoSize = width * 0.09375 * leagueLogoSize
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
            const homeAspectRatio = homeLogoImg.width / homeLogoImg.height
            let homeLogoWidth = teamLogoSize
            let homeLogoHeight = teamLogoSize
            if (homeAspectRatio > 2) {
                homeLogoHeight = teamLogoSize / homeAspectRatio
            } else {
                homeLogoWidth = teamLogoSize * homeAspectRatio
            }
            const scaleFactor = 0.8
            homeLogoWidth *= scaleFactor
            homeLogoHeight *= scaleFactor
            if (homeTeam && homeTeam.logo) {
                ctx.save()
                ctx.translate(
                    width * 0.166 + (globalLogoOffset.home.x || 0) / 100 * width,
                    height * 0.5 + (globalLogoOffset.home.y || 0) / 100 * height
                )
                const scaledHomeLogoSize = teamLogoSize * (homeLogoSize || 1)
                ctx.drawImage(
                    homeLogoImg,
                    -scaledHomeLogoSize / 2,
                    -scaledHomeLogoSize / 2,
                    scaledHomeLogoSize,
                    scaledHomeLogoSize
                )
                ctx.restore()
            }

            // Logo equipo visitante
            const awayLogoImg = await loadImage(awayTeam.logo, awayTeam.name)
            const awayAspectRatio = awayLogoImg.width / awayLogoImg.height
            let awayLogoWidth = teamLogoSize
            let awayLogoHeight = teamLogoSize
            if (awayAspectRatio > 1) {
                awayLogoHeight = teamLogoSize / awayAspectRatio
            } else {
                awayLogoWidth = teamLogoSize * awayAspectRatio
            }
            awayLogoWidth *= scaleFactor
            awayLogoHeight *= scaleFactor
            if (awayTeam && awayTeam.logo) {
                ctx.save()
                ctx.translate(
                    width * 0.834 + (globalLogoOffset.away.x || 0) / 100 * width,
                    height * 0.5 + (globalLogoOffset.away.y || 0) / 100 * height
                )
                const scaledAwayLogoSize = teamLogoSize * (awayLogoSize || 1)
                ctx.drawImage(
                    awayLogoImg,
                    -scaledAwayLogoSize / 2,
                    -scaledAwayLogoSize / 2,
                    scaledAwayLogoSize,
                    scaledAwayLogoSize
                )
                ctx.restore()
            }
        } catch (error) {
            console.error("Error drawing logos:", error)
        }
    }

    const renderThumbnail = async () => {
        if (!fixture || !canvasRef.current || !templateLoaded) {
            if (!templateLoaded) {
                setRenderError("Esperando a que se cargue la plantilla...")
            }
            return
        }

        setIsRendering(true)
        setRenderError(null)

        const homeTeam = getTeamById(fixture.homeTeamId)
        const awayTeam = getTeamById(fixture.awayTeamId)
        const league = leagueForRender

        if (!homeTeam || !awayTeam || !league) {
            setRenderError("Información del partido incompleta")
            setIsRendering(false)
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            setRenderError("No se pudo obtener el contexto del canvas")
            setIsRendering(false)
            return
        }

        canvas.width = 1280
        canvas.height = 720

        await renderThumbnailToCanvas(canvas, ctx, canvas.width, canvas.height)
        setIsRendering(false)
    }

    // Trigger render when deps change
    useEffect(() => {
        if (fixture && templateLoaded) {
            renderThumbnail()
        }
    }, [
        fixture,
        templateLoaded,
        leagueLogoSize,
        homeLogoSize,
        awayLogoSize,
        globalLogoOffset,
        homeColor,
        awayColor,
        homeColorBrightness,
        awayColorBrightness,
        selectedLeagueId,
        customLeagueLogo
    ])

    // Expose download method via custom event or ref could be better, but we will attach it to the window or pass a ref from parent
    // For now, let's keep it simple and just export the render function
    // But wait, the parent needs to call download. The parent can pass a ref to this component? 
    // No, better to keep the download logic here or expose the canvas.

    // Actually, we can just expose the canvas ref to the parent if needed, 
    // OR we can move the download logic to this component and expose a method.
    // Let's implement an imperative handle pattern if we want parent to trigger download, 
    // OR just listen to an event.

    // A cleaner way: The parent asks to download, we do it.

    // Let's make this component responsible for the canvas, and maybe exposing a method to get the data URL?
    // Or simply attach the ref passed from parent? 
    // Let's stick to the current plan: this component renders content. 
    // The 'download' button is in the parent or siblings? 
    // In the original, the download button generated a hidden canvas. 

    // We can duplicate the download logic here or make it a public function.
    // Let's attach the download function to the window for now or use a ref.

    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {isRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                )}
                {renderError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="bg-white p-4 rounded-md shadow-lg max-w-xs text-center">
                            <p className="text-red-500">{renderError}</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={renderThumbnail}>
                                Reintentar
                            </Button>
                        </div>
                    </div>
                )}
                <canvas ref={canvasRef} className="block h-auto w-full" id={`canvas-${fixture.id}`} />
        </div>
    )
}
