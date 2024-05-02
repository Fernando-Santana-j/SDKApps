
module.exports = {
    name: 'aprovar',
    description: 'Aprovar Carrinho',
    type: 1,
    options: [],
    run: async (client, interaction) => {
        if (interaction.user.id == interaction.member.guild.ownerId || interaction.user.id == '494976640573505536') {
            var DiscordServer = await client.guilds.cache.get(interaction.guildId);
            var DiscordChannel = await DiscordServer.channels.cache.get(interaction.channelId)
            if (DiscordChannel.topic) {
                try {
                    let carrinhos = require("../../../Discord/discordIndex").carrinhos
                    let carrinho = carrinhos[DiscordChannel.topic]
                    await require("../../../Discord/discordIndex").sendProductPayment({
                        serverID:interaction.guildId,
                        userID:DiscordChannel.topic,
                        carrinhos:JSON.stringify(carrinho),
                    }, null, 'aprovado')
                    interaction.reply('Compra Aprovada!')
                } catch (error) {
                    console.log(error);
                }
            }else{
                interaction.reply('Esse canal não e um carrinho')
            }
        }else{
            interaction.reply('Você não tem permissão para usar esse comando')
        }
    }
}
