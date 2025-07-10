let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Apaga as ultimas mensagens enviadas!')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription("Numero de mensagem a serem apagadas!")
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction, client) {
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, null, client)
        let amount = await interaction.options.getInteger(`quantidade`)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }

            let remaining = amount; // Mensagens restantes para apagar
            let deletedTotal = 0;  // Contador de mensagens apagadas
            interaction.deferReply();
            try {
                while (remaining > 0) {
                    const deleteCount = Math.min(remaining, 100); // Até 100 mensagens por vez
                    const deleted = await interaction.channel.bulkDelete(deleteCount, true);
                    deletedTotal += deleted.size;
                    remaining -= deleted.size;

                    if (deleted.size < deleteCount) break; // Nenhuma mensagem restante
                }

                await interaction.editReply(
                    `Foram apagadas ${deletedTotal} mensagem(ns) no total!`
                );
            } catch (error) {
                console.error(error);
                await interaction.editReply('Ocorreu um erro ao tentar apagar mensagens.');
            }
        } else {
            interaction.reply('Você não tem permissão para enviar comandos')
        }
    }
};


