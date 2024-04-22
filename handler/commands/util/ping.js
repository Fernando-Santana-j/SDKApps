
module.exports = {
    name:'ping',
    description: '12',
    type: 1,
    options: [],
    run: async(client,interaction)=>{
        interaction.reply('Pong!');
    }
}