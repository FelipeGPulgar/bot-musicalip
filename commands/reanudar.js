const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reanudar')
    .setDescription('Reanuda la reproducción de música pausada'),
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const musicConnection = client.musicConnections.get(guildId);
    
    if (!musicConnection || !musicConnection.player) {
      return interaction.reply({ 
        content: '❌ No hay música para reanudar.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    // Añadiendo un log para depuración
    console.log(`Estado del reproductor (reanudar): ${musicConnection.player.state.status}`);
    
    if (musicConnection.player.state.status === AudioPlayerStatus.Paused) {
      musicConnection.player.unpause();
      musicConnection.playing = true;
      return interaction.reply('▶️ Música reanudada.');
    } else if (musicConnection.player.state.status === AudioPlayerStatus.Playing) {
      return interaction.reply({ 
        content: '❌ La música ya se está reproduciendo.', 
        flags: MessageFlags.Ephemeral 
      });
    } else if (musicConnection.player.state.status === AudioPlayerStatus.Idle) {
      return interaction.reply({ 
        content: '❌ No hay música pausada para reanudar. Usa /play para reproducir una canción.', 
        flags: MessageFlags.Ephemeral 
      });
    } else {
      return interaction.reply({ 
        content: '❌ No se puede reanudar en este momento. Estado: ' + musicConnection.player.state.status, 
        flags: MessageFlags.Ephemeral 
      });
    }
  },
};