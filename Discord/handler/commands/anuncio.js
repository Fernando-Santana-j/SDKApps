let functions = require('../../../functions.js')

let db = require('../../../Firebase/models');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anuncio')
        .setDescription('Envia a mensagem personalizada em qualquer canal!')
        .addStringOption(option => 
            option.setName('titulo')
                .setDescription("De um titulo para o anuncio!")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('mensagem')
                .setDescription("Escreva a mensagem do anuncio!")
                .setRequired(true)
        )
        .addAttachmentOption(option => 
            option.setName('thumbnail')
                .setDescription("(Opcional) adicione uma imagem ao lado da mensagem, apenas imagem!")
                .setRequired(true)
        ).addAttachmentOption(option => 
            option.setName('banner')
                .setDescription("(Opcional) Adicione um banner ao seu anuncio, apenas imagem!")
                .setRequired(true)
        ),
    async execute(interaction, client) {
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
            await require('../../discordIndex').sendDiscordMensageChannel(interaction.guildId, interaction.channelId, titulo, mensagem, null, false, thumbnail ? thumbnail.url : '', banner ? banner.url : '', false)
            interaction.reply({ content: 'Anuncio enviado!', ephemeral: true })
        } else {
            interaction.reply({ content: 'Você não tem permissão para enviar comandos', ephemeral: true })
        }

    },
};