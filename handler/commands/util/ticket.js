let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');

module.exports = {
    name: 'ticket',
    description: 'Envia a mensagem do ticket no canal que foi executado o comando!',
    type: 1,
    options: [],
    run: async (client, interaction) => {
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id,interaction.guildId,null,client)
        let server = await db.findOne({colecao:'servers',doc:interaction.guildId})
        let serverData = await db.findOne({colecao:`servers`,doc:await interaction.guildId})
        if (serverData.botActive == false) {
            await interaction.reply({
                content: `⚠️| O vendedor desativou o bot desse servidor!`,
                ephemeral: true
            })
            return
        }
        if (server.plan == 'inicial') {
            interaction.reply('Seu plano não dá acesso a essa funcionalidade')
            return 
        }
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            interaction.deferReply();
            await require('../../../Discord/createTicketMensage')(client,interaction.channelId,interaction.guildId)
            try {
                interaction.deleteReply().catch(()=>{})
            } catch (error) {}
        }else{
            interaction.reply('Você não tem permissão para enviar comandos')
        }
    }
}
