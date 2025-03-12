module.exports = async (serverID, tentativas, dias,client) => {
    try {
        var DiscordServer = await client.guilds.cache.get(serverID);
        let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
        dono.send(`Faltam ${tentativas ? tentativas + " tentativas" : dias + " dias"} para expirar sua assinatura`)
    } catch (error) {
        console.log(error);
    }
}