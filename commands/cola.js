const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cola')
    .setDescription('Muestra la lista de canciones en cola'),
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const musicConnection = client.musicConnections.get(guildId);
    
    if (!musicConnection || !musicConnection.player || !musicConnection.currentItem) {
      return interaction.reply({ 
        content: '❌ No hay música reproduciéndose actualmente.', 
        flags: MessageFlags.Ephemeral 
      });
    }
    
    const current = musicConnection.currentItem;
    const queue = musicConnection.queue;
    
    if (queue.length === 0) {
      return interaction.reply({
        content: `🎵 **Reproduciendo ahora:**\n${current.title}\n\n**Cola:** No hay más canciones en cola.`
      });
    }
    
    let queueString = queue.map((song, index) => `${index + 1}. ${song.title}`).join('\n');
    if (queueString.length > 1900) {
      queueString = queueString.substring(0, 1900) + '... (y más)';
    }
    
    return interaction.reply({
      content: `🎵 **Reproduciendo ahora:**\n${current.title}\n\n**Cola:**\n${queueString}`
    });
  },
};