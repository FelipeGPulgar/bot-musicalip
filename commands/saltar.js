const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saltar')
    .setDescription('Salta a la siguiente canción en la cola'),
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const musicConnection = client.musicConnections.get(guildId);
    
    if (!musicConnection || !musicConnection.player || !musicConnection.currentItem) {
      return interaction.reply({ 
        content: '❌ No hay música reproduciéndose actualmente.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    if (musicConnection.queue.length === 0) {
      return interaction.reply({ 
        content: '❌ No hay más canciones en la cola para saltar.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    const currentSong = musicConnection.currentItem.title;
    
    // Detener la canción actual, lo que activará el evento 'idle' que reproducirá la siguiente canción
    musicConnection.player.stop();
    
    return interaction.reply(`⏭️ Saltada: **${currentSong}**`);
  },
};