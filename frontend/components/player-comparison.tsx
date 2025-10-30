"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadarChart } from "@/components/radar-chart"

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

interface PlayerComparisonProps {
  players: Player[]
}

export function PlayerComparison({ players }: PlayerComparisonProps) {
  if (!players || players.length === 0) return null

  const mainPlayer = players[0]
  const similarPlayers = players.slice(1, 6)

  const formatValue = (value: number, type: "currency" | "percentage" | "number") => {
    switch (type) {
      case "currency":
        return `€${(value / 1000000).toFixed(1)}M`
      case "percentage":
        return `${value.toFixed(1)}%`
      case "number":
        return value.toFixed(2)
      default:
        return value.toString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Player Card */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-700">{mainPlayer.Jugador}</CardTitle>
          <p className="text-sm text-gray-600">{mainPlayer.Equipo}</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-red-600 mb-4">Estadísticas de la API</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{formatValue(mainPlayer.goles_90, "number")}</div>
                  <div className="text-xs text-gray-500">Goles/90min</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {formatValue(mainPlayer.regates_realizados_pct, "percentage")}
                  </div>
                  <div className="text-xs text-gray-500">Regates %</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatValue(mainPlayer.pases_90, "number")}</div>
                  <div className="text-xs text-gray-500">Pases/90min</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatValue(mainPlayer.asistencias_90, "number")}
                  </div>
                  <div className="text-xs text-gray-500">Asistencias/90min</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {formatValue(mainPlayer.duelos_aereos_ganados_pct, "percentage")}
                  </div>
                  <div className="text-xs text-gray-500">Duelos Aéreos %</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {formatValue(mainPlayer.goles_cabeza_90, "number")}
                  </div>
                  <div className="text-xs text-gray-500">Goles Cabeza/90min</div>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <div className="text-3xl font-bold text-green-600">
                  {formatValue(mainPlayer.valor_mercado, "currency")}
                </div>
                <div className="text-sm text-gray-500">Valor de Mercado</div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex items-center justify-center">
              <RadarChart player={mainPlayer} comparisonPlayer={similarPlayers[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Similar Players */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Jugadores Similares</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {similarPlayers.map((player, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{player.Jugador}</CardTitle>
                <p className="text-xs text-gray-500">{player.Equipo}</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Valor:</span>
                    <Badge variant="secondary">{formatValue(player.valor_mercado, "currency")}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Goles/90:</span>
                    <span className="font-medium">{formatValue(player.goles_90, "number")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Regates:</span>
                    <span className="font-medium">{formatValue(player.regates_realizados_pct, "percentage")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Pases/90:</span>
                    <span className="font-medium">{formatValue(player.pases_90, "number")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
