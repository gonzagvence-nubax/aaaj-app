# Usa una imagen base oficial de Python
FROM python:3.9-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de la aplicación al contenedor
COPY . /app

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Expone el puerto 3038
EXPOSE 3038

# Comando para ejecutar el servidor FastAPI con Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3038"]
