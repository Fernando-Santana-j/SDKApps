module.exports = async (server, channel, title, mensage, user, deleteChannel = false, tumbnail = '', banner = '', serverName = true, buttonRef, buttonLabel,Discord,client,db) => {
    try {
        let serverData = await db.findOne({ colecao: 'servers', doc: server })
        var DiscordServer = await client.guilds.cache.get(server);
        var DiscordChannel
        if (user) {
            DiscordChannel = DiscordServer.channels.cache.find(c => c.topic === user)
        } else {
            DiscordChannel = await DiscordServer.channels.cache.get(channel)
        }
        let comp = null
        if (buttonRef) {
            comp = {
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel(buttonLabel)
                            .setURL(buttonRef)
                            .setStyle(Discord.ButtonStyle.Link),
                    )
                ]
            }
        }
        let embend = new Discord.EmbedBuilder()
            .setTitle(serverName == true ? `${DiscordServer.name} | ${title}` : title)
            .setDescription(mensage)
            .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
        if (tumbnail) {
            embend.setThumbnail(tumbnail)
        }
        if (banner) {
            embend.setImage(banner)
        }
        await DiscordChannel.send({
            embeds: [embend],
            ...comp
        }).catch(() => { })

        if (deleteChannel == true) {
            setTimeout(() => {
                DiscordChannel.delete()
            }, 5000)
        }
    } catch (error) {
        console.log('sendDiscordMensageChannelERROR: ', error);
    }
}