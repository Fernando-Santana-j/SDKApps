let functions = require('../../../functions')
const Discord = require("discord.js");
module.exports = {
    name: 'ticket',
    description: 'Envia a mensagem do ticket no canal que foi executado o comando!',
    type: 1,
    options: [],
    run: async (client, interaction) => {
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id,interaction.guildId,null,client)
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
