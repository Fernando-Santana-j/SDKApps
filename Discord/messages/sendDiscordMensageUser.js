module.exports = async (user, title, mensage, buttonRef, buttonLabel,Discord,client) => {
    try {
        const userFetch = await client.users.fetch(user);
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
        await userFetch .send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(title)
                    .setDescription(mensage)
                    .setColor('#6E58C7')
            ],
            ...comp
        }).catch((err) => {
            console.log(err);
        })
    } catch (error) {
        console.log('sendDiscordMensageUserERROR: ', error);
    }
}