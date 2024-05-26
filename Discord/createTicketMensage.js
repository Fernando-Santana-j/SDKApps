let Discord = require('discord.js')



module.exports = async (client, channelID, serverID) => {
    const DiscordServer = await client.guilds.cache.get(serverID);
    const DiscordChannel = await DiscordServer.channels.cache.get(channelID)

    await DiscordChannel.send({
        embeds: [
            new Discord.EmbedBuilder()
                .setTitle('Está enfrentando algum problema com a SDK?')
                .setDescription(`Abaixo você pode criar um ticket para que seu problema seja solucionado basta selecionar seu idioma e oque esta acontecendo e criar seu ticket!`)
                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                .setColor('#6E58C7')
                .setTimestamp()
                .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
        ],
        components: [
            new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('idiomaTicket')
                    .setPlaceholder('Selecione o seu idioma!')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Português ')
                            .setDescription('Idioma original')
                            .setValue('pt'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Inglês')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('en'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Espanhol')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('es'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Francês ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('fr'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Alemão ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('de'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Italiano ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('it'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Chinês ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('zh-CN'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Japonês ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('ja'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Coreano ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('ko'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Árabe ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('ar'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Russo ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('ru'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Turco ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('tr'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Holandês ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('nl'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Sueco ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('sv'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Polonês ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('pl'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Vietnamita ')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('vi'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Tailandês')
                            .setDescription('Esse idioma e traduzido do português e pode apresentar erros de digitação')
                            .setValue('th'),
                    )
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('motivoTicket')
                    .setPlaceholder('Selecione o motivo!')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Plataforma')
                            .setDescription('Problemas no funcionamento ou funcionalidades do site SDK!')
                            .setValue('plat'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('BOT')
                            .setDescription('Problemas com o funcionamento do BOT SDK!')
                            .setValue('bot'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Duvidas')
                            .setDescription('Duvidas sobre a plataforma ou bot SDK!')
                            .setValue('duv'),
                        await new Discord.StringSelectMenuOptionBuilder()
                            .setLabel('Suporte')
                            .setDescription('Suporte Geral para qualquer outro problema com a SDK!')
                            .setValue('sup'),
                    )
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`createTicket`)
                    .setLabel('🎫 Criar Ticket')
                    .setStyle('3'),
            )
        ],
    })
}