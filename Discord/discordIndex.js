const { json } = require('body-parser');
const db = require('../Firebase/models')
const stripe = require('stripe')(require('../config/web-config').stripe);
require('dotenv').config()
const { Payment, MercadoPagoConfig } = require('mercadopago');
const Discord = require("discord.js");
const mercadoPagoData = require('../config/mercadoPagoData.json');
const botConfig = require('../config/bot-config.js');
const { doc } = require('firebase/firestore');
const { default: firebase } = require('firebase/compat/app');
const { firestore } = require('firebase-admin');

const client = new Discord.Client({ intents: botConfig.intents })


client.login(botConfig.discordToken)



var paymentMetod = {}
var excludItemSec = {}
var carrinhos = {}
module.exports = (Discord, client) => {

    try {
        async function calcTaxa(price) {
            let valor = await parseInt(price)
            const paymentFee = Math.ceil(valor * 0.04 + 0.40);
            const netAmount = valor - paymentFee;
            return netAmount;
        }
        async function verifyExpireCart(guild, channel, user) {

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

        async function createRemoveEmbend(interaction, DiscordChannel, DiscordServer) {
            var fields = []
            for (let index = 0; index < carrinhos[interaction.user.id].length; index++) {
                const element = carrinhos[interaction.user.id][index];
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
                        .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/sdkapps' })
                        .setColor("#6E58C7")
                        .setThumbnail(`https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp`)
                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                ],
                components: [row, row2]
            })
        }
        client.on('interactionCreate', async (interaction) => {
            try {
                var DiscordServer = await client.guilds.cache.get(interaction.guildId);
                var DiscordChannel = await DiscordServer.channels.cache.get(interaction.channelId)
                // interacao do botao de compra de um produto
                if (interaction.customId.includes('comprar')) {
                    let server = await db.findOne({colecao:"servers",doc:interaction.guildId})
                    let product = await server.products.find(product => product.productID == interaction.customId.replace('comprar_', ''))
                    let findChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id)
                    if (!product || !server || product.estoque.length <= 0 ) {
                        await interaction.reply({content: `⚠️| O produto selecionado está sem estoque!`,ephemeral: true})
                        return
                    }
                    if (findChannel) {
                        if (!carrinhos[interaction.user.id]) {
                            interaction.reply({ content: 'O seu carrinho expirou vamos apaga-lo! Apos isso você poderá adicionar produtos ao seu novo carrinho! ', ephemeral: true })
                            await deleteExpiredCart(interaction.guildId, interaction, findChannel.id)
                            return
                        }
                        if (carrinhos[interaction.user.id].includes(interaction.customId.replace('comprar_', ''))) {
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            interaction.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor("#C21010")
                                        .setTitle(`⚠️| Este produto ja esta no seu carrinho!`)
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
                            return
                        } else {
                            carrinhos[interaction.user.id].push(interaction.customId.replace('comprar_', ''))
                        }
                        if (interaction.replied) {
                            interaction.deleteReply()
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
                        const newChannel = await DiscordServer.channels.create({
                            name: `🛒・Carrinho・${interaction.user.username}`,
                            type: 0,
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
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            await interaction.reply({
                                content: `🛒 | Criando o Carrinho...`,
                                ephemeral: true
                            })

                            setTimeout(() => {
                                interaction.editReply({
                                    content: ` `,
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor("#6E58C7")
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
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            return interaction.reply({ content: 'Não foi possivel criar o carrinho tente novamente!', ephemeral: true })
                        }
                        if (!carrinhos[interaction.user.id]) {
                            carrinhos[interaction.user.id] = []
                        }
                        if (carrinhos[interaction.user.id].includes(interaction.customId.replace('comprar_', ''))) {
                            if (interaction.replied) {
                                interaction.deleteReply()
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
                            return
                        } else {
                            carrinhos[interaction.user.id].push(interaction.customId.replace('comprar_', ''))
                        }
                        require('./createCartMessage')(Discord, client, {
                            serverID: interaction.guild.id,
                            user: interaction.user,
                            member: interaction.member,
                            channelID: await newChannel.id,
                            edit: false
                        })
                    }

                }
















                if (interaction.customId == 'payment') {
                    let userID = interaction.user.id
                    paymentMetod[userID] = interaction.values[0]
                    interaction.deferReply();
                    interaction.deleteReply();
                }

                if (interaction.customId.includes('confirm')) {
                    try {
                        if (!carrinhos[interaction.user.id]) {
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            await interaction.reply('Não foi encontrado nenhum produto nesse carrinho vamos deleta-lo!');
                            setTimeout(() => {
                                DiscordChannel.delete();
                            }, 6000);
                            return
                        }
                        if (!paymentMetod[interaction.user.id]) {
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            const sentMessage = await interaction.reply('Selecione algum metodo de pagamento primeiro!');
                            setTimeout(() => {
                                sentMessage.delete();
                            }, 8000);
                            return
                        }

                        let carrinho = carrinhos[interaction.user.id]
                        let paymentMetodUser = paymentMetod[interaction.user.id]
                        let serverData = await db.findOne({ colecao: "servers", doc: await interaction.guildId })
                        async function getLineItemsAndPrice(carrinho, server) {
                            let line_items = []
                            let total = 0
                            for (let index = 0; index < carrinho.length; index++) {
                                const element = carrinho[index];
                                let produto = await server.products.find(product => product.productID == element)
                                line_items.push({
                                    price: produto.priceID,
                                    quantity: 1,
                                })
                                total = total + parseInt(produto.price)
                            }
                            return {
                                lineItems: line_items,
                                total: total
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
                                    channelID: interaction.channelId
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
                            if (interaction.replied) {
                                interaction.deleteReply()
                            }
                            interaction.reply({
                                content: ` `,
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor("#6E58C7")
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
                                    notification_url: `${mercadoPagoData.notification_url}/mercadopago/webhook?userID=${interaction.user.id}&serverID=${interaction.guildId}&token=${serverData.bankData.mercadoPagoToken}&carrinhos=${JSON.stringify(carrinho)}`,
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
                                        **${cpc}**`)
                                                .setImage('attachment://qrcodepix.png')
                                                .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/sdkapps' })
                                                .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                                        ],
                                        components: [new Discord.ActionRowBuilder()
                                            .addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setCustomId('pixCancel')
                                                    .setLabel('Cancelar')
                                                    .setStyle('4')
                                            )],
                                        files: [attachment]

                                    })
                                }).catch((error) => {
                                    console.error(error);
                                    // Lidar com erros aqui
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
                    interaction.deferReply();
                    interaction.deleteReply();
                    require('./createCartMessage')(Discord, client, {
                        serverID: interaction.guild.id,
                        user: interaction.user,
                        member: interaction.member,
                        channelID: await DiscordChannel.id,
                        edit: true
                    })
                }

                if (interaction.customId == 'cancel') {
                    carrinhos[interaction.user.id] = null
                    paymentMetod[interaction.user.id] = null
                    
                    await DiscordChannel.delete()
                    let analytics = await db.findOne({colecao:'analytics', doc:interaction.guildId})
                    if (analytics && analytics.error == false) {
                        db.update('analytics',interaction.guildId,{
                            "vendas canceladas": parseInt( analytics["vendas canceladas"]) + 1
                        })
                    }
                }




                if (interaction.customId.includes('remove')) {
                    if (!carrinhos[interaction.user.id]) {
                        await DiscordChannel.delete()
                        return
                    }
                    interaction.deferReply();
                    interaction.deleteReply();
                    createRemoveEmbend(interaction, DiscordChannel, DiscordServer)


                }

                if (interaction.customId == 'exclud') {
                    let userID = interaction.user.id
                    if (excludItemSec[userID]) {
                        if (carrinhos[userID]) {
                            let indexToRemove = await carrinhos[userID].indexOf(excludItemSec[userID]);
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
                    interaction.deleteReply();
                }

                if (interaction.customId == 'back') {
                    interaction.deferReply();
                    interaction.deleteReply();
                    require('./createCartMessage')(Discord, client, {
                        serverID: interaction.guild.id,
                        user: interaction.user,
                        member: interaction.member,
                        channelID: await DiscordChannel.id,
                        edit: true
                    })
                }


            } catch (error) {

            }
        })
    } catch (error) {

    }
}


module.exports.carrinhos = carrinhos


module.exports.sendPaymentStatus = async (serverID,tentativas,dias) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: serverID })
        var DiscordServer = await client.guilds.cache.get(serverID);
        let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
        dono.send(`Faltam ${tentativas ? tentativas + " tentativas" : dias + " dias"} para expirar sua assinatura`)
        console.log('test');
    } catch (error) {
        console.log(error);
    }
}



module.exports.sendProductPayment = async (params, id,type) => {
    var DiscordServer = await client.guilds.cache.get(params.serverID);
    let findChannel = DiscordServer.channels.cache.find(c => c.topic === params.userID)
    let serverData = await db.findOne({ colecao: "servers", doc: params.serverID })
    if (DiscordServer && findChannel && serverData) {
        let carrinho = JSON.parse(params.carrinhos)
        let result = await new Promise((resolve, reject) => {
            const promises = carrinho.map(async (element) => {
                const produto = serverData.products.find(product => product.productID == element);
                if (!produto || produto.estoque.length <= 0) {
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

        if (result == true) {
            async function createTextContentFromObjects(objectsArray) {
                let textContent = '';

                await objectsArray.forEach(obj => {
                    textContent += `${obj.title}: ${obj.content}\n\n`;
                });

                return textContent;
            }

            async function sendTextBufferToDiscordChannel(objectsArray) {
                try {
                    const textContent = await createTextContentFromObjects(objectsArray);
                    const buffer = Buffer.from(textContent, 'utf-8');
                    return buffer
                } catch (error) {
                    console.error('Erro ao enviar arquivo para o Discord:', error);
                }
            }


            const user = await client.users.fetch(params.userID);
            let fields = []
            await carrinho.forEach(async (element, index) => {
                var product = await serverData.products.find(product => product.productID == element)
                var productIndex = await serverData.products.findIndex(product => product.productID == element)
                let estoqueData = await serverData.products[productIndex].estoque

                let buffer = await sendTextBufferToDiscordChannel(estoqueData[0].conteudo);
                fields.push({ attachment: buffer, name: `${product.productName}.txt` },)
                await estoqueData.splice(0, 1);
                product.estoque = estoqueData
                serverData.products[productIndex] = product

                db.update('servers', serverData.id, {
                    products: serverData.products
                })

            });
            const dataHoraAtual = new Date();
            const dataHoraFormatada = `${String(dataHoraAtual.getDate()).padStart(2, '0')}/${String(dataHoraAtual.getMonth() + 1).padStart(2, '0')}/${dataHoraAtual.getFullYear()} ${String(dataHoraAtual.getHours()).padStart(2, '0')}:${String(dataHoraAtual.getMinutes()).padStart(2, '0')}:${String(dataHoraAtual.getSeconds()).padStart(2, '0')}`;


            try {
                let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
                dono.send({
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
                                { name: '\u200B', value: '\u200B' }
                            )
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/sdkapps' })
                            .setColor("#6E58C7")
                            .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                    ],
                    files: fields
                }).catch(() => { })
                user.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle('📦 | Sua entrega chegou!')
                            .setDescription(`Abaixo estão os dados da sua entrega:`)
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/sdkapps' })
                            .setColor("#6E58C7")
                            .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                    ],
                    files: fields
                }).catch(() => { })
                const fetched = await findChannel.messages.fetch({ limit: 100 });
                findChannel.bulkDelete(fetched);
                findChannel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle('📦 | Sua entrega chegou!')
                            .setDescription(`Enviamos a entrega no seu privado caso não tenha recebido o seu privado pode esta bloqueado então tenha certeza de baixar os arquivos antes que o carrinho seja fechado`)
                            .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/sdkapps' })
                            .setColor("#6E58C7")
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
                    files: fields
                });

                let analytics = await  db.findOne({colecao:"analytics",doc:serverData.id})
                
                if (analytics && analytics.error == false) {
                    db.update('analytics',serverData.id,{
                        "pagamentos":{
                            "PIX": type == "pix" ? parseInt(analytics["pagamentos"]["PIX"]) + 1 : parseInt(analytics["pagamentos"]["PIX"]),
                            "card": type == "stripe" ? parseInt(analytics["pagamentos"]["card"]) + 1 : parseInt(analytics["pagamentos"]["card"]),
                            "boleto": 0,
                        },
                        "vendas completas": parseInt(analytics["vendas completas"]) + 1
                    })
                    
                }else{
                    let payment = {
                        "PIX": type == "pix" ? 1 : 0,
                        "card": type == "stripe" ? 1 : 0,
                        "boleto": 0,
                    }
                    db.create('analytics',serverData.id,{
                        "cancelados estoque": 0,
                        "pagamentos":payment,
                        "reebolsos": 0 ,
                        "vendas canceladas": 0,
                        "vendas completas":1
                    })
                }
            } catch (error) {
                console.log(error);
            }

        } else {
            await findChannel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(`${DiscordServer.name} | Reembolso`)
                        .setDescription(`Você Recebeu Reembolso porque alguem comprou primeiro!`)
                ]
            }).then(() => {
                setTimeout(() => {
                    try {
                        findChannel.delete()
                    } catch (error) {

                    }
                }, 10000);
            })
            if (type == 'pix') {
                try {
                    
                    await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
                        headers: {
                            Authorization: `Bearer ${params.token}`
                        }
                    })
                
                } catch (error) { }
            }else{
                try {
                    await stripe.refunds.create({
                        payment_intent: id,
                    });
                } catch (error) {
                    
                }
            }
            db.update('analytics',serverData.id,{
                "cancelados estoque": firestore.FieldValue.increment(1)
            })
        }
    }
}