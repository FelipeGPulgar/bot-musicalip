# Bot Musicalip

Este es un bot de música desarrollado en Node.js. Permite a los usuarios reproducir música, gestionar una cola de canciones y realizar otras acciones relacionadas con la reproducción de música en un servidor de Discord. El bot está diseñado para estar activo 24/7 utilizando [Railway](https://railway.com/new).

## Comandos disponibles

- **`play`**: Reproduce una canción o agrega una canción a la cola.
- **`pausar`**: Pausa la reproducción actual.
- **`reanudar`**: Reanuda la reproducción pausada.
- **`saltar`**: Salta a la siguiente canción en la cola.
- **`detener`**: Detiene la reproducción y limpia la cola.
- **`cola`**: Muestra la lista de canciones en la cola.
- **`ayuda`**: Muestra información sobre los comandos disponibles.

## Requisitos

- Node.js (versión 16 o superior)
- npm (gestor de paquetes de Node.js)

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/FelipeGPulgar/bot-musicalip.git
   ```

2. Navega al directorio del proyecto:
   ```bash
   cd bot-musicalip
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

## Despliegue en Railway

1. Ve a [Railway](https://railway.com/new) y crea un nuevo proyecto.

2. Conecta tu repositorio de GitHub al proyecto de Railway.

3. Configura las variables de entorno necesarias (como el token del bot de Discord) en la sección de configuración de Railway.

4. Railway detectará automáticamente el archivo `Procfile` y configurará el comando de inicio del bot.

5. Despliega el proyecto y el bot estará activo 24/7.

## Uso local (opcional)

1. Crea un archivo `.env` en la raíz del proyecto y configura las variables necesarias (como el token del bot de Discord).

2. Inicia el bot:
   ```bash
   node index.js
   ```

## Contribución

Si deseas contribuir a este proyecto, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la licencia MIT.