const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('detener')
    .setDescription('Detiene la reproducción y desconecta el bot del canal de voz'),
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const musicConnection = client.musicConnections.get(guildId);
    
    if (!musicConnection || !musicConnection.connection) {
      return interaction.reply({ 
        content: '❌ No estoy conectado a un canal de voz.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    // Detener el reproductor
    if (musicConnection.player) {
      musicConnection.player.stop();
    }
    
    // Limpiar la cola
    musicConnection.queue = [];
    musicConnection.currentItem = null;
    
    // Desconectar del canal de voz
    musicConnection.connection.destroy();
    
    // Eliminar la conexión del mapa
    client.musicConnections.delete(guildId);
    
    return interaction.reply('🛑 Música detenida y desconectado del canal de voz.');
  },
};