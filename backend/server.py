from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from process_query import SearchSimilarPlayers
import uvicorn
from functools import lru_cache
from fastapi.middleware.cors import CORSMiddleware

@lru_cache(maxsize=1)
def get_search_service() -> SearchSimilarPlayers:
    return SearchSimilarPlayers()

model = get_search_service()
# Crear la instancia de la aplicación FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",  # opcional, por si accedés con 127.0.0.1
    ],
    allow_credentials=True,   # ponelo en False si NO usás cookies/Authorization
    allow_methods=["*"],      # o restringí a ["GET"]
    allow_headers=["*"],
    max_age=86400,
)

# Endpoint para buscar un jugador por nombre
@app.get("/search-player")
async def search_player(name: str):
    result = model.search(name)
    cols = [
        "Jugador","Equipo","Valor de mercado (Transfermarkt)","Goles/90",
        "Regates realizados, %","Pases/90","Asistencias/90",
        "Duelos aéreos ganados, %","Goles de cabeza/90","Duelos atacantes ganados, %"
    ]

    rename_map = {
        "Valor de mercado (Transfermarkt)": "valor_mercado",
        "Goles/90": "goles_90",
        "Regates realizados, %": "regates_realizados_pct",
        "Pases/90": "pases_90",
        "Asistencias/90": "asistencias_90",
        "Duelos aéreos ganados, %": "duelos_aereos_ganados_pct",
        "Goles de cabeza/90": "goles_cabeza_90",
        "Duelos atacantes ganados, %": "duelos_atacantes_ganados_pct",
    }

    data = result[cols].rename(columns=rename_map).to_dict(orient="records")
    return JSONResponse(content=data)  # FastAPI lo devuelve como JSON

# Health endpoints
@app.get("/opinion_player", tags=["opinion_player"])
async def opinion_player(name: str):
    results = model.get_opinion(name)
    return results


# Health endpoints
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

# Configurar para que se ejecute en el puerto 3038
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3038)
