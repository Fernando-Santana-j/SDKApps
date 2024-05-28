const db = require('../Firebase/models')
const dataBase = require('../Firebase/db.js')
const stripe = require('stripe')(require('../config/web-config').stripe);
require('dotenv').config()
const { Payment, MercadoPagoConfig } = require('mercadopago');
const Discord = require("discord.js");
const mercadoPagoData = require('../config/mercadoPagoData.json');
const botConfig = require('../config/bot-config.js');
const functions = require('../functions.js');
const client = new Discord.Client({ intents: botConfig.intents })
var ncp = require("copy-paste");
const { doc } = require('firebase/firestore');

client.login(botConfig.discordToken)



var paymentMetod = {}
var excludItemSec = {}
var carrinhos = {}
var sendProduct = {}
var preCarrinhos = {}
let ticketOptions = {}
let cupomOptions = {}

module.exports = (Discord, client) => {

    try {
        async function calcTaxa(price) {
            let valor = await parseInt(price)
            const paymentFee = Math.ceil(valor * 0.04 + 0.40);
            const netAmount = valor - paymentFee;
            return netAmount;
        }
        async function deleteExpiredCart(guild, interection, deleteChannel) {
            try {
                var DiscordServer = await client.guilds.cache.get(guild);
                var DeleteDiscordChannel = await DiscordServer.channels.cache.get(deleteChannel)
                await DeleteDiscordChannel.delete()
                if (interection && interection.replied) {
                    interection.editReply({ content: 'O seu carrinho expirou vamos apaga-lo! Status: Carrinho apagado!', ephemeral: true })
                }
            } catch (error) {
                console.log(error);
            }
        }

        //ticket
        client.on('messageCreate', async message => {

            try {
                var DiscordServer = await client.guilds.cache.get(message.guildId);
                var DiscordChannel = await DiscordServer.channels.cache.get(message.channelId)
                if (DiscordChannel && DiscordChannel.topic && DiscordChannel.topic.includes('prot-')) {
                    let ticket = await db.findOne({ colecao: 'tickets', doc: DiscordChannel.topic })
                    if (ticket && message.channel.id == ticket.channel) {
                        if (message.content && message.content != '') {
                            const user = await client.users.fetch(message.author.id);
                            let userPic = await user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
                            let ticketMensages = ticket.mensages
                            await ticketMensages.push({ content: message.content, userPic: userPic, typeUser: null, author: message.author.username, userID: message.author.id, timestamp: message.createdTimestamp })
                            db.update('tickets', DiscordChannel.topic, {
                                mensages: ticketMensages
                            })
                        } else {
                            let mensagem = message.embeds[0].data
                            let fields = mensagem.fields
                            const user = await client.users.fetch(fields[3].value);
                            let userPic = await user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
                            let ticketMensages = ticket.mensages
                            await ticketMensages.push({ content: mensagem.description, userPic: userPic, typeUser: fields[1].value, author: fields[2].value, userID: fields[3].value, timestamp: message.createdTimestamp })
                            db.update('tickets', DiscordChannel.topic, {
                                mensages: ticketMensages
                            })
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            try {

                var DiscordServer = await client.guilds.cache.get(interaction.guildId);
                var DiscordChannel = await DiscordServer.channels.cache.get(interaction.channelId)
                let verifyPerms = await functions.verifyPermissions(interaction.user.id, interaction.guildId, Discord, client)
                if (verifyPerms.error == true) {
                    return
                }
                if (verifyPerms.perms.owner == false && verifyPerms.perms.command == false) {
                    interaction.reply({ content: 'Você não tem permissão para executar comandos', ephemeral: true })
                    return
                }


                async function createRemoveEmbend() {
                    try {
                        var fields = []
                        for (let index = 0; index < carrinhos[interaction.user.id].length; index++) {
                            const element = carrinhos[interaction.user.id][index].product;
                            let serverData = await db.findOne({ colecao: "servers", doc: await interaction.guildId })
                            let produto = await serverData.products.find(product => product.productID == element)
                            const valorReal = produto.price / 100;
                            let valorFormatado = valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            await fields.push(await new Discord.StringSelectMenuOptionBuilder().setLabel(produto.productName).setDescription(valorFormatado).setValue(element))
                        }
                        const botMessages = await DiscordChannel.messages.cache.filter(msg => msg.author.id === client.user.id);
                        const lastBotMessage = await botMessages.first();
                        const row = new Discord.ActionRowBuilder().addComponents(
                            new Discord.StringSelectMenuBuilder()
                                .setCustomId('excludItem')
                                .setPlaceholder('Selecione o Item que deseja excluir!')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addOptions(...fields)
                        )
                        const row2 = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId(`exclud`)
                                    .setLabel('Excluir')
                                    .setStyle('4'),
                            )
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('back')
                                    .setLabel('Voltar')
                                    .setStyle('3')
                            )
                        await lastBotMessage.edit({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle('Selecione abaixo o item que deseja excluir!')
                                    .setDescription(`Clique em cancelar caso desista de excluir um item!`)
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                                    .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                    .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                            components: [row, row2]
                        }).then((res) => {

                        }).catch((err) => {
                            console.log(err);
                        })
                    } catch (error) {
                        console.log(error);
                    }
                }

                if (interaction.customId && interaction.customId.includes('qntProduct')) {
                    if (!preCarrinhos[interaction.user.id]) {
                        preCarrinhos[interaction.user.id] = []
                    }
                    let value = await interaction.values[0]
                    let product = await interaction.customId.replace('qntProduct_', "")
                    let findCart = await preCarrinhos[interaction.user.id].find(element => element.product == product)
                    let findIndexCart = await preCarrinhos[interaction.user.id].findIndex(element => element.product == product)
                    preCarrinhos[interaction.user.id]
                    if (findCart) {
                        preCarrinhos[interaction.user.id][findIndexCart].quantidade = parseInt(value)
                        console.log(preCarrinhos[interaction.user.id][findIndexCart]);
                    }else{
                        preCarrinhos[interaction.user.id].push({
                            product: product,
                            quantidade: value
                        })
                    }
                    
                    interaction.deferReply();
                    interaction.deleteReply()
                }



                // interacao do botao de compra de um produto
                if (interaction.customId && interaction.customId.includes('comprar')) {
                    let server = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    let product = await server.products.find(product => product.productID == interaction.customId.replace('comprar_', ''))
                    let findChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && c.name && c.name.includes('🛒・carrinho・'))
                    if (!product || server.error == true || product.estoque.length <= 0) {
                        await interaction.reply({ content: `⚠️| O produto selecionado está sem estoque!`, ephemeral: true })
                        let analytics = await db.findOne({ colecao: "analytics", doc: server.id })

                        if (analytics.error == false) {
                            let canceladosEstoque = analytics['cancelados estoque']
                            await canceladosEstoque.push(await functions.formatDate(new Date()))
                            db.update('analytics', server.id, {
                                "cancelados estoque": canceladosEstoque
                            })
                        } else {
                            db.create('analytics', server.id, {
                                "cancelados estoque": [await functions.formatDate(new Date())],
                                "pagamentos": {
                                    "PIX": 0,
                                    "card": 0,
                                    "boleto": 0,
                                },
                                "reebolsos": [],
                                "vendas canceladas": [],
                                "vendas completas": []
                            })
                        }

                        return
                    }
                    async function findUniCarrinhos() {
                        let prodid = await interaction.customId.replace('comprar_', '')
                        let findItem
                        if (preCarrinhos[interaction.user.id]) {
                            findItem = await preCarrinhos[interaction.user.id].find(element => element.product == prodid)
                        } else {
                            findItem = null
                        }
                        if (!carrinhos[interaction.user.id]) {
                            carrinhos[interaction.user.id] = []
                        }
                        if (findItem) {
                            carrinhos[interaction.user.id].push(findItem)
                        } else {
                            carrinhos[interaction.user.id].push({
                                product: prodid,
                                quantidade: 1
                            })
                        }
                    }
                    if (findChannel) {
                        if (!carrinhos[interaction.user.id]) {
                            interaction.reply({ content: 'O seu carrinho expirou vamos apaga-lo! Apos isso você poderá adicionar produtos ao seu novo carrinho! ', ephemeral: true })
                            await deleteExpiredCart(interaction.guildId, interaction, findChannel.id)
                            return
                        }
                        let prodid = await interaction.customId.replace('comprar_', '')
                        let findProductCart = await carrinhos[interaction.user.id].find((item) => item.product == prodid)
                        let findProductCartIndex = await carrinhos[interaction.user.id].findIndex((item) => item.product == prodid)
                        if (findProductCart) {
                            carrinhos[interaction.user.id][findProductCartIndex].quantidade = parseInt(carrinhos[interaction.user.id][findProductCartIndex].quantidade) + 1
                        } else {
                            findUniCarrinhos()
                        }

                        interaction.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor("#C21010")
                                    .setTitle(`⚠️| Você já possui um carrinho aberto!`)
                                    .setDescription(`Adicionamos esse produto ao seu carrinho!`)
                            ],
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(5)
                                            .setLabel('🛒・Ir para o Carrinho')
                                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${findChannel.id}`)
                                    )
                            ],
                            ephemeral: true
                        })

                        require('./createCartMessage')(Discord, client, {
                            serverID: interaction.guild.id,
                            user: interaction.user,
                            member: interaction.member,
                            channelID: await findChannel.id,
                            edit: true
                        })

                    } else {
                        let categoria = DiscordServer.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'carrinhos')
                        if (!categoria) {
                            categoria = await DiscordServer.channels.create({
                                name: 'carrinhos',
                                type: Discord.ChannelType.GuildCategory,
                                permissionOverwrites: [{
                                    id: DiscordServer.roles.everyone,
                                    deny: [Discord.PermissionsBitField.Flags.ViewChannel]
                                }]
                            });
                        }
                        const newChannel = await DiscordServer.channels.create({
                            name: `🛒・Carrinho・${interaction.user.username}`,
                            type: 0,
                            parent: categoria,
                            topic: interaction.user.id,
                            permissionOverwrites: [{
                                id: interaction.user.id,
                                allow: [Discord.PermissionsBitField.Flags.ViewChannel]
                            }, {
                                id: DiscordServer.roles.everyone,
                                deny: [Discord.PermissionsBitField.Flags.ViewChannel]
                            }]
                        })
                        if (newChannel) {
                            await interaction.reply({
                                content: `🛒 | Criando o Carrinho...`,
                                ephemeral: true
                            })
                            setTimeout(() => {
                                interaction.editReply({
                                    content: ` `,
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                            .setTitle(`😍 | Carrinho Criado!`)
                                            .setDescription(`<@${interaction.user.id}> **Seu carrinho foi criado com sucesso, fique avontade para adicionar mais produtos.**`)
                                    ],
                                    components: [
                                        new Discord.ActionRowBuilder()
                                            .addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setStyle(5)
                                                    .setLabel('🛒・Ir para o Carrinho')
                                                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${newChannel.id}`)
                                            )
                                    ],
                                    ephemeral: true
                                });
                            }, 2500);
                        } else {
                            return interaction.reply({ content: 'Não foi possivel criar o carrinho tente novamente!', ephemeral: true })
                        }
                        findUniCarrinhos()
                        require('./createCartMessage')(Discord, client, {
                            serverID: interaction.guild.id,
                            user: interaction.user,
                            member: interaction.member,
                            channelID: await newChannel.id,
                            edit: false
                        })
                    }

                }









                if (interaction.customId == 'copyPix') {
                    const botMessages = await DiscordChannel.messages.cache.filter(msg => msg.author.id === client.user.id);
                    const lastBotMessage = await botMessages.first();
                    let desc = await lastBotMessage.embeds[0].data.description
                    let code = await desc.replace('Pix Copiar e Colar:', "").replace(/\*/g, '').replace(/\```/g, '').trim()
                    ncp.copy(code)
                    interaction.reply({ content: '✅ | Codigo copiado para a area de transferencia.', ephemeral: true })
                }






                if (interaction.customId == 'payment') {
                    let userID = interaction.user.id
                    paymentMetod[userID] = interaction.values[0]
                    interaction.deferReply();
                    interaction.deleteReply()
                }

                if (interaction.customId && interaction.customId.includes('confirm')) {
                    try {
                        if (!carrinhos[interaction.user.id]) {
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            await interaction.reply('Não foi encontrado nenhum produto nesse carrinho vamos deleta-lo!');
                            setTimeout(() => {
                                DiscordChannel.delete()
                            }, 6000);
                            return
                        }
                        if (!paymentMetod[interaction.user.id]) {
                            const sentMessage = await interaction.reply('Selecione algum metodo de pagamento primeiro!');
                            setTimeout(() => {
                                sentMessage.delete()
                            }, 8000);
                            return
                        }

                        let carrinho = carrinhos[interaction.user.id]
                        let paymentMetodUser = paymentMetod[interaction.user.id]
                        let serverData = await db.findOne({ colecao: "servers", doc: await interaction.guildId })
                        async function getLineItemsAndPrice(carrinho, server) {
                            let line_items = []
                            let total = 0
                            let isProduct1n = false
                            for (let index = 0; index < carrinho.length; index++) {
                                const element = carrinho[index];
                                let produto = await server.products.find(product => product.productID == element.product)
                                let price = parseInt(produto.price)
                                // if (cupomOptions[interaction.user.id]) {
                                //     let findCupom = serverData.cupons.find(cupom => cupom.code == cupomOptions[interaction.user.id])
                                //     if (findCupom && findCupom.productRef == produto.productID) {
                                //         price = parseInt(produto.priceID) - (findCupom.type == 'porcent' ? parseInt(produto.priceID) * (parseInt(findCupom.value) / 100) : parseInt(findCupom.value))
                                //     }else{
                                //         price = produto.priceID
                                //     }
                                // }else{
                                //     price = produto.priceID
                                // }

                                if (price < 100) {
                                    isProduct1n = true
                                }

                                line_items.push({
                                    price: produto.priceID,
                                    quantity: parseInt(carrinho[index].quantidade),
                                })
                                let subtotal = (parseInt(price) * parseInt(carrinho[index].quantidade))
                                total = parseInt(total) + parseInt( subtotal)
                            }
                            return {
                                lineItems: line_items,
                                total: total,
                                isProduct1n: isProduct1n
                            }
                        }


                        let getData = await getLineItemsAndPrice(carrinho, serverData)

                        if (!getData || !getData.lineItems || !getData.total) {
                            return
                        }

                        if (paymentMetodUser == 'card' || paymentMetodUser == 'boleto') {

                            const paymentLinkCard = await stripe.checkout.sessions.create({
                                payment_method_types: [paymentMetodUser],
                                line_items: getData.lineItems,
                                metadata: {
                                    action: 'productCompra',
                                    user: interaction.user.id,
                                    products: JSON.stringify(carrinho),
                                    serverID: interaction.guildId,
                                    channelID: interaction.channelId,
                                },
                                payment_intent_data: {
                                    transfer_data: {
                                        amount: await calcTaxa(getData.total),
                                        destination: await serverData.bankData.accountID,
                                    },

                                },
                                mode: 'payment',
                                success_url: `${process.env.HOST}/redirect/sucess`,
                                cancel_url: `${process.env.HOST}/redirect/cancel`,
                            });
                            interaction.reply({
                                content: getData.isProduct1n == true ? '⚠️ 1 ou mais produtos tem o valor inferior a 1 real no pix para cobrir as taxas do cartão temos que reajustar o valor para no minimo 1 real' : '',
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                        .setTitle(`💕 | Produto Criado!`)
                                        .setDescription(`<@${interaction.user.id}> **Acesse o link abaixo para fazer o pagamento do seu produto.**`)
                                ],
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setStyle(5)
                                                .setLabel('🛍️・Ir para o pagamento')
                                                .setURL(paymentLinkCard.url)
                                        )
                                ],
                                ephemeral: true
                            })

                        } else {
                            try {
                                const Mercadoclient = new MercadoPagoConfig({ accessToken: serverData.bankData.mercadoPagoToken, options: { timeout: 5000 } });
                                const payment = new Payment(Mercadoclient);
                                let numeroComPonto = getData.total / 100;
                                let amount = parseFloat(numeroComPonto.toFixed(2))
                                const body = {
                                    transaction_amount: amount,
                                    description: `carrinho do usuario - ${interaction.user.username}`,
                                    payment_method_id: 'pix',
                                    external_reference: interaction.user.id,
                                    payer: mercadoPagoData.payer,
                                    notification_url: `${mercadoPagoData.notification_url}/mercadopago/webhook?token=${serverData.bankData.mercadoPagoToken}`,
                                    metadata: {
                                        userID: interaction.user.id,
                                        serverID: interaction.guildId,
                                        carrinhos: JSON.stringify(carrinho),
                                        token: serverData.bankData.mercadoPagoToken,
                                    }
                                };

                                payment.create({ body }).then(async (response) => {
                                    const cpc = response.point_of_interaction.transaction_data.qr_code
                                    const buffer = Buffer.from(response.point_of_interaction.transaction_data.qr_code_base64, "base64");
                                    const attachment = new Discord.AttachmentBuilder(buffer, { name: 'qrcodepix.png' })
                                    const botMessages = await DiscordChannel.messages.cache.filter(msg => msg.author.id === client.user.id);
                                    const lastBotMessage = await botMessages.first();
                                    lastBotMessage.edit({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle('Pague o seu carrinho pelo qrcode ou pelo pix copiar e colar abaixo!')
                                                .setDescription(`Pix Copiar e Colar:
                                                    ${'**```' + cpc + '```**'}`)
                                                .setImage('attachment://qrcodepix.png')
                                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                                                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                                        ],
                                        components: [new Discord.ActionRowBuilder()
                                            .addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setCustomId('pixCancel')
                                                    .setLabel('Cancelar')
                                                    .setStyle('4')
                                            )],
                                        files: [attachment],
                                        components: [new Discord.ActionRowBuilder()
                                            .addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setCustomId(`copyPix`)
                                                    .setLabel('Copiar Codigo')
                                                    .setStyle('2'),
                                            )]

                                    })
                                }).catch((error) => {
                                    console.error(error);
                                });
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }

                if (interaction.customId == 'pixCancel') {
                    try {
                        require('./createCartMessage')(Discord, client, {
                            serverID: interaction.guild.id,
                            user: interaction.user,
                            member: interaction.member,
                            channelID: await DiscordChannel.id,
                            edit: true
                        })
                    } catch (error) {
                        console.log(error);
                    }
                }


                if (interaction.customId == 'cancel') {
                    carrinhos[interaction.user.id] = null
                    paymentMetod[interaction.user.id] = null

                    await DiscordChannel.delete()
                    let analytics = await db.findOne({ colecao: 'analytics', doc: interaction.guildId })
                    if (analytics.error == false) {
                        let vendasCancel = await analytics["vendas canceladas"]
                        await vendasCancel.push(await functions.formatDate(new Date()))
                        db.update('analytics', interaction.guildId, {
                            "vendas canceladas": await vendasCancel
                        })
                    }
                }

                if (interaction.customId && interaction.customId.includes('remove')) {
                    if (!carrinhos[interaction.user.id]) {
                        await DiscordChannel.delete()
                        return
                    }
                    createRemoveEmbend(interaction, DiscordChannel, DiscordServer)
                }

                if (interaction.customId == 'exclud') {
                    let userID = interaction.user.id
                    if (excludItemSec[userID]) {
                        if (carrinhos[userID]) {
                            let idProd = excludItemSec[userID]
                            let indexToRemove = await carrinhos[userID].findIndex(element => element.product == idProd);
                            if (indexToRemove !== -1) {
                                await carrinhos[userID].splice(indexToRemove, 1);
                                if (carrinhos[userID].length <= 0) {
                                    await DiscordChannel.delete()
                                } else {
                                    await createRemoveEmbend(interaction, DiscordChannel, DiscordServer)
                                    interaction.reply('Produto Removido!')
                                }
                            } else {
                                interaction.reply('Esse produto não esta no carrinho!')
                            }
                        } else {
                            await DiscordChannel.delete()
                        }
                    } else {
                        interaction.reply('Selecione o produto que deseja remover primeiro!')
                    }
                }

                if (interaction.customId == 'excludItem') {
                    let userID = interaction.user.id
                    excludItemSec[userID] = interaction.values[0]
                    interaction.deferReply();
                    interaction.deleteReply()
                }

                if (interaction.customId == 'back') {
                    require('./createCartMessage')(Discord, client, {
                        serverID: interaction.guild.id,
                        user: interaction.user,
                        member: interaction.member,
                        channelID: await DiscordChannel.id,
                        edit: true
                    })
                }
                if (interaction.customId == 'productSendSelect') {
                    if (sendProduct[interaction.guild.id] == null || sendProduct[interaction.guild.id] == undefined) {
                        sendProduct[interaction.guild.id] = {}
                    }
                    sendProduct[interaction.guild.id].product = interaction.values[0]
                    interaction.deferReply().then((res) => { }).catch((err) => { })
                    interaction.deleteReply().then((res) => { }).catch((err) => { })
                }

                if (interaction.customId == 'userSendSelect') {
                    if (sendProduct[interaction.guild.id] == null || sendProduct[interaction.guild.id] == undefined) {
                        sendProduct[interaction.guild.id] = {}
                    }
                    sendProduct[interaction.guild.id].user = interaction.values[0]
                    interaction.deferReply().then((res) => { }).catch((err) => { })
                    interaction.deleteReply().then((res) => { }).catch((err) => { })
                }

                if (interaction.customId == 'productSendConfirm') {
                    if (sendProduct[interaction.guild.id] && sendProduct[interaction.guild.id].user && sendProduct[interaction.guild.id].product) {
                        let server = await db.findOne({ colecao: "servers", doc: interaction.guild.id })
                        const user = await client.users.fetch(await sendProduct[interaction.guild.id].user);
                        let SendUser = await client.users.fetch(interaction.user.id);
                        var DiscordServer = await client.guilds.cache.get(interaction.guild.id);
                        if (server && user && DiscordServer) {
                            let productID = await sendProduct[interaction.guild.id].product
                            var product = await server.products.find(product => product.productID == productID)
                            var productIndex = await server.products.findIndex(product => product.productID == productID)
                            let estoqueData = await server.products[productIndex].estoque
                            if (product && productIndex != -1 && estoqueData) {
                                if (estoqueData.length > 0) {
                                    let fields = []
                                    for (let index = 0; index < estoqueData[0].conteudo.length; index++) {
                                        const element = estoqueData[0].conteudo[index];
                                        fields.push({ name: element.title, value: "`" + element.content + "`" })
                                    }
                                    user.send({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(`🛍️ | Você recebeu um produto!`)
                                                .setDescription(`Você recebeu um novo produto de ${SendUser.globalName}`)
                                                .addFields(...fields)
                                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                                                .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                                .setTimestamp()
                                                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                        ],
                                    }).then((res) => {
                                        interaction.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(`✅ | Produto enviado!`)
                                                    .setDescription(`Você enviou um produto para ${user.globalName} Abaixo esta uma copia do que foi enviado:`)
                                                    .addFields(...fields)
                                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                                                    .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                                    .setTimestamp()
                                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                            ],
                                            ephemeral: true
                                        })
                                    }).catch(err => {
                                        console.log("err", err);
                                    })
                                    await estoqueData.splice(0, 1);
                                    product.estoque = estoqueData
                                    server.products[productIndex] = product

                                    db.update('servers', interaction.guild.id, {
                                        products: server.products
                                    })
                                    sendProduct[interaction.guild.id] = {}

                                } else {
                                    interaction.reply({ content: 'Falta de estoque!', ephemeral: true })
                                }

                            } else {
                                interaction.reply({ content: 'Erro ao recuperar o produto!', ephemeral: true })
                            }
                        }
                    } else {
                        interaction.reply({ content: 'Adicione os dados primeiro!', ephemeral: true })
                    }
                }


                if (interaction.customId == 'idiomaTicket') {
                    if (!ticketOptions[interaction.user.id]) {
                        ticketOptions[interaction.user.id] = {}
                    }
                    ticketOptions[interaction.user.id].idioma = interaction.values[0]
                    interaction.deferReply();
                    interaction.deleteReply()
                }
                if (interaction.customId == 'motivoTicket') {
                    if (!ticketOptions[interaction.user.id]) {
                        ticketOptions[interaction.user.id] = {}
                    }
                    ticketOptions[interaction.user.id].motivo = interaction.values[0]
                    interaction.deferReply();
                    interaction.deleteReply()
                }

                if (interaction.customId && interaction.customId.includes('closeTicket')) {
                    let protocolo = interaction.customId.replace('closeTicket-', "")
                    let findChannel = DiscordServer.channels.cache.find(c => c.topic == protocolo)
                    if (findChannel) {
                        try {
                            findChannel.delete()
                            dataBase.collection('tickets').doc(protocolo).delete()
                        } catch (error) { }

                    } else {
                        interaction.reply('Não foi possivel localizar o ticket!')
                    }
                }

                if (interaction.customId == 'createTicket') {
                    if (!ticketOptions[interaction.user.id] || !ticketOptions[interaction.user.id].idioma || !ticketOptions[interaction.user.id].motivo) {
                        interaction.reply({ content: "Adicione o idioma e o motivo primeiro!", ephemeral: true })
                    } else {
                        let findChannel = DiscordServer.channels.cache.find(c => c.topic && c.topic.includes(interaction.user.id) && c.name && c.name.includes('🎫・Ticket・'))
                        if (findChannel) {
                            interaction.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor("#C21010")
                                        .setTitle(`⚠️| Você já possui um ticket aberto!`)
                                        .setDescription(`Clique no botão abaixo para ir ate ele!`)
                                ],
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setStyle(5)
                                                .setLabel('🎫・Ir para o Ticket')
                                                .setURL(`https://discord.com/channels/${interaction.guild.id}/${findChannel.id}`)
                                        )
                                ],
                                ephemeral: true
                            })
                        } else {
                            require('./newTicketFunction')(client, interaction, ticketOptions[interaction.user.id])
                        }

                    }

                }

                if (interaction.customId == 'cupomADD') {
                    if (cupomOptions[interaction.user.id]) {
                        interaction.reply({ content: "Você ja tem um cupom ativo!", ephemeral: true })
                        return
                    }
                    let cupomCode = await interaction.fields.fields.get('cupomtext').value
                    let server = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    let cupom = server.cupons.find(cupom => cupom.code == cupomCode)
                    if (cupom && cupom.active == true) {
                        cupomOptions[interaction.user.id] = ''
                        cupomOptions[interaction.user.id] = cupomCode
                        interaction.deferReply();
                        interaction.deleteReply()
                    } else {
                        interaction.reply({ content: "Esse cupom não existe ou esta expirado!", ephemeral: true })
                        return
                    }
                }

                if (interaction.customId == 'cupombutton') {
                    if (cupomOptions[interaction.user.id]) {
                        interaction.reply({ content: "Você ja tem um cupom ativo!", ephemeral: true })
                        return
                    }
                    const modal = new Discord.ModalBuilder()
                        .setCustomId('cupomADD')
                        .setTitle('Adicionar cupom');

                    modal.addComponents(
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('cupomtext')
                                .setLabel("insira o codigo do cupom abaixo!")
                                .setStyle(Discord.TextInputStyle.Short)
                        )
                    );

                    await interaction.showModal(modal);
                }

            } catch (error) {
                console.log(error);
            }
        })
    } catch (error) {
        console.log('totalDiscordIndex: ', error);
    }
}


module.exports.carrinhos = carrinhos


module.exports.sendPaymentStatus = async (serverID, tentativas, dias) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: serverID })
        var DiscordServer = await client.guilds.cache.get(serverID);
        let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
        dono.send(`Faltam ${tentativas ? tentativas + " tentativas" : dias + " dias"} para expirar sua assinatura`)
    } catch (error) {
        console.log(error);
    }
}



module.exports.sendProductPayment = async (params, id, type) => {
    var DiscordServer = await client.guilds.cache.get(params.serverID);
    let findChannel = DiscordServer.channels.cache.find(c => c.topic === params.userID && c.name && c.name.includes('🛒・carrinho・'))
    let serverData = await db.findOne({ colecao: "servers", doc: params.serverID })
    if (DiscordServer && findChannel && serverData) {
        let carrinho = JSON.parse(params.carrinhos)
        let result = await new Promise((resolve, reject) => {
            const promises = carrinho.map(async (element) => {
                const produto = serverData.products.find(product => product.productID == element.product);
                if (!produto || produto.estoque.length < element.quantidade) {
                    return false;
                }
                return true;
            });
            Promise.all(promises)
                .then(results => {
                    const hasNoStock = results.some(result => !result);
                    resolve(!hasNoStock);
                })
                .catch(reject);
        });
        async function refound() {
            const fetched = await findChannel.messages.fetch({ limit: 100 });
            findChannel.bulkDelete(fetched)
            if (type == 'aprovado') {
                await findChannel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(`${DiscordServer.name} | Falta de estoque`)
                            .setDescription(`Não foi possivel aprovar o carrinho por falta de estoque!`)
                    ]
                }).catch(() => { })
                return
            }
            await findChannel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(`${DiscordServer.name} | Reembolso`)
                        .setDescription(`Você Recebeu Reembolso porque alguem comprou primeiro!`)
                ]
            }).catch(() => { })
            if (type == 'pix') {
                try {

                    await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
                        headers: {
                            Authorization: `Bearer ${params.token}`
                        }
                    })

                } catch (error) { }
            } else {
                try {
                    await stripe.refunds.create({
                        payment_intent: id,
                    });
                } catch (error) {

                }
            }
            let analytics = await db.findOne({ colecao: "analytics", doc: serverData.id })

            if (analytics.error == false) {
                let reebolsos = analytics['reebolsos']
                await reebolsos.push(await functions.formatDate(new Date()))
                db.update('analytics', serverData.id, {
                    "reebolsos": reebolsos
                })
            } else {
                db.create('analytics', serverData.id, {
                    "cancelados estoque": [],
                    "pagamentos": {
                        "PIX": 0,
                        "card": 0,
                        "boleto": 0,
                    },
                    "reebolsos": [await functions.formatDate(new Date())],
                    "vendas canceladas": [],
                    "vendas completas": []
                })
            }
            carrinhos[params.userID] = null
        }

        if (result == true) {
            async function createTextContentFromObjects(objectsArray) {
                let textContent = '';

                await objectsArray.forEach(async (obj, index) => {
                    await obj.forEach((line, index2) => {
                        textContent += `${line.title}: ${line.content}\n`;
                    })
                });

                return textContent;
            }


            const user = await client.users.fetch(params.userID);
            let fields = []
            await carrinho.forEach(async (element, index) => {
                try {
                    var product = await serverData.products.find(product => product.productID == element.product)
                    var productIndex = await serverData.products.findIndex(product => product.productID == element.product)
                    let estoqueData = await serverData.products[productIndex].estoque
                    let arrayCarrinhoProd = []
                    if (parseInt(element.quantidade) <= estoqueData.length) {
                        for (let index = 0; index < parseInt(element.quantidade); index++) {
                            arrayCarrinhoProd.push(estoqueData[0].conteudo)
                            await estoqueData.splice(0, 1);
                            if (index == parseInt(element.quantidade) - 1) {
                                try {
                                    let DiscordServer = await client.guilds.cache.get(serverData.id);
                                    let findProductChannel = DiscordServer.channels.cache.find(c => c.id === product.channel)
                                    const fetchedMessage = await findProductChannel.messages.fetch(product.mensageID);
                                    if (fetchedMessage) {
                                        let totalEstoque = []
                                        if (product.estoque.length > 0) {
                                            let estoque = product.estoque.length > 25 ? 25 : product.estoque.length
                                            for (let index2 = 0; index2 < estoque; index2++) {
                                                let indexSring1 = `${index2 + 1}`
                                                if (index == 0) {
                                                    totalEstoque.push(new Discord.StringSelectMenuOptionBuilder().setLabel(indexSring1).setValue(indexSring1).setDefault(true),)
                                                } else {
                                                    totalEstoque.push(new Discord.StringSelectMenuOptionBuilder().setLabel(indexSring1).setValue(indexSring1),)
                                                }

                                            }
                                        }
                                        if (totalEstoque.length > 25) {
                                            const numToRemove = totalEstoque.length - 25;
                                            await totalEstoque.splice(-numToRemove);
                                        }
                                        fetchedMessage.edit({
                                            components: [
                                                new Discord.ActionRowBuilder().addComponents(
                                                    new Discord.StringSelectMenuBuilder()
                                                        .setCustomId(`qntProduct_${product.productID}`)
                                                        .setPlaceholder('Selecione a quantidade!')
                                                        .setMinValues(1)
                                                        .setMaxValues(1)
                                                        .addOptions(...totalEstoque)
                                                        .setDisabled(product.estoque.length <= 0 ? true : false)
                                                ),
                                                new Discord.ActionRowBuilder().addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setCustomId(`comprar_${product.productID}`)
                                                        .setLabel('Comprar')
                                                        .setStyle('3'),
                                                )
                                            ]
                                        }).catch((err) => {
                                            require('../Discord/createProductMessage.js')(Discord, client, {
                                                channelID: product.channel,
                                                serverID: params.serverID,
                                                productID: element.product,
                                                edit: true
                                            })
                                            console.log(err);
                                        })
                                    } else {
                                        require('../Discord/createProductMessage.js')(Discord, client, {
                                            channelID: product.channel,
                                            serverID: params.serverID,
                                            productID: element.product,
                                            edit: true
                                        })
                                    }

                                } catch (error) {
                                    console.log(error);
                                    require('../Discord/createProductMessage.js')(Discord, client, {
                                        channelID: product.channel,
                                        serverID: params.serverID,
                                        productID: element.product,
                                        edit: true
                                    })
                                }
                            }
                        }

                    } else {  
                        refound()
                        return
                    }
                    let content = await createTextContentFromObjects(arrayCarrinhoProd);
                    fields.push({ name: "**" + product.productName + ': **', value: "```" + content + "```" },)
                    product.estoque = estoqueData
                    serverData.products[productIndex] = product
                    await db.update('servers', serverData.id, {
                        products: serverData.products
                    })
                } catch (error) {
                    console.log(error);
                }
            });
            const dataHoraAtual = new Date();
            const dataHoraFormatada = `${String(dataHoraAtual.getDate()).padStart(2, '0')}/${String(dataHoraAtual.getMonth() + 1).padStart(2, '0')}/${dataHoraAtual.getFullYear()} ${String(dataHoraAtual.getHours()).padStart(2, '0')}:${String(dataHoraAtual.getMinutes()).padStart(2, '0')}:${String(dataHoraAtual.getSeconds()).padStart(2, '0')}`;


            try {
                let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
                await dono.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(`Nova compra no servidor: ${DiscordServer.name}`)
                            .setDescription(`Abaixo estão os dados que foram entregues:`)
                            .addFields(
                                { name: '\u200B', value: '\u200B' },
                                { name: 'Nome do usuario comprador', value: user.username, inline: true },
                                { name: 'ID do usuario', value: user.id, inline: true },
                                { name: 'ID da compra', value: findChannel.id },
                                { name: 'Data e hora da compra', value: dataHoraFormatada },
                                { name: '\u200B', value: '\u200B' },
                                ...fields
                            )
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                            .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                            .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                    ],
                }).catch(() => { })
                await user.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle('📦 | Sua entrega chegou!')
                            .setDescription(`Abaixo estão os dados da sua entrega:`)
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                            .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                            .addFields(...fields)
                            .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                    ],
                }).catch(() => { })
                const fetched = await findChannel.messages.fetch({ limit: 100 });
                findChannel.bulkDelete(fetched)
                findChannel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle('📦 | Sua entrega chegou!')
                            .setDescription(`Enviamos a entrega no seu privado caso não tenha recebido o seu privado pode esta bloqueado então tenha certeza de baixar os arquivos antes que o carrinho seja fechado`)
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
                            .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                            .addFields(...fields)
                            .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                    ],

                    components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setStyle(4)
                                    .setLabel('Fechar carrinho')
                                    .setCustomId('cancel')
                            )
                    ],
                });



                if ('configs' in serverData && 'publicBuyChannel' in serverData.configs && serverData.configs.publicBuyChannel) {
                    try {
                        let findChannelPublic = DiscordServer.channels.cache.find(c => c.id === serverData.configs.publicBuyChannel)
                        let fieldsPublic = { name: `Carrinho:`, value: '' }
                        let valorTotal = 0
                        await carrinho.forEach(async (element, index) => {
                            var product = await serverData.products.find(product => product.productID == element.product)
                            valorTotal = valorTotal + (parseInt(product.price) * element.quantidade)
                            fieldsPublic.value += `${index + 1} - ${product.productName} - ${element.quantidade}x\n`
                        });
                        fieldsPublic = { name: fieldsPublic.name, value: "`" + fieldsPublic.value + "`" }
                        let price = await functions.formatarMoeda(valorTotal)
                        let allfieldsPublic = [{ name: 'Valor total:', value: "`" + price + "`", inline: true }, fieldsPublic,]
                        let userPic = await user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
                        let findChannelProduct = DiscordServer.channels.cache.find(c => c.topic === carrinho[0].product)
                        let commp = {}
                        if (findChannelProduct) {
                            commp.components = [new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('📤・Ir para o produto')
                                        .setURL(`https://discord.com/channels/${params.serverID}/${findChannelProduct.id}`)
                                )]
                        }
                        if (findChannelPublic) {
                            findChannelPublic.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(`🛍️ | Nova compra!`)
                                        .setDescription(`Uma nova compra foi feita abaixo está os dados da compra:`)
                                        .addFields(...allfieldsPublic)
                                        .setAuthor({ name: user.globalName, iconURL: userPic })
                                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                        .setTimestamp()
                                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                ],
                                ...commp
                            })
                        }
                    } catch (error) {
                        console.log("LogPublicError", error);
                    }
                }

                if ('personalize' in serverData && 'cargoPay' in serverData.personalize) {
                    try {
                        const member = await DiscordServer.members.fetch(params.userID);
                        const role = await DiscordServer.roles.cache.get(serverData.personalize.cargoPay);
                        await member.roles.add(role)

                    } catch (error) {

                    }
                }


                let analytics = await db.findOne({ colecao: "analytics", doc: serverData.id })

                if (analytics.error == false) {
                    let vendasComple = analytics['vendas completas']
                    await vendasComple.push(await functions.formatDate(new Date()))
                    db.update('analytics', serverData.id, {
                        "pagamentos": {
                            "PIX": type == "pix" ? parseInt(analytics["pagamentos"]["PIX"]) + 1 : parseInt(analytics["pagamentos"]["PIX"]),
                            "card": type == "stripe" ? parseInt(analytics["pagamentos"]["card"]) + 1 : parseInt(analytics["pagamentos"]["card"]),
                            "boleto": 0,
                        },
                        "vendas completas": vendasComple
                    })

                } else {
                    let payment = {
                        "PIX": type == "pix" ? 1 : 0,
                        "card": type == "stripe" ? 1 : 0,
                        "boleto": 0,
                    }
                    db.create('analytics', serverData.id, {
                        "cancelados estoque": [],
                        "pagamentos": payment,
                        "reebolsos": [],
                        "vendas canceladas": [],
                        "vendas completas": [await functions.formatDate(new Date())]
                    })
                }
                carrinhos[params.userID] = null
            } catch (error) {
                console.log(error);
                console.log(fields);
            }

        } else {
            refound()
        }
        try {
            setTimeout(async () => {
                var DiscordServer2 = await client.guilds.cache.get(params.serverID);
                let findChannel2 = await DiscordServer2.channels.cache.find(c => c.topic === params.userID)
                if (findChannel2) {
                    findChannel2.delete().catch((err) => { })
                }
            }, 20000)
        } catch (error) { }

    }
}



module.exports.sendDiscordMensageChannel = async (server, channel, title, mensage, user, deleteChannel = false) => {
    try {
        let serverData = await db.findOne({ colecao: 'servers', doc: server })
        var DiscordServer = await client.guilds.cache.get(server);
        var DiscordChannel
        if (user) {
            DiscordChannel = DiscordServer.channels.cache.find(c => c.topic === user)
        } else {
            DiscordChannel = await DiscordServer.channels.cache.get(channel)
        }
        await DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(`${DiscordServer.name} | ${title}`)
                    .setDescription(mensage)
                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
            ]
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