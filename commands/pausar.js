const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pausar')
    .setDescription('Pausa la reproducción de música actual'),
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const musicConnection = client.musicConnections.get(guildId);
    
    if (!musicConnection || !musicConnection.player) {
      return interaction.reply({ 
        content: '❌ No hay música reproduciéndose actualmente.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    // Añadiendo un log para depuración
    console.log(`Estado del reproductor: ${musicConnection.player.state.status}`);
    
    if (musicConnection.player.state.status === AudioPlayerStatus.Playing) {
      musicConnection.player.pause();
      musicConnection.playing = false;
      return interaction.reply('⏸️ Música pausada.');
    } else if (musicConnection.player.state.status === AudioPlayerStatus.Paused) {
      return interaction.reply({ 
        content: '❌ La música ya está pausada.', 
        flags: MessageFlags.Ephemeral 
      });
    } else if (musicConnection.player.state.status === AudioPlayerStatus.Idle) {
      return interaction.reply({ 
        content: '❌ No hay música reproduciéndose actualmente. Usa /play para reproducir una canción.', 
        flags: MessageFlags.Ephemeral 
      });
    } else {
      return interaction.reply({ 
        content: '❌ No se puede pausar en este momento. Estado: ' + musicConnection.player.state.status, 
        flags: MessageFlags.Ephemeral 
      });
    }
  },
};