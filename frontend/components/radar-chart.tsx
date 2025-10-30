"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface Player {
  Jugador: string
  Equipo: string
  valor_mercado: number
  goles_90: number
  regates_realizados_pct: number
  pases_90: number
  asistencias_90: number
  duelos_aereos_ganados_pct: number
  goles_cabeza_90: number
  duelos_atacantes_ganados_pct: number
}

interface RadarChartProps {
  player: Player
  comparisonPlayer?: Player
}

export function RadarChart({ player, comparisonPlayer }: RadarChartProps) {
  // Normalize values to 0-100 scale for better visualization
  const normalizeValue = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100)
  }

  const data = [
    {
      metric: "Goles/90min",
      [player.Jugador]: normalizeValue(player.goles_90, 2),
      ...(comparisonPlayer && {
        [comparisonPlayer.nombre]: normalizeValue(comparisonPlayer.goles_90, 2),
      }),
    },
    {
      metric: "Regates %",
      [player.Jugador]: player.regates_realizados_pct,
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: comparisonPlayer.regates_realizados_pct,
      }),
    },
    {
      metric: "Pases/90min",
      [player.Jugador]: normalizeValue(player.pases_90, 100),
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: normalizeValue(comparisonPlayer.pases_90, 100),
      }),
    },
    {
      metric: "Asistencias/90min",
      [player.Jugador]: normalizeValue(player.asistencias_90, 1),
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: normalizeValue(comparisonPlayer.asistencias_90, 1),
      }),
    },
    {
      metric: "Duelos Aéreos %",
      [player.Jugador]: player.duelos_aereos_ganados_pct,
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: comparisonPlayer.duelos_aereos_ganados_pct,
      }),
    },
    {
      metric: "Goles Cabeza/90min",
      [player.Jugador]: normalizeValue(player.goles_cabeza_90, 0.5),
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: normalizeValue(comparisonPlayer.goles_cabeza_90, 0.5),
      }),
    },
    {
      metric: "Duelos Ataque %",
      [player.Jugador]: player.duelos_atacantes_ganados_pct,
      ...(comparisonPlayer && {
        [comparisonPlayer.Jugador]: comparisonPlayer.duelos_atacantes_ganados_pct,
      }),
    },
  ]

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} className="text-xs" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} tickCount={5} />
          <Radar
            name={player.Jugador}
            dataKey={player.Jugador}
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {comparisonPlayer && (
            <Radar
              name={comparisonPlayer.Jugador}
              dataKey={comparisonPlayer.Jugador}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          )}
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
