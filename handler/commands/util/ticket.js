
module.exports = {
    name:'ticket',
    description: '12',
    type: 1,
    options: [],
    run: async(client,interaction)=>{
        require('../../../Discord/createTicketMensage')(client,interaction.channelId,interaction.guildId)
    }
}
