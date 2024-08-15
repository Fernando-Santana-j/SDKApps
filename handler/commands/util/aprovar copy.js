
module.exports = {
    name: 'produto',
    description: 'Envia a mensagem do produto no canal que foi executado o comando!',
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
                    interaction.reply('Compra Aprovada!')
                    await require("../../../Discord/discordIndex").sendProductPayment({
                        serverID:interaction.guildId,
                        userID:DiscordChannel.topic,
                        carrinhos:JSON.stringify(carrinho),
                    }, null, 'aprovado')
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
