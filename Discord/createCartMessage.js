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
        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.StringSelectMenuBuilder()
                .setCustomId('payment')
                .setPlaceholder('Selecione o método de pagamento desejado!')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(...paymentFields)
        )
        const row2 = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`confirm`)
                    .setLabel('Confirmar')
                    .setStyle('3'),
            )
            .addComponents(

                new Discord.ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('Cancelar')
                    .setStyle('4')
            ).addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`remove`)
                    .setLabel('Remover produto')
                    .setStyle('4')
            )
            // .addComponents(
            //     new Discord.ButtonBuilder()
            //         .setCustomId(`cupombutton`)
            //         .setLabel('Adicionar Cupom')
            //         .setStyle('1')
            // );

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
            fields.unshift({ name: `Quantidade de produtos: `, value: "` " + produtcs + " `", inline:true })
            fields.unshift({ name: `Valor total: `, value: "` " + valorTotalFormatado + " `", inline:true })
        } else {
            DiscordChannel.delete()
            return
        }
        let contentEmbend = {
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Selecione abaixo o metodo de pagamento depois confirme para gerar o seu link de pagamento!')
                    .setDescription(`Clique em cancelar caso desista de fazer a compra.

                        Abaixo são os itens do seu carrinho.`)
                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`})
                    .addFields(...[...fields, { name: '\u200B', value: '\u200B' },])
                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                    .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: [row, row2],
            files: []
        }

        if (data.edit == true) {
            const botMessages = await DiscordChannel.messages.cache.filter(msg => msg.author.id === client.user.id);

            // Pegue a última mensagem enviada pelo bot
            const lastBotMessage = await botMessages.first();
            lastBotMessage.edit(contentEmbend)
        } else {
            await DiscordChannel.send(contentEmbend);
        }
        
        setTimeout(async()=>{
            try {
                await DiscordServer.channels.cache.get(data.channelID).delete()
                const userD = await client.users.fetch(user)
                userD.send(`O seu ultimo carrinho no servidor ${DiscordServer.name} foi expirado!`)
            } catch (error) {}
        },1000000)
    } catch (error) {
        console.log("MainCartERROR: ",error);
    }


    //remove product



};


