let Discord = require('discord.js')
const db = require('../Firebase/models')

module.exports = async (client, interaction, ticketOptions) => {
    var DiscordServer = await client.guilds.cache.get(interaction.guildId);
    let serverData = await db.findOne({ colecao: "servers", doc: interaction.guildId })
    let findMotivo = await serverData.ticketOptions.motivos.find(element => element.id == ticketOptions.motivo)
    let categoria = DiscordServer.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets')
    let generateProtocol = `prot-${Math.random().toString().slice(2, 6)}-${interaction.user.id}`
    if (!categoria) {
        categoria = await DiscordServer.channels.create({
            name: 'Tickets',
            type: Discord.ChannelType.GuildCategory,
            permissionOverwrites: [{
                id: DiscordServer.roles.everyone,
                deny: [Discord.PermissionsBitField.Flags.ViewChannel]
            }]
        });
    }
    const newChannel = await DiscordServer.channels.create({
        name: `🎫・Ticket・${interaction.user.username}`,
        type: 0,
        parent: categoria,
        topic: generateProtocol,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: [Discord.PermissionsBitField.Flags.ViewChannel]
        }, {
            id: findMotivo.responsavel,
            allow: [Discord.PermissionsBitField.Flags.ViewChannel]
        }, {
            id: DiscordServer.roles.everyone,
            deny: [Discord.PermissionsBitField.Flags.ViewChannel]
        }]
    })
    if (newChannel) {
        if (ticketOptions.type != 1) {
            await interaction.reply({
                content: `🎫 | Criando o Ticket...`,
                ephemeral: true
            })
        }


        await newChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor('#6E58C7')
                    .setTitle(`🎟 | Esse e seu ticket!`)
                    .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                    .setDescription(`<@${interaction.user.id}> Agora que seu ticket foi criado basta escrever abaixo o seu problema ou a sua duvida que iremos solucionar o mais rapido possivel!`)
                    .setFields({ name: `**Protocolo**`, value: "`" + generateProtocol + "`" },
                        { name: `**Motivo**`, value: "`" + findMotivo.name + "`", inline: true },
                        { name: `**Idioma**`, value: "`" + 'Português' + "`", inline: true }
                    )
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Primary)
                            .setLabel('Assumir Ticket')
                            .setEmoji(await require('./emojisGet').star)
                            .setCustomId(`assumirTicket-${generateProtocol.replace(/prot-\d+-/, '')}`)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Danger)
                            .setLabel('Fechar Ticket')
                            .setEmoji(await require('./emojisGet').cancelar)
                            .setCustomId(`closeTicket-${generateProtocol}`)
                    )

            ],
            ephemeral: true
        });

        if (ticketOptions.type != 1) {
            interaction.editReply({
                content: ` `,
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor('#6E58C7')
                        .setTitle(`🎟 | Ticket Criado!`)
                        .setDescription(`<@${interaction.user.id}> **Seu ticket foi criado com sucesso, agora você pode nos enviar o seu problema em um texto breve no canal do seu ticket, clicando no botão abaixo você sera redirecionado para ele.**`)
                        .setFields({ name: `**Protocolo**`, value: "`" + generateProtocol + "`" })
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setStyle(5)
                                .setLabel('Ir para o Ticket')
                                .setEmoji(await require('./emojisGet').redirect)
                                .setURL(`https://discord.com/channels/${interaction.guild.id}/${newChannel.id}`)
                        )
                ],
                ephemeral: true
            });
        }
        const user = await client.users.fetch(interaction.user.id);
        let userPic = await user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        db.create('tickets', generateProtocol, {
            protocolo: generateProtocol,
            user: interaction.user.id,
            userName: interaction.user.globalName,
            userPic: userPic,
            motivo: ticketOptions.motivo,
            // idioma:ticketOptions.idioma,
            idioma: 'pt',
            created: Date.now(),
            mensages: [],
            channel: newChannel.id,
            serverID: interaction.guildId
        })
    } else {
        return interaction.reply({ content: 'Não foi possivel criar o ticket tente novamente!', ephemeral: true })
    }
}