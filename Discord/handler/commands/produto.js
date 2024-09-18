let db = require('../../../Firebase/models');
let functions = require('../../../functions')
const { SlashCommandBuilder } = require('discord.js');
const Discord = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('produto')
        .setDescription('Envia a mensagem do produto no canal que foi executado o comando!')
        .addStringOption(option=>
            option.setName('produto')
                .setDescription('Selecione o produto que deseja enviar a mensagem!')
                .setAutocomplete(true)
                .setRequired(true)
        ),
    async execute(interaction,client) {
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, null, client)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            let produto = await interaction.options.getString('produto')
            let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
            var product = await serverData.products.find(product => product.productID == produto)
            if (!product) {
                return interaction.reply({content:'Esse não e um produto valido!', ephemeral:true})
            }
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }
            
            try {
                interaction.deferReply();
                if (product.embendType == 0) {
                    await require('../../createProductMessageEmbend.js')(Discord, client, {
                        channelID: interaction.channelId,
                        serverID: interaction.guildId,
                        productID: produto,
                        edit: true
                    })
                } else {
                    await require('../../createProductMessage.js')(Discord, client, {
                        channelID: interaction.channelId,
                        serverID: interaction.guildId,
                        productID: produto,
                        edit: true
                    })
                }
                interaction.deleteReply()
            } catch (error) {
                console.log(error);
                interaction.reply({content:'Erro ao enviar a mensagem do produto!',ephemeral:true})
            }
            
        } else {
            interaction.reply({content:'Você não tem permissão para usar esse comando',ephemeral:true})
        }
    },
    async autocomplete(interaction, client) {
        let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
        let products = serverData.products
        const focusedValue = interaction.options.getFocused();
		const filtered = products.filter(choice => choice.productName.toLowerCase().startsWith(focusedValue.toLowerCase()));
        if (filtered.length > 25) {
            filtered.slice(0, 25)
        }
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.productName}  •  ${functions.formatarMoeda(choice.price)}  •  Estoque: ${choice.estoque.length}`, value: choice.productID })),
		);
    }
};