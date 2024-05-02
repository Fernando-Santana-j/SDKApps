let functions = require('../../../functions')
const Discord = require("discord.js");

module.exports = {
    name: 'botconfig',
    description: 'Configurar o bot de vendas!',
    type: 1,
    options: [],
    run: async (client, interaction) => {
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id,interaction.guildId,null,client)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor("#6E58C7")
                        .setTitle(`Configure o bot atraves da nossa plataforma acessando o link abaixo!`)
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setStyle(5)
                                .setLabel('⚙️・Ir para a plataforma')
                                .setURL(`https://skapps.com.br/server/${interaction.guildId}`)
                        )
                ],
                ephemeral: true
            })
        }else{
            interaction.reply('Você não tem permissão para enviar comandos')
        }
    }
}
