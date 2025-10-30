import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import scipy
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import euclidean_distances

class PlayerClustering:
    def __init__(self, dataset_path="atacantes.csv"):
        self.dataset = pd.read_csv(dataset_path)
        self.columns =  self.dataset.columns[14:]
        self.scaler = StandardScaler()

    def preprocess_data(self):
        """
        Preprocesa los datos del dataset de jugadores para el clustering.
        - Normaliza los nombres de los jugadores.
        - Calcula las estadísticas de los jugadores.
        - Realiza PCA para reducir la dimensionalidad de las características.
        - Ajusta las columnas para la busqueda de jugadores similares.
        - Elimina jugadores con estadísticas insuficientes.
        """
        # Ajustamos columnas
        self.dataset['Asistencias/90'] = (self.dataset['Asistencias']/self.dataset['Minutos jugados'])*90
        self.dataset = self.dataset[(self.dataset['pos1'] == 'CF') & (self.dataset['pos2'].isna())]
        
        # Hacemos PCA para reducir la dimensionalidad 

        # PCA para Goles --> La idea es resumir las habilidades de gol en menos variables
        pca_goles = PCA(n_components=3)
        col_goles = ["Goles/90","xG/90", "Goles de cabeza/90", "Remates/90", "Tiros a la portería, %", "Goles hechos, %"]
        X_scaled_goles = self.scaler.fit_transform(self.dataset[col_goles])
        X_pca_goles = pca_goles.fit_transform(X_scaled_goles)
        df_pca_goles = pd.DataFrame(X_pca_goles, columns=[f'PC_Goles/Tiros{i+1}' for i in range(3)], index=pd.MultiIndex.from_arrays([self.dataset['Jugador'], self.dataset['Equipo']],names=["Jugador", "Equipo"]))
        
        # PCA para Habilidad Creativa --> La idea es resumir las habilidades de pase y regate en menos variables
        pca_pases = PCA(n_components=5)
        col_pases = ["Faltas recibidas/90", "Pases/90", "xA/90", "Asistencias/90", "Desmarques/90", "Jugadas claves/90", "Ataque en profundidad/90", "Regates/90", "Regates realizados, %" ]
        X_scaled_pases = self.scaler.fit_transform(self.dataset[col_pases])
        X_pca_pases = pca_pases.fit_transform(X_scaled_pases)
        df_pca_pases = pd.DataFrame(X_pca_pases,columns=[f'PC_Pases{i+1}' for i in range(5)],index=pd.MultiIndex.from_arrays([self.dataset['Jugador'], self.dataset['Equipo']],names=["Jugador", "Equipo"]))

        # PCA para Movilidad --> La idea es resumir las habilidades de movilidad en menos variables
        pca_movilidad = PCA(n_components=4)
        col_movilidad = ['Duelos aéreos ganados, %', 'Acciones de ataque exitosas/90', 'Duelos atacantes ganados, %', 'Toques en el área de penalti/90', 'Altura']
        X_scaled_movilidad = self.scaler.fit_transform(self.dataset[col_movilidad])
        X_pca_movilidad = pca_movilidad.fit_transform(X_scaled_movilidad)
        df_pca_movilidad = pd.DataFrame(X_pca_movilidad, columns=[f'PC_Mov{i+1}' for i in range(4)], index=pd.MultiIndex.from_arrays([self.dataset['Jugador'], self.dataset['Equipo']], names=["Jugador", "Equipo"]))
        
        self.dataset_PCA = pd.concat([df_pca_movilidad, df_pca_pases, df_pca_goles], axis=1)
        self.dataset = self.dataset.set_index(pd.MultiIndex.from_arrays([self.dataset['Jugador'], self.dataset['Equipo']], names=["Jugador", "Equipo"]), drop=True)
        self.dataset = self.dataset.loc[:, ~self.dataset.columns.isin(["Jugador", "Equipo"])]


    def get_suggested_players(self, jugador_objetivo):
        # Paso 2: obtener el vector del jugador objetivo
        vector_objetivo = self.dataset_PCA.loc[jugador_objetivo].values.reshape(1, -1)

        # Paso 3: calcular distancias a todos los jugadores
        distancias = euclidean_distances(self.dataset_PCA.values, vector_objetivo).flatten()

        # Paso 4: construir DataFrame con distancias
        df_distancias = pd.DataFrame({
            "distancia": distancias
        }, index=self.dataset_PCA.index)

        # ✅ Paso 5: ordenar sin eliminar al jugador objetivo
        df_similares = df_distancias.sort_values("distancia")

        # Paso 6: convertir índice MultiIndex a columnas
        df_indices = df_similares.head(6).index.to_frame(index=False)

        # Paso 7: merge con df_atacantes
        df_jugadores_similares = pd.merge(df_indices, self.dataset, on=["Jugador", "Equipo"], how="left")
        
        return df_jugadores_similares

    

