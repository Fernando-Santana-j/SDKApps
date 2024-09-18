let db = require('../../../Firebase/models');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aprovar')
        .setDescription('Digite em um carrinho para aprova-lo!')
        .addStringOption(option=>
            option.setName('canal')
                .setDescription('Caso prefira, coloque o nome do carrinho para aprovar sem precisar ir ao canal!')
                .setAutocomplete(true)
                .setRequired(false)
        ),
    async execute(interaction,client) {
        if (interaction.user.id == interaction.member.guild.ownerId || interaction.user.id == '494976640573505536') {
            let canal = await interaction.options.getString('canal')
            var DiscordServer = await client.guilds.cache.get(interaction.guildId);
            var DiscordChannel = await DiscordServer.channels.cache.get(canal ? canal : interaction.channelId )
            let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }
            if (DiscordChannel && DiscordChannel.topic && DiscordChannel.name.includes('🛒・carrinho・')) {
                try {
                    let carrinhos = require("../../discordIndex").carrinhos
                    let carrinho = carrinhos[DiscordChannel.topic]
                    try {
                        await require("../../discordIndex").sendProductPayment({
                            serverID: interaction.guildId,
                            userID: DiscordChannel.topic,
                            carrinhos: JSON.stringify(carrinho),
                        }, null, 'aprovado')
                        interaction.reply({content:'Compra Aprovada!',ephemeral:true})
                    } catch (error) {
                        console.log(error);
                        interaction.reply({content:'Erro ao aprovar o carrinho!',ephemeral:true})
                    }
                } catch (error) {
                    console.log(error);
                }
            } else {
                interaction.reply({content:'Esse canal não e um carrinho',ephemeral:true})
            }
        } else {
            interaction.reply({content:'Você não tem permissão para usar esse comando',ephemeral:true})
        }
    },
    async autocomplete(interaction, client) {
        let findChannel = interaction.guild.channels.cache.filter(c => c.name.includes('🛒・carrinho・'))

        const focusedValue = interaction.options.getFocused();
		const filtered = findChannel.filter(choice => choice.name.toLowerCase().startsWith(focusedValue.toLowerCase()));
        if (filtered.length > 25) {
            filtered.slice(0, 25)
        }
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.id })),
		);
    }
};