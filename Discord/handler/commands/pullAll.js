// let functions = require('../../../functions')
// const Discord = require("discord.js");
// let db = require('../../../Firebase/models');
// const { SlashCommandBuilder } = require('discord.js');

// const botConfig = require('../../../config/bot-config.js');
// const webConfig = require('../../../config/web-config.js');


// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('puxarAll')
//         .setDescription('Puxa os usuarios verificados do AUTH!'),
//     async execute(interaction,client) {
//         // let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, null, client)
//         // if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
//             let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
            
            
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
//                                 .setLabel('Verificar')
//                                 .setURL(`https://discord.com/oauth2/authorize?client_id=1272947467469459456&response_type=code&redirect_uri=https%3A%2F%2Fgame-violently-kitten.ngrok-free.app%2Fdiscord%2Fverify&scope=identify+guilds.join`)
//                         )
//                 ],
//                 ephemeral: true
//             })
//         // } else {
//         //     interaction.reply('Você não tem permissão para enviar comandos')
//         // }
//     }
// };


