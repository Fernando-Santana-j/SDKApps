let functions = require('../../../functions')
const Discord = require("discord.js");

let db = require('../../../Firebase/models');
module.exports = {
    name: 'anuncio',
    description: 'Envia a mensagem personalizada em qualquer canal!',
    type: 1,
    options: [
        {
            name: 'titulo',
            description: "De um titulo para o anuncio!",
            type: Discord.ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'mensagem',
            description: "Escreva a mensagem do anuncio!",
            type: Discord.ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'thumbnail',
            description: "(Opcional) adicione uma imagem ao lado da mensagem, apenas imagem!",
            type: Discord.ApplicationCommandOptionType.Attachment,
            required: false
        },
        {
            name: 'banner',
            description: "(Opcional) Adicione um banner ao seu anuncio, apenas imagem!",
            type: Discord.ApplicationCommandOptionType.Attachment,
            required: false
        },

    ],
    run: async (client, interaction) => {

        let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, null, client)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }
            const titulo = interaction.options.getString('titulo');
            const mensagem = interaction.options.getString('mensagem');
            const thumbnail = interaction.options.getAttachment('thumbnail');
            const banner = interaction.options.getAttachment('banner');
            await require('../../../Discord/discordIndex').sendDiscordMensageChannel(interaction.guildId, interaction.channelId, titulo, mensagem, null, false, thumbnail ? thumbnail.url : '', banner ? banner.url : '', false)
            interaction.reply({ content: 'Anuncio enviado!', ephemeral: true })
        } else {
            interaction.reply({ content: 'Você não tem permissão para enviar comandos', ephemeral: true })
        }

    }
}
