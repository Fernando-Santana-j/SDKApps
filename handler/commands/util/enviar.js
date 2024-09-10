let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');

module.exports = {
    name: 'enviar',
    description: 'Envie um produto para um usuario!',
    type: 1,
    options: [
        {
            name:'quantidade',
            description:"Quantidade de produtos que sera enviada!",
            type:Discord.ApplicationCommandOptionType.Number,
        }
    ],
    run: async (client, interaction) => {
        let quantidade = 1
        if (interaction.options.get('quantidade')) {
            quantidade = interaction.options.get('quantidade').value
        }
        
        let verifyPermissions = await functions.verifyPermissions(interaction.user.id,interaction.guildId,Discord,client)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            let serverData = await db.findOne({colecao:`servers`,doc:await interaction.guildId})
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }
            let server = await db.findOne({colecao:"servers",doc:interaction.guildId})
            if (server) {
                let products = server.products
                let productsField = []
                for (let index = 0; index < products.length; index++) {
                    const element = products[index];
                    productsField.push(new Discord.StringSelectMenuOptionBuilder()
                    .setLabel(element.productName)
                    .setDescription(await functions.formatarMoeda(parseInt(element.price)))
                    .setValue(element.productID))
                }
                let mensage = interaction.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor("#6E58C7")
                            .setTitle(`Adicione os dados abaixo para continuar!`)
                    ],
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.UserSelectMenuBuilder()
                                .setCustomId('userSendSelect')
                                .setPlaceholder('Selecione o usuario que deseja enviar!')
                                .setMinValues(1)
                                .setMaxValues(1)
                        ),
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.StringSelectMenuBuilder()
                                .setCustomId('productSendSelect')
                                .setPlaceholder('Selecione o usuario que deseja enviar!')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addOptions(...productsField)
                        ),
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setStyle(3)
                                    .setLabel('🛍️・Enviar Produto')
                                    .setCustomId(`productSendConfirm-${quantidade}`)
                            )
                    ],
                    ephemeral: true
                })

            }
            
        }else{
            interaction.reply('Você não tem permissão para enviar comandos')
        }
    }
}
