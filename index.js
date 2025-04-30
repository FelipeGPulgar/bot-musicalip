const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, Events } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, NoSubscriberBehavior } = require('@discordjs/voice');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
require('dotenv').config();

// Eliminar la configuración y manejo de Spotify
// ...existing code...
// Configuración específica de play-dl para Spotify
// Eliminado el bloque de configuración de Spotify
// ...existing code...
(async () => {
  try {
    console.log('Inicializando token de Spotify con credenciales de cliente...');
    // Eliminado el manejo de tokens de Spotify
    console.log('Spotify deshabilitado.');
  } catch (error) {
    console.error('Error al inicializar Spotify:', error.message);
  }
})();

// Crear cliente de Discord con los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuración del bot
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Almacenamiento para las conexiones de música
client.musicConnections = new Map();

// Cargar comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

// Crear directorio de comandos si no existe
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Evento de inicio
client.once('ready', async () => {
  console.log(`¡Bot de música listo! Conectado como ${client.user.tag}`);
  
  // Establecer estado del bot
  client.user.setActivity('música | /ayuda', { type: ActivityType.Listening });
  
  // Registrar comandos inmediatamente al iniciar
  await registerCommands();
});

// Función para registrar comandos slash
async function registerCommands() {
  try {
    const commands = [];
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    console.log('Iniciando registro de comandos (/) de la aplicación.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log('Comandos (/) registrados correctamente.');
  } catch (error) {
    console.error(error);
  }
}

// Manejador de comandos
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    const errorMessage = { content: '¡Hubo un error al ejecutar este comando!', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Actualizar la función playUrl para eliminar youtube-dl-exec
async function playUrl(interaction, url) {
  try {
    const guildId = interaction.guild.id;
    let musicConnection = client.musicConnections.get(guildId);

    if (!musicConnection) {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return 'Necesitas estar en un canal de voz para reproducir música.';
      }

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false
        });

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
          }
        });
        connection.subscribe(player);

        musicConnection = {
          connection,
          player,
          queue: [],
          currentItem: null,
          playing: false,
          textChannel: interaction.channel
        };

        client.musicConnections.set(guildId, musicConnection);

        player.on(AudioPlayerStatus.Idle, () => {
          musicConnection.playing = false;
          playNext(guildId);
        });

        player.on('error', error => {
          console.error('Error en el reproductor de audio:', error);
          musicConnection.playing = false;
          if (musicConnection.textChannel) {
            musicConnection.textChannel.send('❌ Se produjo un error durante la reproducción. Intentando reproducir la siguiente canción...');
          }
          playNext(guildId);
        });
      } catch (error) {
        console.error('Error al conectar al canal de voz:', error);
        return '❌ No pude conectarme al canal de voz. Por favor, inténtalo de nuevo.';
      }
    }

    try {
      console.log(`Intentando reproducir: ${url}`);

      // Intentar con play-dl primero
      try {
        console.log('Intentando con play-dl...');
        const { stream, type } = await playdl.stream(url, {
          quality: 0,
          discordPlayerCompatibility: true
        });

        const resource = createAudioResource(stream, {
          inputType: type,
          inlineVolume: true
        });

        if (resource.volume) {
          resource.volume.setVolume(0.6);
        }

        musicConnection.player.play(resource);
        musicConnection.playing = true;

        console.log(`Reproduciendo con play-dl: ${url}`);
        return `🎵 Reproduciendo: **${url}**`;
      } catch (playDlError) {
        console.error('Error con play-dl:', playDlError);
      }

      // Intentar con ytdl-core como respaldo
      try {
        console.log('Intentando con ytdl-core...');
        const stream = ytdl(url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25
        });

        const resource = createAudioResource(stream, {
          inputType: 'opus',
          inlineVolume: true
        });

        if (resource.volume) {
          resource.volume.setVolume(0.6);
        }

        musicConnection.player.play(resource);
        musicConnection.playing = true;

        console.log(`Reproduciendo con ytdl-core: ${url}`);
        return `🎵 Reproduciendo: **${url}**`;
      } catch (ytdlError) {
        console.error('Error con ytdl-core:', ytdlError);
      }

      return '❌ No se pudo reproducir esta URL. Todas las herramientas fallaron.';
    } catch (error) {
      console.error('Error en playUrl:', error);
      return `❌ Ocurrió un error al reproducir la música: ${error.message}`;
    }
  } catch (error) {
    console.error('Error en playUrl:', error);
    return `❌ Ocurrió un error al reproducir la música: ${error.message}`;
  }
}

// Función para reproducir la siguiente canción
async function playNext(guildId) {
  const musicConnection = client.musicConnections.get(guildId);
  
  if (!musicConnection) {
    console.log(`No se encontró conexión de música para guild ${guildId}`);
    return;
  }
  
  // Si la cola está vacía, limpiar la referencia actual
  if (musicConnection.queue.length === 0) {
    console.log('Cola vacía, no hay más canciones para reproducir');
    musicConnection.currentItem = null;
    musicConnection.playing = false;
    
    // Notificar que se ha terminado la cola
    if (musicConnection.textChannel) {
      musicConnection.textChannel.send('🎵 No hay más canciones en la cola.');
    }
    return;
  }
  
  // Obtener la siguiente canción
  const nextSong = musicConnection.queue.shift();
  musicConnection.currentItem = nextSong;
  
  try {
    console.log(`Intentando reproducir: ${nextSong.title}`);
    
    // Intentamos primero con youtube-dl-exec
    console.log("Obteniendo stream con youtube-dl-exec...");
    
    try {
      // Crear stream de audio usando youtube-dl-exec
      const audioStream = await createYouTubeDlStream(nextSong.url);
      
      console.log("Stream de youtube-dl-exec obtenido");
      
      // Crear un recurso de audio - usando un stream "procesado" debe ayudar con la calidad
      const resource = createAudioResource(audioStream, {
        inputType: 'arbitrary', // Cambiado de 'raw' a 'arbitrary'
        inlineVolume: true
      });
      
      // Volumen reducido a 60% para evitar sonido muy alto
      if (resource.volume) {
        resource.volume.setVolume(0.6);
      }
      
      console.log("Recurso de audio creado con youtube-dl-exec, intentando reproducir...");
      
      // Reproducir
      musicConnection.player.play(resource);
      musicConnection.playing = true;
      console.log(`Reproduciendo con youtube-dl-exec: ${nextSong.title}`);
      
    } catch (youtubeDlError) {
      console.error("Error al usar youtube-dl-exec:", youtubeDlError);
      throw youtubeDlError; // Lanzar para probar el siguiente método
    }
    
    // Notificar en el canal de texto sobre la reproducción
    if (musicConnection.textChannel) {
      const minutes = Math.floor(nextSong.duration / 60);
      const seconds = nextSong.duration % 60;
      const durationText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      
      musicConnection.textChannel.send({
        content: `🎵 Ahora reproduciendo: **${nextSong.title}** | Duración: \`${durationText}\` | Solicitado por: ${nextSong.requestedBy}`
      });
    }
    
  } catch (error) {
    console.error('Error al reproducir con youtube-dl-exec:', error);
    
    // Intentar con ytdl-core como segunda opción
    try {
      console.log("Intentando reproducir con ytdl-core como respaldo...");
      
      const stream = ytdl(nextSong.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // 32MB buffer
        dlChunkSize: 0, // Descargar en una sola pieza
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': 'VISITOR_INFO1_LIVE=bZUDle4H7oo;'
          }
        }
      });
      
      const resource = createAudioResource(stream, {
        inputType: 'opus' in stream ? 'opus' : 'arbitrary', // Cambiado 'raw' a 'arbitrary'
        inlineVolume: true
      });
      
      if (resource.volume) {
        resource.volume.setVolume(0.6); // Reducido a 60%
      }
      
      musicConnection.player.play(resource);
      musicConnection.playing = true;
      
      console.log(`Reproduciendo con ytdl-core: ${nextSong.title}`);
      
    } catch (ytdlError) {
      console.error('Error también con ytdl-core:', ytdlError);
      
      // Intentar con play-dl como última opción
      try {
        console.log("Intentando reproducir con play-dl como último recurso...");
        const { stream, type } = await playdl.stream(nextSong.url, {
          quality: 0,
          discordPlayerCompatibility: true
        });
        
        const resource = createAudioResource(stream, {
          inputType: type,
          inlineVolume: true
        });
        
        if (resource.volume) {
          resource.volume.setVolume(0.6); // Reducido a 60% por que o si no te caga los oidos  atte tu mamita
        }
        
        musicConnection.player.play(resource);
        musicConnection.playing = true;
        
        console.log(`Reproduciendo con play-dl: ${nextSong.title}`);
        
      } catch (fallbackError) {
        console.error('Error con todos los métodos de reproducción:', fallbackError);
        
        if (musicConnection.textChannel) {
          musicConnection.textChannel.send(`❌ No se pudo reproducir **${nextSong.title}**. Error: ${error.message}. Pasando a la siguiente canción...`);
        }
        
        // Intentar con la siguiente canción
        musicConnection.currentItem = null;
        musicConnection.playing = false;
        playNext(guildId);
      }
    }
  }
}

// Función auxiliar para convertir la salida de youtube-dl en un stream legible
function createYouTubeDlStream(url) {
  return new Promise((resolve, reject) => {
    console.log(`Creando proceso youtube-dl para: ${url}`);
    
    // Configurar opciones para youtube-dl
    const youtubeDlProcess = youtubeDl.exec(
      url,
      {
        format: 'bestaudio[ext=m4a]/bestaudio/best', // Solicitar formato m4a o similar que funciona mejor
        quiet: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        audioFormat: 'mp3',     // Forzar conversión a mp3
        audioQuality: '0',      // Mejor calidad
        output: '-',            // Salida a stdout
        extractAudio: true,     // Extraer sólo audio
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        ]
      },
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    
    if (!youtubeDlProcess.stdout) {
      reject(new Error('Error al iniciar proceso youtube-dl'));
      return;
    }
    
    youtubeDlProcess.stderr?.on('data', (data) => {
      console.error(`youtube-dl stderr: ${data.toString()}`);
    });
    
    youtubeDlProcess.on('error', (error) => {
      console.error(`Error en proceso youtube-dl: ${error.message}`);
      reject(error);
    });
    
    console.log('Proceso youtube-dl iniciado correctamente');
    resolve(youtubeDlProcess.stdout);
  });
}

// Función para obtener info del video usando youtube-dl
async function getVideoInfo(url) {
  try {
    console.log(`Obteniendo información del video con youtube-dl: ${url}`);
    const output = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    
    return {
      title: output.title,
      url: url,
      thumbnail: output.thumbnail || 'https://i.ytimg.com/vi/default/default.jpg',
      duration: output.duration,
    };
  } catch (error) {
    console.error(`Error al obtener información con youtube-dl: ${error.message}`);
    throw error;
  }
}

// Hacer disponible la función de reproducción globalmente
client.playUrl = playUrl;
client.playNext = playNext;

// Manejar errores no capturados
process.on('unhandledRejection', error => {
  console.error('Error no controlado:', error);
});

// Iniciar sesión en Discord con el token del bot
client.login(TOKEN);