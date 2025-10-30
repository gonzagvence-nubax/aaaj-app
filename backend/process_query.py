from ollama import Client
from ollama import ChatResponse
import ollama
from dotenv import dotenv_values
import pandas as pd
import re
import difflib
from unidecode import unidecode
import model as mds
class PlayerNameExtractor:
    def __init__(self):
        self.config = dotenv_values(".env")
        self.ollama_host = f'http://{self.config.get("OLLAMA_ADDRESS")}:{self.config.get("OLLAMA_PORT")}'
        try:
            self._client = ollama.Client(host=self.ollama_host)
        except Exception as e:
            raise ConnectionError(f"No se pudo conectar al servidor Ollama en {self.ollama_host}. Error: {e}")
        self.system_prompt  = """
        Eres un asistente especializado en identificar el nombre de una persona en un texto.
        Responde solo con el nombre de la persona si lo encuentras, de lo contrario responde con "No encontrado".
        No agregues ningún otro texto o explicación.
        Por ejemplo:

        Usuario: "Quiero jugadores similar a Lionel Messi"
        Asistente: "Lionel Messi"
        --------------------------------------------------
        Usuario: "Dame los jugadores más parecidos a Cristiano Ronaldo"
        Asistente: "Cristiano Ronaldo"
        --------------------------------------------------
        Usuario: "Kylian Mbappe"
        Asistente: "Kylian Mbappe"
        --------------------------------------------------
        Usuario: "Muéstrame jugadores similares a Neymar"
        Asistente: "Neymar"
        --------------------------------------------------
        Usuario: "Quiero jugadores similares a Xavi Hernández"
        Asistente: "Xavi Hernández"
        --------------------------------------------------
        Usuario: "Dame jugadores parecidos a Andrés Iniesta"
        Asistente: "Andrés Iniesta"
        --------------------------------------------------
        Usuario: "Muéstrame jugadores similares a Luka Modric"
        Asistente: "Luka Modric"
        """
        self.messages = []
        self.messages.append({'role': 'system', 'content': self.system_prompt})
    
    def send_message(self, message):
        messages = [
            {'role': 'system', 'content': self.system_prompt},
            {'role': 'user', 'content': message}
        ]
        try:
            response = self._client.chat(
                    model="llama3:latest",
                    messages=messages,
                    options={'temperature': 0}
                )
            return response["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Error al comunicarse con Ollama en {self.ollama_host}: {e}")

class SearchPlayer:
    def __init__(self):
        self.extractor = PlayerNameExtractor()
        self.dataset = pd.read_csv("atacantes.csv")

        # Normalizaciones del dataset
        self.dataset["norm_full"] = self.dataset["Jugador"].apply(self._norm_full)
        self.dataset["norm_abbr"] = self.dataset["Jugador"].apply(self._norm_abbr)

    # -------- Helpers de normalización --------
    def _clean(self, s: str) -> str:
        s = unidecode((s or "").lower())
        s = s.replace(".", " ")
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def _norm_full(self, s: str) -> str:
        # "Matías Giménez" -> "matias gimenez"
        return self._clean(s)

    def _norm_abbr(self, s: str) -> str:
        # "Matías Agustín Giménez" -> "m gimenez"
        s = self._clean(s)
        if not s:
            return ""
        toks = s.split()
        first, last = toks[0], toks[-1]
        return f"{first[0]} {last}"

    # -------- Búsqueda --------
    def _best_row_by_exact_or_fuzzy(self, q: str, cutoff: float = 0.8):
        # 1) Exacto en full o abbr
        exact = (self.dataset["norm_full"] == q) | (self.dataset["norm_abbr"] == q)
        if exact.any():
            return self.dataset.loc[exact].iloc[0]

        # 2) Fuzzy (difflib) contra ambas listas
        choices = pd.unique(pd.concat([self.dataset["norm_full"], self.dataset["norm_abbr"]])).tolist()
        match = difflib.get_close_matches(q, choices, n=1, cutoff=cutoff)
        if match:
            # Volver del valor normalizado al registro original
            m = (self.dataset["norm_full"] == match[0]) | (self.dataset["norm_abbr"] == match[0])
            return self.dataset.loc[m].iloc[0]
        return None

    def search(self, query):
        player_name = self.extractor.send_message(query)
        if player_name == "No encontrado":
            return {"error": "Jugador no encontrado"}

        # Normalizamos dos variantes (completo y abreviado)
        q_full = self._norm_full(player_name)   # ej: "matias gimenez"
        q_abbr = self._norm_abbr(player_name)   # ej: "m gimenez"

        # Intento 1: forma completa
        row = self._best_row_by_exact_or_fuzzy(q_full)
        # Intento 2: si no hubo match, forma abreviada
        if row is None:
            row = self._best_row_by_exact_or_fuzzy(q_abbr)

        if row is None:
            return {"error": "Jugador no encontrado en la base de datos"}

        return {
    "player_name": row["Jugador"],
    "team": row["Equipo"]
}



class SearchSimilarPlayers:
    def __init__(self):
        self.search_player = SearchPlayer()
        self.model = mds.PlayerClustering()
        self.model.preprocess_data()
        self.config = dotenv_values(".env")
        self.ollama_host = f'http://{self.config.get("OLLAMA_ADDRESS")}:{self.config.get("OLLAMA_PORT")}'
        try:
            self._client = ollama.Client(host=self.ollama_host)
        except Exception as e:
            raise ConnectionError(f"No se pudo conectar al servidor Ollama en {self.ollama_host}. Error: {e}")
        self.system_prompt = (
            "Sos un analista de scouting de fútbol. Tu tarea es evaluar a un jugador "
            "EXCLUSIVAMENTE con las estadísticas provistas por el usuario. "
            "No inventes datos, no agregues información externa, no cites clubes o logros que no aparezcan. "
            "Tu salida debe ser breve (100–160 palabras), con un tono profesional, destacando: "
            "perfil/rol probable, 2–3 fortalezas, 1–2 debilidades o riesgos, y un cierre con ‘encaje táctico’ "
            "(por ejemplo: ‘encaja como extremo a pierna cambiada en 4-3-3 con libertad para atacar el segundo palo’)."
        )
        self.messages = []
        self.messages.append({'role': 'system', 'content': self.system_prompt})


    def search(self, query):
        # Utiliza el método de búsqueda del extractor
        player = self.search_player.search(query)
        if "error" in player:
            return {"error": "Jugador no encontrado"}
        player_name = player["player_name"]
        player_team = player["team"]
        # Obtiene los jugadores similares
        similar_players = self.model.get_suggested_players((player_name, player_team))
        # Devuelve los nombres de los jugadores similares
        return similar_players
    
    def get_opinion(self, player:str):
        player = self.search(player)
        row_str = " ".join(player.iloc[0].astype(str).tolist())
        # o con un formato clave=valor:
        row_str = ", ".join(f"{k}={v}" for k, v in player.iloc[0].astype(str).items())
        print(f"DEBUG: fila para LLM: {row_str}")
        messages = [
            {'role': 'system', 'content': self.system_prompt},
            {'role': 'user', 'content': row_str}
        ]
        try:
            response = self._client.chat(
                    model="llama3:latest",
                    messages=messages,
                    options={'temperature': 0}
                )
            return response["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Error al comunicarse con Ollama en {self.ollama_host}: {e}")


player = SearchSimilarPlayers()
result = player.get_opinion("Dame una opinion profesional sobre Gabriel Avalos")
print(result)