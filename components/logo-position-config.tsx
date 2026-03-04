"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GlobalLogoOffset {
  home: { x: number; y: number };
  away: { x: number; y: number };
}

interface LogoPositionConfigProps {
  globalLogoOffset: GlobalLogoOffset
  setGlobalLogoOffset: (offset: GlobalLogoOffset) => void
  homeLogoSize: number
  setHomeLogoSize: (size: number) => void
  awayLogoSize: number
  setAwayLogoSize: (size: number) => void
}

export default function LogoPositionConfig({ globalLogoOffset, setGlobalLogoOffset, homeLogoSize, setHomeLogoSize, awayLogoSize, setAwayLogoSize }: LogoPositionConfigProps) {
  // Handler for changing global offset
  const handleGlobalOffsetChange = (side: "home" | "away", axis: "x" | "y", value: number) => {
    setGlobalLogoOffset({
      ...globalLogoOffset,
      [side]: {
        ...globalLogoOffset[side],
        [axis]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Global de Posición de Logos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Local */}
          <div>
            <div className="grid gap-4">
              <div>
                <Label>Tamaño Logo Local</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min={0.3}
                    max={2}
                    step={0.05}
                    value={homeLogoSize}
                    onChange={e => setHomeLogoSize(Number(e.target.value))}
                    className="w-40"
                  />
                  <span className="w-12 text-sm">{homeLogoSize.toFixed(2)}x</span>
                </div>
              </div>
              <div>
                <Label>Logo Local - Offset X/Y</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={globalLogoOffset.home.x}
                    onChange={(e) => setGlobalLogoOffset({ ...globalLogoOffset, home: { ...globalLogoOffset.home, x: Number(e.target.value) } })}
                    className="w-20"
                    step={1}
                  />
                  <Input
                    type="number"
                    value={globalLogoOffset.home.y}
                    onChange={(e) => setGlobalLogoOffset({ ...globalLogoOffset, home: { ...globalLogoOffset.home, y: Number(e.target.value) } })}
                    className="w-20"
                    step={1}
                  />
                </div>
              </div>
              <div>
                <Label>X (izq/derecha)</Label>
                <Input
                  type="number"
                  value={globalLogoOffset.home.x}
                  min={-500}
                  max={500}
                  onChange={(e) => handleGlobalOffsetChange("home", "x", Number(e.target.value))}
                  className="mb-2"
                />
                <Label>Y (arriba/abajo)</Label>
                <Input
                  type="number"
                  value={globalLogoOffset.home.y}
                  min={-500}
                  max={500}
                  onChange={(e) => handleGlobalOffsetChange("home", "y", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          {/* Visitante */}
          <div>
            <div className="grid gap-4">
              <div>
                <Label>Tamaño Logo Visitante</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min={0.3}
                    max={2}
                    step={0.05}
                    value={awayLogoSize}
                    onChange={e => setAwayLogoSize(Number(e.target.value))}
                    className="w-40"
                  />
                  <span className="w-12 text-sm">{awayLogoSize.toFixed(2)}x</span>
                </div>
              </div>
              <div>
                <Label>Logo Visitante - Offset X/Y</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={globalLogoOffset.away.x}
                    onChange={(e) => setGlobalLogoOffset({ ...globalLogoOffset, away: { ...globalLogoOffset.away, x: Number(e.target.value) } })}
                    className="w-20"
                    step={1}
                  />
                  <Input
                    type="number"
                    value={globalLogoOffset.away.y}
                    onChange={(e) => setGlobalLogoOffset({ ...globalLogoOffset, away: { ...globalLogoOffset.away, y: Number(e.target.value) } })}
                    className="w-20"
                    step={1}
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Logo como Visitante</h3>
                <Label>X (izq/derecha)</Label>
                <Input
                  type="number"
                  value={globalLogoOffset.away.x}
                  min={-500}
                  max={500}
                  onChange={(e) => handleGlobalOffsetChange("away", "x", Number(e.target.value))}
                  className="mb-2"
                />
                <Label>Y (arriba/abajo)</Label>
                <Input
                  type="number"
                  value={globalLogoOffset.away.y}
                  min={-500}
                  max={500}
                  onChange={(e) => handleGlobalOffsetChange("away", "y", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
