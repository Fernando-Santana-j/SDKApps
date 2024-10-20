const db = require('../Firebase/models')
require('dotenv').config()
module.exports = async (Discord, client, data) => {
    try {
        const DiscordServer = await client.guilds.cache.get(data.serverID);
        const DiscordChannel = await DiscordServer.channels.cache.get(data.channelID)
        let user = data.user.id
        var serverData = await db.findOne({ colecao: "servers", doc: await data.serverID })
        let paymentFields = []
        if (serverData.bankData && serverData.bankData.mercadoPagoToken && serverData.bankData.mercadoPagoToken != '') {
            paymentFields.unshift(
                await new Discord.StringSelectMenuOptionBuilder()
                    .setLabel('PIX')
                    .setDescription('Método mais comum de pagamento no Brasil!')
                    .setValue('PIX')
            )
        }
        if (serverData.bankData && serverData.bankData.bankID) {
            paymentFields.push(
                await new Discord.StringSelectMenuOptionBuilder()
                    .setLabel('Cartão')
                    .setDescription('Pagamento usado mundialmente!')
                    .setValue('card'),
                await new Discord.StringSelectMenuOptionBuilder()
                    .setLabel('Boleto')
                    .setDescription('Devido ao tempo de processamento, pode demorar até 3 dias para ser aprovado!')
                    .setValue('boleto')
            )
        }

        let fields = []
        let carrinhos = require('./discordIndex').carrinhos

        if (carrinhos[user]) {
            let total = 0
            let produtcs = 0
            await carrinhos[user].forEach(async (element, index) => {
                let produto = await serverData.products.find(product => product.productID == element.product)
                let valorReal = parseInt(produto.price) / 100;
                let valorFormatado = valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                total = total + (parseInt(produto.price) * element.quantidade)
                produtcs = produtcs + parseInt(element.quantidade)
                fields.push({ name: `${index + 1} - ${produto.productName} - ${element.quantidade}x`, value: valorFormatado },)
            });
            let valorTotalReal = total / 100;
            let valorTotalFormatado = valorTotalReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            produtcs = produtcs.toString()
            fields.unshift({ name: '\u200B', value: '\u200B' },)
            fields.unshift({ name: `Quantidade de produtos: `, value: "` " + produtcs + " `", inline: true })
            fields.unshift({ name: `Valor total: `, value: "` " + valorTotalFormatado + " `", inline: true })
        } else {
            DiscordChannel.delete()
            return
        }
        let contentEmbend = {
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Siga as etapas abaixo com os botões para concluir sua compra.')
                    .setDescription(`Abaixo temos o total de itens, o preço total do carrinho e cada produto que você adicionou no carrinho com a quantidade e seu preço base!`)
                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                    .addFields(...[...fields, { name: '\u200B', value: '\u200B' },])
                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                    .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: [

                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId(`cartEditQuantidade`)
                            .setLabel('Editar quantidade')
                            .setEmoji(await require('./emojisGet').editar)
                            .setStyle(Discord.ButtonStyle.Primary)
                    )
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId(`remove`)
                            .setEmoji(await require('./emojisGet').apagar)
                            .setLabel('Remover produto')
                            .setStyle('4')
                    ),

                // .addComponents(
                //     new Discord.ButtonBuilder()
                //         .setCustomId(`cupombutton`)
                //         .setLabel('Adicionar Cupom')
                //         .setStyle('1')
                // );

                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId(`paymentSelect`)
                            .setLabel('Ir para o pagamento')
                            .setEmoji(await require('./emojisGet').comprar)
                            .setStyle('3'),
                    )
                    .addComponents(

                        new Discord.ButtonBuilder()
                            .setCustomId('cancelCart')
                            .setLabel('Cancelar')
                            .setEmoji(await require('./emojisGet').cancelar)
                            .setStyle('4')
                    ),

            ],
            files: []
        }

        if (data.edit == true) {
            const botMessages = await DiscordChannel.messages.cache.filter(msg => msg.author.id === client.user.id);

            const lastBotMessage = await botMessages.first();
            lastBotMessage.edit(contentEmbend)
        } else {
            await DiscordChannel.send(contentEmbend);
        }
    } catch (error) {
        console.log("MainCartERROR: ", error);
    }

};


