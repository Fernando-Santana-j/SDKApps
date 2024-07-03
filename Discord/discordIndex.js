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
const discordTranscripts = require('discord-html-transcripts');
client.login(botConfig.discordToken)



var paymentMetod = {}
var excludItemSec = {}
var carrinhos = {}
var sendProduct = {}
var preCarrinhos = {}
let ticketOptions = {}
let cupomOptions = {}

module.exports = (Discord2, client) => {

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


                    //sistema de castigo
                    const SPAM_THRESHOLD = 3; // Número de menções
                    const TIME_WINDOW = 10000; // 10 segundos em milissegundos
                    const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

                    if (message.author.bot) return; // Ignorar mensagens de bots

                    const mentionedUsers = message.mentions.users;
                    if (mentionedUsers.size === 0) return; // Ignorar se não houver menções

                    const authorId = message.author.id;
                    const channelId = message.channel.id;

                    for (const [mentionedUserId, mentionedUser] of mentionedUsers) {
                        if (mentionedUserId === authorId) continue; // Ignorar menções a si mesmo

                        try {
                            // Buscar mensagens recentes no canal
                            const messages = await message.channel.messages.fetch({ limit: 100 });
                            const now = Date.now();

                            // Filtrar mensagens para encontrar quantas vezes o autor mencionou o mesmo usuário
                            const recentMentions = messages.filter(
                                msg => msg.author.id === authorId &&
                                    msg.mentions.users.has(mentionedUserId) &&
                                    (now - msg.createdTimestamp < TIME_WINDOW)
                            );

                            if (recentMentions.size >= SPAM_THRESHOLD) {
                                // Colocar o usuário em timeout
                                const member = message.guild.members.cache.get(authorId);
                                if (member) {
                                    await member.timeout(TIMEOUT_DURATION, `Menções excessivas a ${mentionedUser.username}`);
                                }
                                break;
                            }
                        } catch (err) {
                            console.error(`Erro ao processar menções:`, err);
                        }
                    }
                }
            } catch (error) {
                // console.log(error);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            try {
                var DiscordServer = null
                var DiscordChannel = null
                if (interaction.guildId != 'null') {
                    DiscordServer = await client.guilds.cache.get(interaction.guildId);
                }
                if (interaction.channelId != 'null' && DiscordServer) {
                    DiscordChannel = await DiscordServer.channels.cache.get(interaction.channelId)
                }

                if (interaction.guildId && DiscordServer) {
                    let verifyPerms = await functions.verifyPermissions(interaction.user.id, interaction.guildId, Discord, client)
                    if (verifyPerms.error == true) {
                        return
                    }
                    if (verifyPerms.perms.owner == false && verifyPerms.perms.command == false) {
                        interaction.reply({ content: 'Você não tem permissão para executar comandos', ephemeral: true })
                        return
                    }


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
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
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
                    let value = await interaction.values[0]
                    if (value == null) {
                        return
                    }
                    if (!preCarrinhos[interaction.user.id]) {
                        preCarrinhos[interaction.user.id] = []
                    }
                    let product = await interaction.customId.replace('qntProduct_', "")
                    let findCart = await preCarrinhos[interaction.user.id].find(element => element.product == product)
                    let findIndexCart = await preCarrinhos[interaction.user.id].findIndex(element => element.product == product)
                    preCarrinhos[interaction.user.id]
                    if (findCart) {
                        preCarrinhos[interaction.user.id][findIndexCart].quantidade = parseInt(value)
                    } else {
                        preCarrinhos[interaction.user.id].push({
                            product: product,
                            quantidade: value
                        })
                    }

                    interaction.deferReply();
                    interaction.deleteReply()
                }



                async function comprarFunction(productID) {
                    let server = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    let product = await server.products.find(product => product.productID == productID)
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
                        let prodid = productID
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
                        let prodid = await productID
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
                // interacao do botao de compra de um produto
                if (interaction.customId && interaction.customId.includes('comprar')) {
                    comprarFunction(interaction.customId.replace('comprar_', ''))
                }

                if (interaction.customId == 'multSelectProduct') {
                    comprarFunction(interaction.values[0])
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
                                total = parseInt(total) + parseInt(subtotal)
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
                                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
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

                if (interaction.customId && interaction.customId.includes('productSendConfirm')) {
                    let quantidade = parseInt(interaction.customId.replace('productSendConfirm-', ''))
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
                                if (estoqueData.length >= quantidade) {
                                    let fields = []
                                    for (let index = 0; index < quantidade; index++) {
                                        const element2 = estoqueData[0].conteudo;

                                        await element2.forEach(element => {
                                            fields.push({ name: element.title, value: "`" + element.content + "`" })
                                        })
                                        await estoqueData.splice(0, 1);
                                        product.estoque = estoqueData
                                        server.products[productIndex] = product
                                        db.update('servers', interaction.guild.id, {
                                            products: server.products
                                        })
                                    }
                                    const concatenatedString = await fields.map(obj => `${obj.value.replace(/`/g, '')}`).join('\n');
                                    const buffer = Buffer.from(concatenatedString, 'utf-8');
                                    const attachment = new Discord.AttachmentBuilder(buffer, { name: 'compras.txt' });
                                    user.send({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(`🛍️ | Você recebeu um produto!`)
                                                .setDescription(`Você recebeu um novo produto de ${SendUser.globalName}`)
                                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                                .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                                .setTimestamp()
                                                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                        ],
                                        files: [attachment]
                                    }).then((res) => {
                                        interaction.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(`✅ | Produto enviado!`)
                                                    .setDescription(`Você enviou um produto para ${user.globalName} Abaixo esta uma copia do que foi enviado:`)
                                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                                    .setColor('personalize' in server && 'colorDest' in server.personalize ? server.personalize.colorDest : '#6E58C7')
                                                    .setTimestamp()
                                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                            ],
                                            ephemeral: true
                                        })
                                    }).catch(err => {
                                        console.log("err", err);
                                    })


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


                // if (interaction.customId == 'idiomaTicket') {
                //     if (!ticketOptions[interaction.user.id]) {
                //         ticketOptions[interaction.user.id] = {}
                //     }
                //     ticketOptions[interaction.user.id].idioma = interaction.values[0]
                //     interaction.deferReply();
                //     interaction.deleteReply()
                // }
                if (interaction.customId == 'motivoTicket') {
                    let serverData = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    if (!serverData) {
                        return interaction.reply({ content: "Não foi possivel localizar os dados do ticket!", ephemeral: true })
                    }
                    let semanaDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
                    let semanaDaysServer = serverData.ticketOptions.atend.days
                    let atend = serverData.ticketOptions.atend
                    const today = new Date();
                    const dayIndex = today.getDay();
                    let todayInArray = semanaDaysServer.includes(semanaDays[dayIndex])
                    const hora = `${today.getHours()}:${today.getMinutes()}`


                    function isTimeAfter(referenceTime, checkTime) {
                        // Divide as horas e minutos
                        const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                        const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                        // Compara as horas e minutos
                        if (checkHours >= refHours) {
                            return true;
                        } else if (checkHours === refHours && checkMinutes > refMinutes) {
                            return true;
                        }
                        return false;
                    }

                    function isTimeBefore(referenceTime, checkTime) {
                        // Divide as horas e minutos
                        const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                        const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                        // Compara as horas e minutos
                        if (checkHours <= refHours) {
                            return true;
                        } else if (checkHours === refHours && checkMinutes > refMinutes) {
                            return true;
                        }
                        return false;
                    }

                    let checkTimeBefore = isTimeBefore(atend.end, hora)
                    let checkTimeAfter = isTimeAfter(atend.start, hora)
                    if (checkTimeAfter == true && checkTimeBefore == true && todayInArray) {
                        // if (!ticketOptions[interaction.user.id] || !ticketOptions[interaction.user.id].motivo) {
                        //     interaction.reply({ content: "Adicione o motivo primeiro!", ephemeral: true })
                        //     return
                        // } else {
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
                            require('./newTicketFunction')(client, interaction, { motivo: interaction.values[0] })
                            if ('ticketOptions' in serverData && serverData.ticketOptions.privateLog) {
                                var DiscordChannelPublicLog = await DiscordServer.channels.cache.get(serverData.ticketOptions.privateLog)
                                let dataAtual = new Date();
                                let meses = [
                                    "Janeiro", "Fevereiro", "Março", "Abril",
                                    "Maio", "Junho", "Julho", "Agosto",
                                    "Setembro", "Outubro", "Novembro", "Dezembro"
                                ];
                                let dataFormatada = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()} às ${dataAtual.getHours()}:${dataAtual.getMinutes()}`;
                                let findMotivo = await serverData.ticketOptions.motivos.find(element => element.id == interaction.values[0])

                                DiscordChannelPublicLog.send({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor('#6E58C7')
                                            .setTitle(`🎫・Novo ticket!`)
                                            .setFields({ name: "🛍 | Nome do cliente:", value: "**" + interaction.user.username + "**", inline: false }, { name: "🆔 | ID do cliente:", value: "``" + interaction.user.id + "``", inline: true }, { name: "Motivo:", value: findMotivo.name, inline: false }, { name: "📅 | Data:", value: "**" + dataFormatada + '**', inline: false })
                                    ],
                                })
                            }
                        }

                        // }
                    } else {
                        return interaction.reply({ content: `O sistema de ticket não esta funcionando nesse periodo apenas nos dias de ${semanaDaysServer.join(', ')} e no horario de ${atend.start} ate ${atend.end} !`, ephemeral: true })
                    }





                    // if (!ticketOptions[interaction.user.id]) {
                    //     ticketOptions[interaction.user.id] = {}
                    // }
                    // ticketOptions[interaction.user.id].motivo = interaction.values[0]

                    // interaction.deferReply();
                    // interaction.deleteReply()
                }

                if (interaction.customId && interaction.customId.includes('ticketAvalStart')) {
                    try {
                        let embed = interaction.message.embeds[0].data
                        let serverData = await db.findOne({ colecao: "servers", doc: embed.fields[3].value })
                        let DiscordServer2 = await client.guilds.cache.get(embed.fields[3].value)
                        var logChannel = await DiscordServer2.channels.cache.get(serverData.ticketOptions.log)
                        let userRespo = await client.users.fetch(embed.fields[1].value)
                        let starCount = parseInt(interaction.customId.replace('ticketAvalStart-', ''))
                        let starIcons = ''
                        for (let index = 0; index < 5; index++) {
                            if (index < starCount) {
                                starIcons += "⭐"
                            } else {
                                starIcons += "☆"
                            }
                        }
                        let dataAtual = new Date();
                        let meses = [
                            "Janeiro", "Fevereiro", "Março", "Abril",
                            "Maio", "Junho", "Julho", "Agosto",
                            "Setembro", "Outubro", "Novembro", "Dezembro"
                        ];
                        let dataFormatada = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()} às ${dataAtual.getHours()}:${dataAtual.getMinutes()}`;

                        logChannel.send({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor('#6E58C7')
                                    .setTitle(`🌟・Nova avaliação!`)
                                    .setDescription(`O responsavel pelo ticket **${userRespo.globalName}** foi avaliado com ${starCount} estrelas no seu ultimo ticket!`)
                                    .setFields({ name: "💼 | Responsavel pelo ticket:", value: "**" + userRespo.username + "**", inline: true }, { name: "🆔 | ID do Responsavel:", value: "``" + userRespo.id + "``", inline: true }, { name: "🛍 | Nome do cliente:", value: "**" + interaction.user.username + "**", inline: false }, { name: "🆔 | ID do cliente:", value: "``" + interaction.user.id + "``", inline: true }, { name: "🌟 | Avaliação:", value: `${starIcons} | (${starCount}/5)`, inline: false }, { name: "📅 | Data:", value: "**" + dataFormatada + '**', inline: false })
                            ],
                        })
                        interaction.reply({ content: "Obrigado por sua avaliação!", ephemeral: true, })
                        try {
                            interaction.message.edit({
                                embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Você ja avaliou esse ticket com ${starCount} estrelas, muito obrigado!`)],
                                components: []
                            })
                        } catch (error) {
                            interaction.mensage.delete()
                        }

                    } catch (error) {
                        console.log(error);
                    }
                }

                if (interaction.customId && interaction.customId.includes('closeTicket')) {
                    let protocolo = DiscordChannel.topic
                    let userTicketID = DiscordChannel.topic.replace(/prot-\d+-/, '')
                    const user = await client.users.fetch(userTicketID)
                    let serverData = await db.findOne({ colecao: "servers", doc: interaction.guildId })

                    if (DiscordChannel) {
                        try {
                            let embed = interaction.message.embeds[0].data
                            if (embed.fields[3]) {
                                try {
                                    const userResp = await client.users.fetch(embed.fields[3].value.replace(/`/g, ""))
                                    user.send({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setColor('#6E58C7')
                                                .setTitle(`⚠・Seu ticket foi fechado!`)
                                                .setDescription(`Agora que seu ticket foi fechado nos ajude avaliando o responsavel pelo seu ticket abaixo tera 5 estrelas caso você marque a primeira estara avaliando com 1 estrela e a ultima seram 5!`)
                                                .setFields({ name: "Responsavel pelo ticket", value: userResp.username, inline: true }, { name: "ID do Responsavel", value: userResp.id, inline: true }, { name: "Servidor", value: DiscordServer.name, inline: false }, { name: "Servidor ID", value: interaction.guildId, inline: true })
                                        ],
                                        components: [
                                            new Discord.ActionRowBuilder()
                                                .addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setStyle(Discord.ButtonStyle.Danger)
                                                        .setLabel('⭐ - 1')
                                                        .setCustomId('ticketAvalStart-1')
                                                )
                                                .addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setStyle(Discord.ButtonStyle.Secondary)
                                                        .setLabel('⭐ - 2')
                                                        .setCustomId('ticketAvalStart-2')
                                                )
                                                .addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setStyle(Discord.ButtonStyle.Primary)
                                                        .setLabel('⭐ - 3')
                                                        .setCustomId('ticketAvalStart-3')
                                                )
                                                .addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setStyle(Discord.ButtonStyle.Secondary)
                                                        .setLabel('⭐ - 4')
                                                        .setCustomId('ticketAvalStart-4')
                                                )
                                                .addComponents(
                                                    new Discord.ButtonBuilder()
                                                        .setStyle(Discord.ButtonStyle.Success)
                                                        .setLabel('⭐ - 5')
                                                        .setCustomId('ticketAvalStart-5')
                                                )
                                        ]
                                    })
                                    if ('ticketOptions' in serverData && serverData.ticketOptions.privateLog) {
                                        var DiscordChannelPublicLog = await DiscordServer.channels.cache.get(serverData.ticketOptions.privateLog)
                                        const attachment = await discordTranscripts.createTranscript(DiscordChannel, {
                                            limit: -1, // Max amount of messages to fetch. `-1` recursively fetches.
                                            returnType: 'attachment', // Valid options: 'buffer' | 'string' | 'attachment' Default: 'attachment' OR use the enum ExportReturnType
                                            filename: `${DiscordServer.name} | ${protocolo}.html`, // Only valid with returnType is 'attachment'. Name of attachment.
                                            saveImages: false, // Download all images and include the image data in the HTML (allows viewing the image even after it has been deleted) (! WILL INCREASE FILE SIZE !)
                                            footerText: "Exported {number} message{s}", // Change text at footer, don't forget to put {number} to show how much messages got exported, and {s} for plural
                                            poweredBy: false, // Whether to include the "Powered by discord-html-transcripts" footer
                                            ssr: true // Whether to hydrate the html server-side
                                        });
                                        let dataAtual = new Date();
                                        let meses = [
                                            "Janeiro", "Fevereiro", "Março", "Abril",
                                            "Maio", "Junho", "Julho", "Agosto",
                                            "Setembro", "Outubro", "Novembro", "Dezembro"
                                        ];
                                        let dataFormatada = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()} às ${dataAtual.getHours()}:${dataAtual.getMinutes()}`;

                                        DiscordChannelPublicLog.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor('#6E58C7')
                                                    .setTitle(`🎫・Ticket Fechado!`)
                                                    .setFields({ name: "💼 | Responsavel pelo ticket:", value: "**" + userResp.username + "**", inline: false }, { name: "🆔 | ID do responsavel:", value: "``" + userResp.id + "``", inline: true }, { name: "🛍 | Nome do cliente:", value: "**" + user.username + "**", inline: false }, { name: "🆔 | ID do cliente:", value: "``" + user.id + "``", inline: true }, { name: "Protocolo:", value: protocolo, inline: false }, { name: "📅 | Data:", value: "**" + dataFormatada + '**', inline: false })
                                            ],
                                            files: [attachment]
                                        })
                                    }
                                } catch (error) {
                                    console.log(error);
                                }
                            }


                            DiscordChannel.delete()
                            db.delete('tickets', protocolo)
                            const voiceChannel = DiscordServer.channels.cache.find(channel =>
                                channel.type === 2 && channel.name == DiscordChannel.name
                            );

                            if (voiceChannel) {
                                voiceChannel.delete()
                            }

                        } catch (error) { }

                    } else {
                        interaction.reply('Não foi possivel localizar o ticket!')
                    }
                }

                if (interaction.customId == 'createTicket') {
                    let serverData = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    if (!serverData) {
                        return interaction.reply({ content: "Não foi possivel localizar os dados do ticket!", ephemeral: true })
                    }
                    let semanaDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
                    let semanaDaysServer = serverData.ticketOptions.atend.days
                    let atend = serverData.ticketOptions.atend
                    const today = new Date();
                    const dayIndex = today.getDay();
                    let todayInArray = semanaDaysServer.includes(semanaDays[dayIndex])
                    const hora = `${today.getHours()}:${today.getMinutes()}`


                    function isTimeAfter(referenceTime, checkTime) {
                        // Divide as horas e minutos
                        const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                        const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                        // Compara as horas e minutos
                        if (checkHours >= refHours) {
                            return true;
                        } else if (checkHours === refHours && checkMinutes > refMinutes) {
                            return true;
                        }
                        return false;
                    }

                    function isTimeBefore(referenceTime, checkTime) {
                        // Divide as horas e minutos
                        const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                        const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                        // Compara as horas e minutos
                        if (checkHours <= refHours) {
                            return true;
                        } else if (checkHours === refHours && checkMinutes > refMinutes) {
                            return true;
                        }
                        return false;
                    }

                    let checkTimeBefore = isTimeBefore(atend.end, hora)
                    let checkTimeAfter = isTimeAfter(atend.start, hora)
                    if (checkTimeAfter == true && checkTimeBefore == true && todayInArray) {
                        if (!ticketOptions[interaction.user.id] || !ticketOptions[interaction.user.id].motivo) {
                            interaction.reply({ content: "Adicione o motivo primeiro!", ephemeral: true })
                            return
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
                    } else {
                        return interaction.reply({ content: `O sistema de ticket não esta funcionando nesse periodo apenas nos dias de ${semanaDaysServer.join(', ')} e no horario de ${atend.start} ate ${atend.end} !`, ephemeral: true })
                    }



                }



                if (interaction.customId && interaction.customId.includes('assumirTicket')) {
                    let userTicketID = DiscordChannel.topic.replace(/prot-\d+-/, '')

                    if (interaction.user.id == userTicketID) {
                        interaction.reply({ content: 'Você não pode assumir o seu proprio ticket!', ephemeral: true })
                        return
                    }
                    const user = await client.users.fetch(userTicketID)

                    user.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor('#6E58C7')
                                .setTitle(`⚠・Nova notificação!`)
                                .setDescription(`O usuario ${interaction.user.username} assumiu o seu ticket no servidor ${DiscordServer.name} e logo ira lhe responder, clique no botão abaixo para ser redirecionado! \n\n Protocolo do ticket: ${DiscordChannel.topic}`)
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('🎟・Ir para o Ticket')
                                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channelId}`)
                                )
                        ]
                    })
                    let embed = interaction.message.embeds[0].data
                    let generateProtocol = interaction.customId.replace('assumirTicket-', '')
                    interaction.message.edit({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(embed.color)
                                .setTitle(embed.title)
                                .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                                .setDescription(embed.description)
                                .setFields(...embed.fields, { name: `**Assumido**`, value: "`" + interaction.user.id + "`", inline: true })
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setLabel('⏰・Notificar usuario')
                                        .setCustomId(`notifyTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setLabel('📞・Criar canal de voz')
                                        .setCustomId(`voiceTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Danger)
                                        .setLabel('❌・Fechar Ticket')
                                        .setCustomId(`closeTicket-${generateProtocol}`)
                                )

                        ],
                    })
                    interaction.reply(`Ticket assumido por: ${interaction.user.username}`)
                }


                if (interaction.customId && interaction.customId.includes('voiceTicket')) {
                    let userTicketID = DiscordChannel.topic.replace(/prot-\d+-/, '')

                    if (interaction.user.id == userTicketID) {
                        interaction.reply({ content: 'Você não pode executar essa função!', ephemeral: true })
                        return
                    }
                    let embed = interaction.message.embeds[0].data
                    let generateProtocol = interaction.customId.replace('voiceTicket-', '')
                    let categoria = DiscordServer.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets')
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

                    const voiceChannel = await DiscordServer.channels.create({
                        name: DiscordChannel.name,
                        type: 2,
                        permissionOverwrites: [{
                            id: interaction.user.id,
                            allow: [Discord.PermissionsBitField.Flags.UseVAD, Discord.PermissionsBitField.Flags.Stream, Discord.PermissionsBitField.Flags.Speak, Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.Connect, Discord.PermissionsBitField.Flags.PrioritySpeaker]
                        }, {
                            id: userTicketID,
                            allow: [Discord.PermissionsBitField.Flags.UseVAD, Discord.PermissionsBitField.Flags.Stream, Discord.PermissionsBitField.Flags.Speak, Discord.PermissionsBitField.Flags.ViewChannel, Discord.PermissionsBitField.Flags.Connect]
                        }, {
                            id: DiscordServer.roles.everyone,
                            deny: [Discord.PermissionsBitField.Flags.ViewChannel]
                        }],
                        parent: categoria
                    });
                    const user = await client.users.fetch(userTicketID)

                    user.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor('#6E58C7')
                                .setTitle(`⚠・Nova notificação!`)
                                .setDescription(`O usuario ${interaction.user.username} criou um canal de voz para o seu ticket no servidor ${DiscordServer.name} entre no canal de voz e aguarde o responsavel, clique no botão abaixo para ser redirecionado! \n\n Protocolo do ticket: ${DiscordChannel.topic}`)
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('🎟・Ir para o canal de voz')
                                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id}`)
                                )
                        ]
                    })
                    DiscordChannel.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor('#6E58C7')
                                .setTitle(`⚠・Nova notificação!`)
                                .setDescription(`O usuario ${interaction.user.username} criou um canal de voz para o ticket!`)
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('🎟・Ir para o canal de voz')
                                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id}`)
                                )
                        ]
                    })

                    interaction.message.edit({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(embed.color)
                                .setTitle(embed.title)
                                .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                                .setDescription(embed.description)
                                .setFields(...embed.fields)
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setLabel('⏰・Notificar usuario')
                                        .setCustomId(`notifyTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Danger)
                                        .setLabel('❌・Fechar Ticket')
                                        .setCustomId(`closeTicket-${generateProtocol}`)
                                )

                        ],
                    })
                }


                if (interaction.customId && interaction.customId.includes('notifyTicket')) {
                    let serverData = await db.findOne({ colecao: 'servers', doc: interaction.guildId })
                    if (interaction && serverData) {
                        let userTicketID = DiscordChannel.topic.replace(/prot-\d+-/, '')

                        if (interaction.user.id == userTicketID) {
                            interaction.reply({ content: 'Você não pode usar essa função!', ephemeral: true })
                            return
                        }
                        const user = await client.users.fetch(userTicketID)
                        user.send({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor('#6E58C7')
                                    .setTitle(`⚠・Nova notificação!`)
                                    .setDescription(`O moderador ${interaction.user.username} está pedindo sua atenção no ticket que você criou no servidor ${DiscordServer.name}, clique no botão abaixo para ser redirecionado! \n\n Protocolo do ticket: ${DiscordChannel.topic}`)
                            ],
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(5)
                                            .setLabel('🎟・Ir para o Ticket')
                                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${interaction.channelId}`)
                                    )
                            ]
                        })
                        interaction.reply({ content: `O usuario ${user.username} foi notificado na dm!`, ephemeral: true })
                    } else {
                        interaction.reply({ content: "Erro ao executar o comando!", ephemeral: true })
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
            async function createTextContentFromObjects(objectsArray, prodName) {
                let prefieldArr = []
                await objectsArray.forEach(async (obj, index) => {
                    await obj.forEach((line, index2) => {
                        let prefield = { name: '\u200B', value: "" }
                        if (index == 0) {
                            prefield.name += `${prodName} : `
                        }
                        prefield.name += line.title
                        prefield.value += "``" + line.content + "``"
                        prefieldArr.push(prefield)
                    })
                });

                return prefieldArr;
            }


            const user = await client.users.fetch(params.userID);
            let fields = []
            for (let index = 0; index < carrinho.length; index++) {
                const element = carrinho[index];
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
                                            if (product.embendType == 0) {
                                                require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                                                    channelID: product.channel,
                                                    serverID: params.serverID,
                                                    productID: element.product,
                                                    edit: true
                                                })
                                            } else {
                                                require('../Discord/createProductMessage.js')(Discord, client, {
                                                    channelID: product.channel,
                                                    serverID: params.serverID,
                                                    productID: element.product,
                                                    edit: true
                                                })
                                            }

                                        })
                                    } else {
                                        if (product.embendType == 0) {
                                            require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                                                channelID: product.channel,
                                                serverID: params.serverID,
                                                productID: element.product,
                                                edit: true
                                            })
                                        } else {
                                            require('../Discord/createProductMessage.js')(Discord, client, {
                                                channelID: product.channel,
                                                serverID: params.serverID,
                                                productID: element.product,
                                                edit: true
                                            })
                                        }
                                    }

                                } catch (error) {

                                    if (product.embendType == 0) {
                                        require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                                            channelID: product.channel,
                                            serverID: params.serverID,
                                            productID: element.product,
                                            edit: true
                                        })
                                    } else {
                                        require('../Discord/createProductMessage.js')(Discord, client, {
                                            channelID: product.channel,
                                            serverID: params.serverID,
                                            productID: element.product,
                                            edit: true
                                        })
                                    }
                                }
                            }
                        }

                    } else {
                        refound()
                        return
                    }
                    let content = await createTextContentFromObjects(arrayCarrinhoProd, product.productName);
                    fields = [...fields, ...content]
                    product.estoque = estoqueData
                    serverData.products[productIndex] = product
                    await db.update('servers', serverData.id, {
                        products: serverData.products
                    })
                } catch (error) {
                    console.log(error);
                }
            }
            const dataHoraAtual = new Date();
            const dataHoraFormatada = `${String(dataHoraAtual.getDate()).padStart(2, '0')}/${String(dataHoraAtual.getMonth() + 1).padStart(2, '0')}/${dataHoraAtual.getFullYear()} ${String(dataHoraAtual.getHours()).padStart(2, '0')}:${String(dataHoraAtual.getMinutes()).padStart(2, '0')}:${String(dataHoraAtual.getSeconds()).padStart(2, '0')}`;




            try {
                const concatenatedString = await fields.map(obj => `${obj.value.replace(/``/g, '')}`).join('\n');
                const buffer = Buffer.from(concatenatedString, 'utf-8');
                const attachment = new Discord.AttachmentBuilder(buffer, { name: 'compras.txt' });
                function sendTxtMensage(target) {
                    target.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setTitle('📦 | Sua entrega chegou!')
                                .setDescription(`Abaixo estão os dados da sua entrega:`)
                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                        ],
                    })
                    target.send({ files: [attachment] }).catch(() => { });
                }
                let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
                const fetched = await findChannel.messages.fetch({ limit: 100 }).then(() => { }).catch(() => { });
                findChannel.bulkDelete(fetched).then(() => { }).catch(() => { })



                // if (fields.length >= 25) {
                sendTxtMensage(findChannel)
                sendTxtMensage(user)
                // } else {
                //     try {
                //         // dono.send({ files: [attachment] }).catch(()=>{});
                //         await user.send({
                //             embeds: [
                //                 new Discord.EmbedBuilder()
                //                     .setTitle('📦 | Sua entrega chegou!')
                //                     .setDescription(`Abaixo estão os dados da sua entrega:`)
                //                     .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`,})
                //                     .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                //                     .addFields(...fields)
                //                     .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                //             ],
                //         }).catch(() => {
                //             sendTxtMensage(user)
                //         })
                //         findChannel.send({
                //             embeds: [
                //                 new Discord.EmbedBuilder()
                //                     .setTitle('📦 | Sua entrega chegou!')
                //                     .setDescription(`Enviamos a entrega no seu privado caso não tenha recebido o seu privado pode esta bloqueado então tenha certeza de baixar os arquivos antes que o carrinho seja fechado`)
                //                     .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`})
                //                     .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                //                     .addFields(...fields)
                //                     .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                //             ],
                //             components: [
                //                 new Discord.ActionRowBuilder()
                //                     .addComponents(
                //                         new Discord.ButtonBuilder()
                //                             .setStyle(4)
                //                             .setLabel('Fechar carrinho')
                //                             .setCustomId('cancel')
                //                     )
                //             ],
                //         }).catch(() => {
                //             sendTxtMensage(findChannel)
                //         })
                //         // findChannel.send({ files: [attachment] }).catch(()=>{});


                //     } catch (error) {
                //         sendTxtMensage(findChannel)
                //         sendTxtMensage(user)
                //         sendTxtMensage(dono)
                //     }
                // }

                if ('saleLogs' in serverData && serverData.saleLogs.publicLog) {
                    try {
                        let findChannelPublic = DiscordServer.channels.cache.find(c => c.id === serverData.saleLogs.publicLog)
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
                                        .setLabel('📤・Produto')
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
                if ('saleLogs' in serverData && serverData.saleLogs.privateLog) {
                    let findChannelPrivate = DiscordServer.channels.cache.find(c => c.id === serverData.saleLogs.privateLog)
                    try {

                        findChannelPrivate.send({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(`Nova compra no servidor!`)
                                    .setDescription(`Abaixo estão os dados que foram entregues:`)
                                    .addFields(
                                        { name: '\u200B', value: '\u200B' },
                                        { name: 'Nome do usuario comprador', value: user.username, inline: true },
                                        { name: 'ID do usuario', value: user.id, inline: true },
                                        { name: 'ID da compra', value: findChannel.id },
                                        { name: 'Data e hora da compra', value: dataHoraFormatada },
                                        { name: '\u200B', value: '\u200B' },
                                    )
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                        })
                        findChannelPrivate.send({ files: [attachment] }).catch(() => { });
                    } catch (error) { }
                } else {
                    try {
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
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                        })
                        dono.send({ files: [attachment] }).catch(() => { });
                    } catch (error) {
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
                                    )
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                        })
                        sendTxtMensage(dono)
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