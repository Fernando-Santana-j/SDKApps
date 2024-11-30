// let functions = require('../../../functions')
// const Discord = require("discord.js");
// let db = require('../../../Firebase/models');
// const { SlashCommandBuilder } = require('discord.js');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('blockChannel')
//         .setDescription('Configurar o bot de vendas!'),
//     async execute(interaction,client) {
//         let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, null, client)
//         if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
//             let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
//             if (serverData.botActive == false) {
//                 await interaction.reply({
//                     content: `⚠️| O vendedor desativou o bot desse servidor!`,
//                     ephemeral: true
//                 })
//                 return
//             }
            
//             interaction.reply({
//                 embeds: [
//                     new Discord.EmbedBuilder()
//                         .setColor("#6E58C7")
//                         .setTitle(`Configure o bot atraves da nossa plataforma acessando o link abaixo!`)
//                 ],
//                 components: [
//                     new Discord.ActionRowBuilder()
//                         .addComponents(
//                             new Discord.ButtonBuilder()
//                                 .setStyle(5)
//                                 .setLabel('Ir para a plataforma')
//                                 .setEmoji(await require('../../emojisGet').redirect)
//                                 .setURL(`https://skapps.com.br/server/${interaction.guildId}`)
//                         )
//                 ],
//                 ephemeral: true
//             })
//         } else {
//             interaction.reply('Você não tem permissão para enviar comandos')
//         }
//     }
// };


