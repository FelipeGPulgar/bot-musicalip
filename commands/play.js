const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const playdl = require('play-dl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música de varias plataformas (YouTube, Spotify, SoundCloud, etc.)')
    .addStringOption(option =>
      option.setName('busqueda')
        .setDescription('URL o texto para buscar en YouTube')
        .setRequired(true)),
  async execute(interaction, client) {
    await interaction.deferReply();
    
    // Verificar que el usuario esté en un canal de voz
    if (!interaction.member.voice.channel) {
      return interaction.followUp({ 
        content: 'Necesitas estar en un canal de voz para usar este comando', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const searchQuery = interaction.options.getString('busqueda');
    console.log(`Búsqueda solicitada: "${searchQuery}"`);
    
    try {
      let url = searchQuery;
      let trackInfo = null;
      
      // Detectar la plataforma de la URL o si es una búsqueda
      const validUrl = searchQuery.match(/^https?:\/\//i);
      
      if (validUrl) {
        console.log('URL detectada, verificando plataforma...');
        
        // Verificar si es una URL de alguna plataforma compatible
        const platform = await playdl.validate(url);
        console.log(`Plataforma detectada: ${platform}`);
        
        switch (platform) {
          case 'youtube':
          case 'yt_video':
            // URL de video YouTube, procesar directamente
            console.log('URL de YouTube (video) detectada, procesando...');
            break;
            
          case 'yt_playlist':
            console.log('Playlist de YouTube detectada, obteniendo todas las canciones...');

            try {
              const playlist = await playdl.playlist_info(url, { incomplete: true });

              if (playlist && playlist.videos && playlist.videos.length > 0) {
                console.log(`Playlist encontrada: ${playlist.title} con ${playlist.videos.length} canciones.`);

                for (const video of playlist.videos) {
                  const song = {
                    title: video.title,
                    url: video.url,
                    thumbnail: video.thumbnails[0]?.url || null,
                    duration: video.durationInSec,
                    requestedBy: interaction.user.tag
                  };

                  console.log(`Añadiendo canción a la cola: ${song.title}`);
                  await client.playUrl(interaction, song.url);
                }

                return interaction.followUp({ content: `🎵 Playlist **${playlist.title}** añadida a la cola con ${playlist.videos.length} canciones.` });
              } else {
                console.log('No se pudieron obtener videos de la playlist');
                return interaction.followUp('❌ No se pudo procesar la playlist de YouTube.');
              }
            } catch (playlistError) {
              console.error('Error al procesar playlist:', playlistError);
              return interaction.followUp('❌ Hubo un error al procesar la playlist de YouTube.');
            }
            break;
            
          case 'sp_track':
          case 'sp_playlist':
          case 'sp_album':
            return interaction.followUp('❌ Spotify no está soportado en este bot. Usa una URL de YouTube.');
            
          case 'soundcloud':
            console.log('URL de SoundCloud detectada, obteniendo información...');
            
            const soundcloudInfo = await playdl.soundcloud(url);
            if (soundcloudInfo) {
              // Buscar equivalente en YouTube para mejor compatibilidad
              const searchTerm = `${soundcloudInfo.name} ${soundcloudInfo.user.name}`;
              const searchResults = await playdl.search(searchTerm, { limit: 1 });
              
              if (searchResults.length > 0) {
                url = searchResults[0].url;
                console.log(`URL de YouTube equivalente: ${url}`);
                
                // Crear un embed para mostrar información
                const embed = new EmbedBuilder()
                  .setColor('#FF5500') // Color de SoundCloud
                  .setTitle(`SoundCloud: ${soundcloudInfo.name}`)
                  .setDescription(`🎵 Convertida a YouTube: **${searchResults[0].title}**\n👤 Artista: ${soundcloudInfo.user.name}`)
                  .setThumbnail(soundcloudInfo.thumbnail || null);
                  
                await interaction.followUp({ embeds: [embed] });
              } else {
                // Si no se encuentra equivalente, usar directamente SoundCloud
                // Nota: esto podría no funcionar bien dependiendo de tu implementación actual
                return interaction.followUp('❌ No se pudo encontrar esta canción de SoundCloud en YouTube. Intenta con otra URL o búsqueda.');
              }
            }
            break;
            
          case 'deezer':
          case 'apple_music':
            // Estas plataformas necesitarían una búsqueda en YouTube
            console.log(`URL de ${platform} detectada, buscando equivalente en YouTube...`);
            
            // Extraer título y artista de la URL (esto es muy básico, se puede mejorar)
            const parts = url.split('/').filter(part => part.length > 0);
            const lastPart = parts[parts.length - 1];
            const searchTermFromUrl = lastPart.replace(/-/g, ' ').replace(/[0-9]/g, '');
            
            const searchResults = await playdl.search(searchTermFromUrl, { limit: 1 });
            if (searchResults.length > 0) {
              url = searchResults[0].url;
              console.log(`URL de YouTube encontrada: ${url}`);
              
              await interaction.followUp(`🔄 Convertido de ${platform === 'apple_music' ? 'Apple Music' : 'Deezer'} a YouTube: **${searchResults[0].title}**`);
            } else {
              return interaction.followUp(`❌ No se pudo encontrar esta canción de ${platform === 'apple_music' ? 'Apple Music' : 'Deezer'} en YouTube.`);
            }
            break;
            
          default:
            if (validUrl) {
              // Es una URL pero no de una plataforma reconocida, intentar búsqueda
              console.log('URL no reconocida, tratándola como búsqueda de texto...');
              const searchResults = await playdl.search(searchQuery, { limit: 1 });
              if (searchResults.length === 0) {
                return interaction.followUp('❌ No se encontraron resultados para esta búsqueda.');
              }
              url = searchResults[0].url;
              console.log(`URL encontrada: ${url}`);
            }
            break;
        }
      } else {
        // No es una URL, realizar búsqueda en YouTube
        console.log('Realizando búsqueda en YouTube...');
        const searchResults = await playdl.search(searchQuery, { limit: 1 });
        if (searchResults.length === 0) {
          return interaction.followUp('❌ No se encontraron resultados para esta búsqueda.');
        }
        url = searchResults[0].url;
        console.log(`URL encontrada: ${url}`);
      }
      
      // Añadimos información detallada en la consola para fines de depuración
      console.log(`Intentando reproducir: ${url}`);
      const response = await client.playUrl(interaction, url);
      console.log(`Respuesta: ${response}`);
      
      if (!interaction.replied) {
        return interaction.followUp({ content: response });
      }
    } catch (error) {
      console.error('Error en comando play:', error);
      return interaction.followUp({ 
        content: 'Ocurrió un error al intentar reproducir la música. Error: ' + error.message, 
        flags: MessageFlags.Ephemeral 
      });
    }
  },
};