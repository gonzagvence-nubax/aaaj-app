"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import { PlayerComparison } from "@/components/player-comparison"
import Image from "next/image"

interface Player {
  Jugador: string
  equipo: string
  valor_mercado: number
  goles_90: number
  regates_realizados_pct: number
  pases_90: number
  asistencias_90: number
  duelos_aereos_ganados_pct: number
  goles_cabeza_90: number
  duelos_atacantes_ganados_pct: number
}

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  players?: Player[]
  timestamp: Date
}

export default function ScoutingChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "¡Hola! Soy tu asistente de scouting de Argentinos Juniors. Busca jugadores similares escribiendo un nombre.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const healthResponse = await fetch("http://localhost:3038/health")
      if (!healthResponse.ok) {
        throw new Error("API no disponible")
      }

      const response = await fetch(`http://localhost:3038/search-player?name=${encodeURIComponent(input)}`)

      if (!response.ok) {
        throw new Error("Error en la búsqueda")
      }

      const players: Player[] = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `Encontré información sobre ${players[0]?.Jugador || input} y jugadores similares:`,
        players,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "Lo siento, no pude encontrar información sobre ese jugador. Verifica que el nombre esté correcto o que la API esté disponible.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-700 mb-3 tracking-tight">Argentinos Juniors - Scoutly Chat</h1>
          <p className="text-gray-700 text-lg font-medium">
            Un chatbot para ayudar a los scouts a encontrar joyas debajo del radar
          </p>
        </div>

        {/* Chat Container */}
        <Card className="h-[650px] flex flex-col shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 px-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              Asistente de Scouting - Argentinos Juniors
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                <div className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex gap-3 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user" ? "bg-blue-600" : "bg-red-600"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Image
                          src="/scout-avatar.png"
                          alt="Scout Avatar"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl p-4 shadow-sm ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>

                {/* Player Comparison Component */}
                {message.players && message.players.length > 0 && <PlayerComparison players={message.players} />}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/scout-avatar.png"
                    alt="Scout Avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                    <span className="text-gray-700 font-medium">Buscando jugadores...</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <div className="p-6 border-t border-gray-200 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe el nombre de un jugador..."
                disabled={isLoading}
                className="flex-1 h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-red-500/20 text-base"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 px-6 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
