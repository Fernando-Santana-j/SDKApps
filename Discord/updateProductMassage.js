const db = require('../Firebase/models')
module.exports = async (Discord, client, data) => {
    const DiscordServer = await client.guilds.cache.get(data.serverID);
    const DiscordChannel = await DiscordServer.channels.cache.get(data.channelID);
    var serverDB = await db.findOne({ colecao: 'servers', doc: await data.serverID })
    var productID = await data.productID
    var produto = await serverDB.products.find(product => product.productID == productID)
    let mensageDiscord = await DiscordChannel.messages.fetch(produto.mensageID)
}