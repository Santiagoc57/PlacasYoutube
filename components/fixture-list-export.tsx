import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Fixture, Team } from "@/lib/types";
import { downloadImage } from "@/lib/utils";

interface FixtureListExportProps {
  fixtures: Fixture[];
  teams: Team[];
  date: string;
  width?: number;
  height?: number;
}

// Utilidad para buscar equipo por id
const getTeam = (teams: Team[], id: string) => teams.find(t => t.id === id);

const ROW_HEIGHT = 160;
const PADDING = 32;
const TEAM_LOGO_SIZE = 96;
const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

export const FixtureListExport: React.FC<FixtureListExportProps> = ({ fixtures, teams, date, width = 1200, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Altura dinámica según cantidad de partidos
  const canvasHeight = height || (fixtures.length * ROW_HEIGHT + PADDING * 2 + 80);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadImage(canvas.toDataURL(), `fixture-list-${date.replace(/\//g, '-')}.png`);
  };

  // Renderiza la lista de partidos en el canvas
  const renderCanvas = (ctx: CanvasRenderingContext2D) => {
    // Fondo negro
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, canvasHeight);

    // Título fecha
    ctx.font = `bold 48px ${FONT_FAMILY}`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(date, width / 2, PADDING + 24);

    fixtures.forEach((fixture, i) => {
      const y = PADDING + 64 + i * ROW_HEIGHT;
      const home = getTeam(teams, fixture.homeTeamId);
      const away = getTeam(teams, fixture.awayTeamId);
      if (!home || !away) return;

      // Fondo naranja fila
      ctx.fillStyle = "#F15A29";
      ctx.fillRect(PADDING + TEAM_LOGO_SIZE + 24, y, width - (PADDING * 2 + TEAM_LOGO_SIZE * 2 + 48), ROW_HEIGHT - 24);

      // Logos
      // Home
      const homeLogo = new window.Image();
      homeLogo.src = home.logo;
      // Away
      const awayLogo = new window.Image();
      awayLogo.src = away.logo;

      // Dibuja logos cuando cargan
      homeLogo.onload = () => {
        ctx.drawImage(homeLogo, PADDING, y + 16, TEAM_LOGO_SIZE, TEAM_LOGO_SIZE);
      };
      awayLogo.onload = () => {
        ctx.drawImage(awayLogo, width - PADDING - TEAM_LOGO_SIZE, y + 16, TEAM_LOGO_SIZE, TEAM_LOGO_SIZE);
      };
      // Si ya están cargados
      if (homeLogo.complete) ctx.drawImage(homeLogo, PADDING, y + 16, TEAM_LOGO_SIZE, TEAM_LOGO_SIZE);
      if (awayLogo.complete) ctx.drawImage(awayLogo, width - PADDING - TEAM_LOGO_SIZE, y + 16, TEAM_LOGO_SIZE, TEAM_LOGO_SIZE);

      // Nombres equipos y hora
      ctx.font = `bold 32px ${FONT_FAMILY}`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(home.name, PADDING + TEAM_LOGO_SIZE + 40, y + 60);
      ctx.textAlign = "center";
      ctx.font = `bold 48px ${FONT_FAMILY}`;
      ctx.fillText(fixture.time, width / 2, y + 70);
      ctx.textAlign = "right";
      ctx.font = `bold 32px ${FONT_FAMILY}`;
      ctx.fillText(away.name, width - PADDING - TEAM_LOGO_SIZE - 40, y + 60);
    });
  };

  // Renderiza cuando cambia la lista de fixtures
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderCanvas(ctx);
  }, [fixtures, teams, date, width, canvasHeight]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} width={width} height={canvasHeight} style={{ borderRadius: 16, boxShadow: '0 2px 16px #0008', maxWidth: '100%' }} />
      <Button onClick={handleDownload} className="mt-2">Descargar Imagen</Button>
    </div>
  );
};

export default FixtureListExport;
