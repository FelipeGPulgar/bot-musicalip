const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Muestra información sobre los comandos disponibles'),
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎵 Comandos de Bot Musicalip')
      .setDescription('Aquí tienes la lista de comandos disponibles:')
      .addFields(
        { name: '/play [búsqueda]', value: 'Reproduce música de YouTube. Puedes usar una URL o texto de búsqueda' },
        { name: '/pausar', value: 'Pausa la reproducción de música actual' },
        { name: '/reanudar', value: 'Reanuda la música pausada' },
        { name: '/saltar', value: 'Salta a la siguiente canción en la cola' },
        { name: '/detener', value: 'Detiene la reproducción y desconecta el bot del canal de voz' },
        { name: '/cola', value: 'Muestra la lista de canciones en cola' },
        { name: '/ayuda', value: 'Muestra este mensaje de ayuda' }
      )
      .setFooter({ text: 'Bot Musicalip - ¡Disfruta la música!' });
    
    return interaction.reply({ embeds: [embed] });
  },
};