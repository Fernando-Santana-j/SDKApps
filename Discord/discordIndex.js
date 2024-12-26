const db = require('../Firebase/models')
const dataBase = require('../Firebase/db.js')
const stripe = require('stripe')(require('../config/web-config').stripe);
const { Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
const { Payment, MercadoPagoConfig } = require('mercadopago');
const Discord = require("discord.js");
const mercadoPagoData = require('../config/mercadoPagoData.json');
const botConfig = require('../config/bot-config.js');
const functions = require('../functions.js');
const client = new Discord.Client({ intents: botConfig.intents, shards: 'auto', })
var ncp = require("copy-paste");
const discordTranscripts = require('discord-html-transcripts');
const webConfig = require('../config/web-config');
client.login(botConfig.discordToken)





//Comandos Slash

require('./handler/commands.js')(client)

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.autocomplete(interaction, client);
        } catch (error) {
            console.error(error);
        }
    }

    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true }).then(() => { }).catch((err) => { })
            }
        }
    }
});





var paymentMetod = {}
var excludItemSec = {}
var carrinhos = {}
var sendProduct = {}
var preCarrinhos = {}
let ticketOptions = {}
let cupomOptions = {}
let paymentMCobranca = {}



// Mensagem de boas vindas
client.on('guildMemberAdd', async member => {
    let server = await db.findOne({ colecao: 'servers', doc: member.guild.id })
    if ('personalize' in server && 'antifake' in server.personalize) {
        let minDays = parseInt(server.personalize.antifake.antifakeDays)
        const currentDate = new Date();
        const accountCreationDate = member.user.createdAt
        let username = member.user.username
        let globalName = member.user.globalName
        let blockedNames = server.personalize.antifake.antifakeNames

        const accountAgeDays = Math.floor((currentDate - accountCreationDate) / (1000 * 60 * 60 * 24))

        function kickMember(member, text) {
            member.kick(text)
                .then(() => {
                    member.send(text)
                })
                .catch((err) => { });
        }
        if (accountAgeDays < minDays) {
            kickMember(member, `Sua conta foi expulsa do servidor ${member.guild.name} por ter sido criada muito recentemente.`)
        }
        if (blockedNames.includes(globalName) || blockedNames.includes(username)) {
            kickMember(member, `Sua conta foi expulsa do servidor ${member.guild.name} por ter um nome ou username proibido.`)
        }
    }

    if ('personalize' in server && 'welcomeMensage' in server.personalize && server.personalize.welcomeMensage.active == true) {
        let mensage = server.personalize.welcomeMensage.mensage
        let channel = await member.guild.channels.cache.get(server.personalize.welcomeMensage.channel)
        let buttons = server.personalize.welcomeMensage.buttons ? server.personalize.welcomeMensage.buttons : []
        if (mensage.includes('@@server')) {
            mensage = await mensage.replace('@@server', member.guild.name)
        }
        if (mensage.includes('@@username')) {
            mensage = await mensage.replace('@@username', member.user.username)
        }
        if (mensage.includes('@@globalname')) {
            mensage = await mensage.replace('@@globalname', `<@${member.user.id}>`)
        }
        let comp = {
            components: [new Discord.ActionRowBuilder()]
        }
        if (buttons.length > 0) {
            buttons.forEach((button, index) => {
                comp.components[0].addComponents(
                    new Discord.ButtonBuilder()
                        .setLabel(button.label ? button.label : `Botão ${index + 1}`)
                        .setURL(`https://discord.com/channels/${member.guild.id}/${button.channelID ? button.channelID : channel.id}`)
                        .setStyle(Discord.ButtonStyle.Link),
                )
            })
        }

        let welcomeMessage = await channel.send({
            content: mensage,
            ...comp
        })

        setTimeout(() => {
            try {
                welcomeMessage.delete()
            } catch (error) { }
        }, 60000)
    }
});

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
                    await interection.editReply({ content: 'O seu carrinho expirou vamos apaga-lo! \n Status: Carrinho apagado!', ephemeral: true })
                }
            } catch (error) {
                console.log(error);
            }
        }


        async function comprarFunction(productID, interaction) {
            try {
                let server = await db.findOne({ colecao: 'servers', doc: interaction.guildId })

                var product = await server.products.find(product => product.productID == productID)

                let quantidade = 1
                if (interaction.fields) {
                    try {
                        quantidade = interaction.fields.getTextInputValue('quantidadeText');
                    } catch (error) {
                        quantidade = 1
                    }
                }
                if (!product) {
                    return interaction.reply({ content: 'Não foi possivel encontrar esse produto.', ephemeral: true });
                }
                let estoqueNumber = 0
                let typeProduct = 'typeProduct' in product ? product.typeProduct : 'normal'
                switch (typeProduct) {
                    case 'single':
                        estoqueNumber = product.estoque
                        break;
                    case 'subscription':

                        break;
                    case 'multiple':

                        break;
                    case 'normal':
                        estoqueNumber = product.estoque.length
                        break;
                }
                if (!/^\d+$/.test(quantidade)) {
                    return interaction.reply({ content: 'Por favor, insira apenas números.', ephemeral: true });
                }

                if (estoqueNumber < parseInt(quantidade)) {
                    return interaction.reply({ content: `Valor inválido, o máximo que temos no estoque e ${estoqueNumber.toString()} selecione um valor abaixo disso!`, ephemeral: true });
                }

                var DiscordServer = await client.guilds.cache.get(interaction.guildId);
                var DiscordChannel = await DiscordServer.channels.cache.get(interaction.channelId);
                let findChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && c.name && c.name.includes('🛒・carrinho・'))
                if (server.vendasActive == false) {
                    await interaction.reply({
                        content: `⚠️| O vendedor desativou as vendas desse servidor!`,
                        ephemeral: true
                    })
                    return
                }
                if (server.botActive == false) {
                    await interaction.reply({
                        content: `⚠️| O vendedor desativou o bot desse servidor!`,
                        ephemeral: true
                    })
                    return
                }
                if (!product || server.error == true || estoqueNumber <= 0) {
                    await interaction.reply({
                        content: `⚠️| O produto selecionado está sem estoque!\n Clique no botão para receber um aviso no privado quando voltar o estoque!`,
                        components: [
                            new Discord.ActionRowBuilder().addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId(`solicitarStok_${productID}`)
                                    .setLabel('Solicitar estoque')
                                    .setEmoji(await require('./emojisGet').stock)
                                    .setStyle(Discord.ButtonStyle.Success),
                            ).addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId(`privateAviso_${productID}`)
                                    .setLabel('Receber aviso')
                                    .setEmoji(await require('./emojisGet').notice)
                                    .setStyle(Discord.ButtonStyle.Primary),
                            )
                        ],
                        ephemeral: true
                    })
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

                let cartChannelID = {
                    id: null,
                    edit: true
                }
                if (findChannel) {
                    if (!carrinhos[interaction.user.id]) {
                        interaction.reply({ content: 'O seu carrinho expirou vamos apaga-lo! Apos isso você poderá adicionar produtos ao seu novo carrinho! ', ephemeral: true })
                        await deleteExpiredCart(interaction.guildId, interaction, findChannel.id)
                        return
                    }
                    let findProductCart = await carrinhos[interaction.user.id].find(element => element.product == product.productID)
                    if (findProductCart) {
                        return interaction.reply({ content: 'Você já tem esse produto no carrinho! ', ephemeral: true })
                    }
                    cartChannelID = {
                        id: await findChannel.id,
                        edit: true
                    }
                    interaction.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor("#C21010")
                                .setTitle(`🛍| Adicionamos mais esse produto a seu carrinho!`)
                                .setDescription(`Você já tinha um carrinho criado, então adicionamos esse produto ao carrinho.`)
                        ],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('Ir para o Carrinho')
                                        .setEmoji(await require('./emojisGet').cart)
                                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${findChannel.id}`)
                                )
                        ],
                        ephemeral: true
                    })
                } else {
                    await interaction.reply({
                        content: `🛒 | Criando o Carrinho...`,
                        ephemeral: true
                    })
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
                        cartChannelID = {
                            id: await newChannel.id,
                            edit: false
                        }
                        await interaction.editReply({
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
                                            .setLabel('Ir para o Carrinho')
                                            .setEmoji(await require('./emojisGet').cart)
                                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${newChannel.id}`)
                                    )
                            ],
                            ephemeral: true
                        });
                        if ('personalize' in server && 'lembreteMensage' in server.personalize && server.personalize.lembreteMensage.active == true) {
                            let channelID = newChannel.id
                            let userID = interaction.user.id
                            setTimeout(async () => {
                                try {
                                    let discordChannelVerify = await DiscordServer.channels.cache.get(channelID)
                                    if (discordChannelVerify) {
                                        const userD = await client.users.fetch(userID)
                                        if (userD) {
                                            require('../Discord/discordIndex').sendDiscordMensageUser(userD, server.personalize.lembreteMensage.title, server.personalize.lembreteMensage.mensage, `https://discord.com/channels/${interaction.guild.id}/${discordChannelVerify.id}`, '🛒・Ir para o carrinho')
                                        }
                                    }
                                } catch (error) { }
                            }, 400000)
                            setTimeout(async () => {
                                try {
                                    let discordChannelDelete = await DiscordServer.channels.cache.get(channelID)
                                    if (discordChannelDelete) {
                                        await discordChannelDelete.delete()
                                        const userD = await client.users.fetch(userID)
                                        if (userD) {
                                            userD.send(`O seu ultimo carrinho no servidor ${DiscordServer.name} foi expirado!`)
                                        }
                                    }

                                } catch (error) { }
                            }, 600000)
                        }
                    } else {
                        return interaction.editReply({ content: '⚠ | Não foi possivel criar o carrinho tente novamente!', ephemeral: true })
                    }
                }

                if (!carrinhos[interaction.user.id]) {
                    carrinhos[interaction.user.id] = []
                }




                carrinhos[interaction.user.id].push({
                    product: product.productID,
                    quantidade: quantidade
                })
                require('./createCartMessage')(Discord, client, {
                    serverID: interaction.guild.id,
                    user: interaction.user,
                    member: interaction.member,
                    channelID: await cartChannelID.id,
                    edit: cartChannelID.edit
                })

            } catch (error) {
                console.log('ComprarFunctionError: ', error);

            }
        }




        //ticket
        client.on('messageCreate', async message => {
            try {
                var DiscordServer = await client.guilds.cache.get(message.guildId);
                var DiscordChannel = await DiscordServer.channels.cache.get(message.channelId)
                let server = await db.findOne({ colecao: "servers", doc: message.guildId })
                if (server && 'personalize' in server && 'react' in server.personalize) {
                    server.personalize.react.forEach(async (react) => {
                        if (react.channel == message.channel.id) {
                            if (react.emoji.includes(':')) {
                                const emoji = DiscordServer.emojis.cache.find(emoji => emoji.name == react.emoji.replace(/:/g, ""));
                                message.react(emoji).then(() => { }).catch(() => { });
                            } else {
                                message.react(react.emoji).then(() => { }).catch(() => { });
                            }
                        }
                    })
                }
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
                if (interaction.guildId) {
                    let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
                    if (serverData.botActive == false) {
                        await interaction.reply({
                            content: `⚠️| O vendedor desativou o bot desse servidor!`,
                            ephemeral: true
                        })
                        return
                    }
                }
                async function createRemoveEmbend() {
                    try {
                        var fields = []
                        let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
                        for (let index = 0; index < carrinhos[interaction.user.id].length; index++) {
                            const element = carrinhos[interaction.user.id][index].product;
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
                                    .setEmoji(require('./emojisGet.js').apagar)
                                    .setStyle('4'),
                            )
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('returnCard')
                                    .setLabel('Voltar')
                                    .setStyle(Discord.ButtonStyle.Danger)
                                    .setEmoji(require('./emojisGet.js').voltar)
                            )
                        await lastBotMessage.edit({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle('Selecione abaixo o item que deseja excluir!')
                                    .setDescription(`Clique em cancelar caso desista de excluir um item!`)
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
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

                // interacao do botao de compra de um produto
                if (interaction.customId && interaction.customId.includes('comprar')) {
                    comprarFunction(interaction.customId.replace('comprar_', ''), interaction)


                }

                if (interaction.customId && interaction.customId.includes('privateAviso')) {
                    let productID = await interaction.customId.replace('privateAviso_', '')
                    let server = await db.findOne({ colecao: "servers", doc: interaction.guildId })
                    let products = await server.products
                    let product = await products.find(product => product.productID == productID)
                    let productIndex = await await products.findIndex(product => product.productID == productID)
                    if (server && product) {
                        let estoqueAviso = []
                        if ('estoqueAviso' in product) {
                            estoqueAviso = product.estoqueAviso
                        }
                        if (estoqueAviso.includes(interaction.user.id)) {
                            await interaction.reply({
                                content: `Ok iremos te notificar quando o estoque voltar!`,
                                ephemeral: true
                            })
                            return
                        }
                        await estoqueAviso.push(interaction.user.id)
                        product.estoqueAviso = estoqueAviso
                        products[productIndex] = product
                        db.update('servers', interaction.guildId, {
                            products: products
                        })
                        await interaction.reply({
                            content: `Ok iremos te notificar quando o estoque voltar!`,
                            ephemeral: true
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


                if (interaction.customId && interaction.customId.includes('solicitarStok')) {

                    let productId = await interaction.customId.replace('solicitarStok_', '')
                    var DiscordServer = await client.guilds.cache.get(interaction.guildId);
                    let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
                    let server = await db.findOne({ colecao: 'servers', doc: interaction.guildId })
                    var product = await server.products.find(product => product.productID == productId)
                    dono.send(`O usuario ${interaction.user.globalName} solicitou o estoque para o produto ${product.productName}`)
                    interaction.reply({ content: 'A solicitação foi enviada para o vendedor!', ephemeral: true })
                }



                if (interaction.customId == 'paymentSelect') {
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
                    interaction.deferReply();

                    let buttonsRow = new Discord.ActionRowBuilder();
                    let serverData = await db.findOne({ colecao: 'servers', doc: interaction.guildId })
                    if ('bankData' in serverData && 'mercadoPagoToken' in serverData.bankData && serverData.bankData.mercadoPagoToken != '') {
                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId('confirm_pix')
                            .setLabel('Pix')
                            .setEmoji(require('./emojisGet.js').pix)
                            .setStyle(Discord.ButtonStyle.Secondary))
                    }
                    if ('bankData' in serverData && 'bankID' in serverData.bankData) {
                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId('confirm_card')
                            .setLabel('Cartão de crédito / debito')
                            .setEmoji(require('./emojisGet.js').card)
                            .setStyle(Discord.ButtonStyle.Secondary))

                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId('confirm_boleto')
                            .setLabel('Boleto')
                            .setEmoji(require('./emojisGet.js').boleto)
                            .setStyle(Discord.ButtonStyle.Secondary))
                    }

                    const message = await DiscordChannel.messages.fetch(interaction.message.id);
                    await message.edit({
                        embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setTitle(`Clique no método de pagamento desejado para concluir sua compra!`)],
                        components: [
                            buttonsRow,
                            new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder()
                                .setCustomId('returnCard')
                                .setLabel('Voltar')
                                .setEmoji(require('./emojisGet.js').voltar)
                                .setStyle(Discord.ButtonStyle.Secondary))


                        ]
                    });
                    interaction.deleteReply()
                }

                if (interaction.customId == 'returnCard') {
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
                    interaction.deferReply();
                    const message = await DiscordChannel.messages.fetch(interaction.message.id);
                    await message.edit({
                        embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setTitle(`Siga as etapas abaixo com os botões para concluir sua compra.`)],
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`editQuantidadeCart`)
                                        .setLabel('Editar quantidade')
                                        .setEmoji(await require('./emojisGet').editar)
                                        .setStyle(Discord.ButtonStyle.Primary)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`removeProduct`)
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

                        ]
                    });
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
                        let carrinho = carrinhos[interaction.user.id]
                        let paymentMetodUser = interaction.customId.replace('confirm_', '')
                        let serverData = await db.findOne({ colecao: "servers", doc: await interaction.guildId })
                        async function getLineItemsAndPrice(carrinho, server) {
                            let line_items = []
                            let total = 0
                            let isProduct1n = false
                            for (let index = 0; index < carrinho.length; index++) {
                                const element = carrinho[index];
                                let produto = await server.products.find(product => product.productID == element.product)
                                let price = parseInt(produto.price)

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
                                                .setLabel('Ir para o pagamento')
                                                .setEmoji(require('./emojisGet.js').redirect)
                                                .setURL(paymentLinkCard.url)
                                        )
                                ],
                                ephemeral: true
                            })

                        } else {
                            interaction.deferReply();

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
                                        action: 'produtoPay',
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
                                        files: [attachment],
                                        components: [new Discord.ActionRowBuilder()
                                            .addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setURL(`${webConfig.host}/copyText/${cpc}`)
                                                    .setLabel('Copiar Codigo')
                                                    .setEmoji(require('./emojisGet.js').copy)
                                                    .setStyle(Discord.ButtonStyle.Link),
                                            ).addComponents(
                                                new Discord.ButtonBuilder()
                                                    .setCustomId('returnCard')
                                                    .setLabel('voltar')
                                                    .setEmoji(require('./emojisGet.js').voltar)
                                                    .setStyle('4')
                                            )

                                        ]

                                    })
                                }).catch((error) => {
                                    console.error(error);
                                });
                            } catch (error) {
                                console.log(error);
                            }
                            interaction.deleteReply()
                        }

                    } catch (error) {
                        console.log(error);
                    }
                }

                if (interaction.customId == 'cartEditQuantidade') {
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

                    const modal = new Discord.ModalBuilder()
                        .setCustomId('cartEditQuantidadeModal')
                        .setTitle('Editar Quantidade');

                    modal.addComponents(
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('inputProductCart')
                                .setLabel("Insira o numero do produto que esta na lista!")
                                .setPlaceholder('Somente números, siga a lista dos produtos no carrinho!')
                                .setStyle(Discord.TextInputStyle.Short)
                                .setMinLength(1)
                                .setRequired(true)

                        ),
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('inputQuantidadeCart')
                                .setLabel("Insira a nova quantidade do produto!")
                                .setStyle(Discord.TextInputStyle.Short)
                                .setPlaceholder('Somente números!')
                                .setMinLength(1)
                                .setRequired(false)
                        )
                    );
                    await interaction.showModal(modal);

                }
                if (interaction.customId == 'cartEditQuantidadeModal') {
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
                    let produto = interaction.fields.getTextInputValue('inputProductCart');
                    let quantidade = interaction.fields.getTextInputValue('inputQuantidadeCart');
                    let server = await db.findOne({ colecao: 'servers', doc: interaction.guildId })

                    if (!/^\d+$/.test(produto)) {
                        return interaction.reply({ content: 'Por favor, insira apenas números no input de produto', ephemeral: true });
                    }
                    if (!/^\d+$/.test(quantidade)) {
                        return interaction.reply({ content: 'Por favor, insira apenas números no input de quantidade', ephemeral: true });
                    }
                    if (parseInt(produto) == 0 || parseInt(quantidade) == 0) {
                        return interaction.reply({ content: 'Por favor, insira um produto e uma quantidade válida', ephemeral: true });
                    }
                    if (parseInt(produto) > carrinhos[interaction.user.id].length) {
                        return interaction.reply({ content: `Valor inválido, o maximo que temos no carrinho e ${carrinhos[interaction.user.id].length.toString()} selecione um valor abaixo disso!`, ephemeral: true });
                    }

                    let product = await server.products.find(product => product.productID == carrinhos[interaction.user.id][parseInt(produto) - 1].product)


                    if (parseInt(quantidade) > product.estoque.length) {
                        return interaction.reply({ content: `Valor inválido, o maximo que temos no estoque e ${product.estoque.length.toString()} selecione um valor abaixo disso!`, ephemeral: true });
                    }

                    carrinhos[interaction.user.id][parseInt(produto) - 1].quantidade = quantidade

                    interaction.deferReply();
                    require('./createCartMessage')(Discord, client, {
                        serverID: interaction.guild.id,
                        user: interaction.user,
                        member: interaction.member,
                        channelID: await DiscordChannel.id,
                        edit: true
                    })
                    interaction.deleteReply()
                }
                if (interaction.customId == 'pixCancel') {
                    try {

                        if (carrinhos[interaction.user.id]) {
                            interaction.deferReply();
                            require('./createCartMessage')(Discord, client, {
                                serverID: interaction.guild.id,
                                user: interaction.user,
                                member: interaction.member,
                                channelID: await DiscordChannel.id,
                                edit: true
                            })
                            interaction.deleteReply()
                        } else {
                            await interaction.reply('Não foi encontrado nenhum produto nesse carrinho vamos deleta-lo!');
                            setTimeout(() => {
                                DiscordChannel.delete()
                            }, 6000);
                        }

                    } catch (error) {
                        console.log(error);
                    }
                }


                if (interaction.customId == 'cancelCart') {
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

                if (interaction.customId && interaction.customId.includes('removeProduct')) {
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
                    if (!semanaDaysServer) {
                        semanaDaysServer = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
                    }
                    let atend = serverData.ticketOptions.atend
                    const today = new Date();
                    const dayIndex = today.getDay();

                    let todayInArray = semanaDaysServer.includes(semanaDays[dayIndex])
                    const hora = `${today.getHours()}:${today.getMinutes()}`


                    function isTimeAfter(referenceTime, checkTime) {
                        try {
                            const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                            const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                            if (checkHours >= refHours) {
                                return true;
                            } else if (checkHours === refHours && checkMinutes > refMinutes) {
                                return true;
                            }
                            return false;
                        } catch (error) { }
                    }

                    function isTimeBefore(referenceTime, checkTime) {
                        try {
                            const [refHours, refMinutes] = referenceTime.split(":").map(Number);
                            const [checkHours, checkMinutes] = checkTime.split(":").map(Number);

                            if (checkHours <= refHours) {
                                return true;
                            } else if (checkHours === refHours && checkMinutes > refMinutes) {
                                return true;
                            }
                            return false;
                        } catch (error) {

                        }
                    }

                    let checkTimeBefore = isTimeBefore(atend.end, hora)
                    let checkTimeAfter = isTimeAfter(atend.start, hora)
                    if (checkTimeAfter == true && checkTimeBefore == true && todayInArray || !atend.start || !atend.end) {
                        // if (!ticketOptions[interaction.user.id] || !ticketOptions[interaction.user.id].motivo) {
                        //     interaction.reply({ content: "Adicione o motivo primeiro!", ephemeral: true })
                        //     return
                        // } else {

                        // let findChannel = DiscordServer.channels.cache.find(c => c.topic && c.topic.includes(interaction.user.id) && c.name && c.name.includes('🎫・Ticket・'))
                        // if (findChannel) {
                        //     interaction.reply({
                        //         embeds: [
                        //             new Discord.EmbedBuilder()
                        //                 .setColor("#C21010")
                        //                 .setTitle(`⚠️| Você já possui um ticket aberto!`)
                        //                 .setDescription(`Clique no botão abaixo para ir ate ele!`)
                        //         ],
                        //         components: [
                        //             new Discord.ActionRowBuilder()
                        //                 .addComponents(
                        //                     new Discord.ButtonBuilder()
                        //                         .setStyle(5)
                        //                         .setLabel('Ir para o Ticket')
                        //                         .setEmoji(await require('./emojisGet').ticket)
                        //                         .setURL(`https://discord.com/channels/${interaction.guild.id}/${findChannel.id}`)
                        //                 )
                        //         ],
                        //         ephemeral: true
                        //     })
                        // } else {
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
                        // }

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

                if (interaction.customId && interaction.customId == 'openModalAva') {
                    const modal = new Discord.ModalBuilder()
                        .setCustomId('modalAval')
                        .setTitle('Avaliar atendimento');

                    modal.addComponents(
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('avalNota')
                                .setLabel("Insira um valor de 1 a 5 para avaliar!")
                                .setPlaceholder('Somente números')
                                .setStyle(Discord.TextInputStyle.Short)
                                .setMaxLength(1)
                                .setRequired(true)

                        ),
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('avalMensage')
                                .setLabel("Insira uma mensagem sobre o seu atendimento!")
                                .setStyle(Discord.TextInputStyle.Paragraph)
                                .setRequired(false)
                        )
                    );
                    await interaction.showModal(modal);
                }
                if (interaction.customId == 'modalAval') {
                    let userInput = interaction.fields.getTextInputValue('avalNota');
                    const avalMensage = interaction.fields.getTextInputValue('avalMensage');
                    if (!/^\d+$/.test(userInput)) {
                        return interaction.reply({ content: 'Por favor, insira apenas números.', ephemeral: true });
                    }
                    if (userInput > 5) {
                        userInput = 5
                    }
                    try {
                        const channel = await client.channels.fetch(interaction.channelId);
                        const message = await channel.messages.fetch(interaction.message.id);
                        await message.edit({
                            components: []
                        });
                        try {
                            await message.edit({
                                embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Você ja avaliou esse ticket com ${starCount} estrelas, muito obrigado!`)],
                            });
                        } catch (error) {

                        }
                    } catch (error) { }
                    if (userInput <= 2) {
                        interaction.reply(`😢 | Sinto muito que sua experiência com o suporte não tenha sido boa, iremos trabalhar para melhorar cada vez mais 💖!`)
                    } else if (userInput == 3) {
                        interaction.reply(`💔 | Posso ver que o seu atendimento não foi perfeito, com sua avaliação e sua mensagem iremos ver oque precisamos melhorar 💫!`)
                    } else if (userInput >= 4) {
                        interaction.reply(`🥰 | Fico feliz que tenha tido uma boa experiência com o suporte, se lembre, caso tenha algum problema, não tenha medo de falar 🤗!`)
                    }
                    try {
                        let embed = interaction.message.embeds[0].data
                        let serverData = await db.findOne({ colecao: "servers", doc: embed.fields[3].value })
                        let DiscordServer2 = await client.guilds.cache.get(embed.fields[3].value)
                        var logChannel = await DiscordServer2.channels.cache.get(serverData.ticketOptions.log)
                        let userRespo = await client.users.fetch(embed.fields[1].value)
                        let starCount = userInput
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
                                    .setDescription(avalMensage && avalMensage.length > 1 ? 'Mensagem do usuario: ' + avalMensage : `O responsavel pelo ticket **${userRespo.globalName}** foi avaliado com ${starCount} estrelas no seu ultimo ticket!`)
                                    .setFields({ name: "💼 | Responsavel pelo ticket:", value: "**" + userRespo.username + "**", inline: true }, { name: "🆔 | ID do Responsavel:", value: "``" + userRespo.id + "``", inline: true }, { name: "🛍 | Nome do cliente:", value: "**" + interaction.user.username + "**", inline: false }, { name: "🆔 | ID do cliente:", value: "``" + interaction.user.id + "``", inline: true }, { name: "🌟 | Avaliação:", value: `${starIcons} | (${starCount}/5)`, inline: false }, { name: "📅 | Data:", value: "**" + dataFormatada + '**', inline: false })
                            ],
                        })

                    } catch (error) {
                        console.log(error);
                    }
                }

                if (interaction.customId && interaction.customId.includes('closeSingleProdTopic')) {
                    let userId = interaction.customId.replace('closeSingleProdTopic-', '')
                    console.log(interaction.guild.ownerId);

                    if (userId == interaction.user.id && interaction.guild.ownerId != interaction.user.id) {
                        return interaction.reply({ content: 'Você não tem permissão para fechar o tópico', ephemeral: true })
                    }
                    DiscordChannel.delete()
                }
                if (interaction.customId && interaction.customId.includes('closeTicket')) {
                    let protocolo = interaction.message.embeds[0].data.fields[0].value.replace(/`/g, "")
                    let userTicketID = protocolo.replace(/prot-\d+-/, '')
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
                                                        .setStyle(Discord.ButtonStyle.Success)
                                                        .setLabel('Avaliar')
                                                        .setEmoji(await require('./emojisGet').star)
                                                        .setCustomId('openModalAva')
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
                                                    .setLabel('Ir para o Ticket')
                                                    .setEmoji(await require('./emojisGet').ticket)
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

                    let protocolo = interaction.message.embeds[0].data.fields[0].value.replace(/`/g, "")
                    let userTicketID = protocolo.split('-')[2]
                    console.log(userTicketID);

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
                                        .setLabel('Ir para o Ticket')
                                        .setEmoji(await require('./emojisGet').ticket)
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
                                        .setLabel('Notificar usuario')
                                        .setEmoji(await require('./emojisGet').notify)
                                        .setCustomId(`notifyTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Primary)
                                        .setLabel('Criar canal de voz')
                                        .setEmoji(await require('./emojisGet').phone)
                                        .setCustomId(`voiceTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Danger)
                                        .setLabel('Fechar Ticket')
                                        .setEmoji(await require('./emojisGet').cancelar)
                                        .setCustomId(`closeTicket-${generateProtocol}`)
                                )

                        ],
                    })
                    interaction.reply(`Ticket assumido por: ${interaction.user.username}`)
                }


                if (interaction.customId && interaction.customId.includes('voiceTicket')) {
                    let protocolo = interaction.message.embeds[0].data.fields[0].value.replace(/`/g, "")
                    let userTicketID = protocolo.split('-')[2]

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
                                        .setLabel('Ir para o canal de voz')
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
                                        .setLabel('Ir para o canal de voz')
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
                                        .setLabel('Notificar usuario')
                                        .setEmoji(await require('./emojisGet').notify)
                                        .setCustomId(`notifyTicket-${generateProtocol}`)
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(Discord.ButtonStyle.Danger)
                                        .setLabel('Fechar Ticket')
                                        .setEmoji(await require('./emojisGet').cancelar)
                                        .setCustomId(`closeTicket-${generateProtocol}`)
                                )

                        ],
                    })
                }


                if (interaction.customId && interaction.customId.includes('notifyTicket')) {
                    let serverData = await db.findOne({ colecao: 'servers', doc: interaction.guildId })
                    if (interaction && serverData) {
                        let protocolo = interaction.message.embeds[0].data.fields[0].value.replace(/`/g, "")
                        let userTicketID = protocolo.split('-')[2]
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
                                            .setLabel('Ir para o Ticket')
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


                if (interaction.customId && interaction.customId.includes('cobrancaRecuse')) {
                    let userID = await interaction.customId.replace(`cobrancaRecuse_`)
                    userID = await userID.includes(`undefined`) ? userID.replace(`undefined`, ``) : userID
                    const user = await client.users.fetch(userID)
                    interaction.reply({ content: `Cobranca recusada!`, ephemeral: true })
                    user.send(`O usuario ${interaction.user.username} recusou sua ultima cobrança!`)
                    try {
                        const channel = await client.channels.fetch(interaction.channelId);
                        const message = await channel.messages.fetch(interaction.message.id);
                        await message.edit({
                            components: []
                        });
                        try {
                            await message.edit({
                                embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Você ja recusou essa cobrança!`)],
                            });
                        } catch (error) { }
                    } catch (error) { }
                }
                if (interaction.customId && interaction.customId.includes('paymentCobranca')) {
                    interaction.deferReply();
                    const channel = await client.channels.fetch(interaction.channelId);
                    const message = await channel.messages.fetch(interaction.message.id);
                    let buttonsRow = new Discord.ActionRowBuilder();
                    let serverData = await db.findOne({ colecao: 'servers', doc: message.embeds[0].data.fields[4].value })
                    if (serverData.error == true) {
                        return interaction.reply({ content: 'Erro ao executar o comando!', ephemeral: true })
                    }
                    if ('bankData' in serverData && 'mercadoPagoToken' in serverData.bankData && serverData.bankData.mercadoPagoToken != '') {
                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId((await interaction.customId.replace(`paymentCobranca`, 'cobrancaPayment')) + `_pix`)
                            .setLabel('Pix')
                            .setEmoji(require('./emojisGet.js').pix)
                            .setStyle(Discord.ButtonStyle.Secondary))
                    }
                    if ('bankData' in serverData && 'bankID' in serverData.bankData) {
                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId((await interaction.customId.replace(`paymentCobranca`, 'cobrancaPayment')) + '_card')
                            .setLabel('Cartão de crédito / debito')
                            .setEmoji(require('./emojisGet.js').card)
                            .setStyle(Discord.ButtonStyle.Secondary))

                        buttonsRow.addComponents(new Discord.ButtonBuilder()
                            .setCustomId((await interaction.customId.replace(`paymentCobranca`, 'cobrancaPayment')) + '_boleto')
                            .setLabel('Boleto')
                            .setEmoji(require('./emojisGet.js').boleto)
                            .setStyle(Discord.ButtonStyle.Secondary))
                    }

                    await message.edit({
                        components: [
                            buttonsRow,
                            new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder()
                                .setCustomId('returnCobranca')
                                .setLabel('Voltar')
                                .setEmoji(require('./emojisGet.js').voltar)
                                .setStyle(Discord.ButtonStyle.Secondary))


                        ]
                    });
                    interaction.deleteReply()
                }

                if (interaction.customId == 'returnCobranca') {
                    const channel = await client.channels.fetch(interaction.channelId);
                    const message = await channel.messages.fetch(interaction.message.id);
                    await message.edit({
                        components: [
                            new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`paymentCobranca_${message.embeds[0].data.fields[4].value}_${interaction.user.id}_${(message.embeds[0].data.fields[1].value).replace('R$', '').replace(',', '').trim()}`)
                                        .setLabel('Pagar')
                                        .setEmoji(await require('./emojisGet').comprar)
                                        .setStyle('3'),
                                )
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`cobrancaRecuse_${interaction.user.id}`)
                                        .setLabel('Cancelar')
                                        .setEmoji(await require('./emojisGet').cancelar)
                                        .setStyle('4')
                                )
                        ]
                    })
                }

                if (interaction.customId && interaction.customId.includes('cobrancaPayment')) {
                    let values = await interaction.customId.replace(`cobrancaPayment_`, '')
                    values = values.split(`_`)
                    let serverID = values[0]
                    let userID = values[1]
                    let valor = values[2]
                    let paymentMetod = values[3]
                    let serverData = await db.findOne({ colecao: `servers`, doc: serverID })
                    const user = await client.users.fetch(userID)

                    if (paymentMetod == 'card' || paymentMetod == 'boleto') {
                        let valueStripe = await valor < 100 ? 100 : valor
                        let isProduct1n = await valor < 100 ? true : false
                        const paymentLinkCard = await stripe.checkout.sessions.create({
                            payment_method_types: [paymentMetod],
                            line_items: [{
                                price_data: {
                                    currency: 'brl',
                                    product_data: {
                                        name: 'Cobrança Customizada',
                                    },
                                    unit_amount: valueStripe, // Valor em centavos, por exemplo, 2000 para $20.00
                                },
                                quantity: 1,
                            }],
                            metadata: {
                                action: 'cobrancaPay',
                                user: interaction.user.id,
                                userCobrador: userID,
                                serverID: serverID,
                                channelID: interaction.channelId,
                                mensageID: interaction.message.id,
                                valor: valueStripe

                            },
                            payment_intent_data: {
                                transfer_data: {
                                    amount: await calcTaxa(valueStripe),
                                    destination: await serverData.bankData.accountID,
                                },

                            },
                            mode: 'payment',
                            success_url: `${process.env.HOST}/redirect/sucess`,
                            cancel_url: `${process.env.HOST}/redirect/cancel`,
                        });
                        interaction.reply({
                            content: isProduct1n == true ? '⚠️ Sua cobrança foi feita por menos de 1 real porem para cartoes o minimo permitido e de 1 real entao esse valor foi alterado!' : '',
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setTitle(`💕 | Pagamento Criado!`)
                                    .setDescription(`<@${interaction.user.id}> **Acesse o link abaixo para fazer o pagamento da sua cobrança.**`)
                            ],
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(5)
                                            .setLabel('Ir para o pagamento')
                                            .setEmoji(await require('./emojisGet').comprar)
                                            .setURL(paymentLinkCard.url)
                                    )
                            ],
                            ephemeral: true
                        })

                    } else {
                        try {
                            interaction.deferReply();
                            const Mercadoclient = new MercadoPagoConfig({ accessToken: serverData.bankData.mercadoPagoToken, options: { timeout: 5000 } });
                            const payment = new Payment(Mercadoclient);
                            let numeroComPonto = valor / 100;
                            let amount = parseFloat(numeroComPonto.toFixed(2))
                            const body = {
                                transaction_amount: amount,
                                description: `cobranca do usuario - ${interaction.user.username}`,
                                payment_method_id: 'pix',
                                external_reference: interaction.user.id,
                                payer: mercadoPagoData.payer,
                                notification_url: `${mercadoPagoData.notification_url}/mercadopago/webhook?token=${serverData.bankData.mercadoPagoToken}`,
                                metadata: {
                                    user: interaction.user.id,
                                    userCobrador: userID,
                                    serverID: serverID,
                                    channelID: interaction.channelId,
                                    mensageID: interaction.message.id,
                                    valor: valor,
                                    action: 'cobrancaPay',
                                    token: serverData.bankData.mercadoPagoToken,
                                }
                            };

                            payment.create({ body }).then(async (response) => {
                                const cpc = response.point_of_interaction.transaction_data.qr_code
                                const buffer = Buffer.from(response.point_of_interaction.transaction_data.qr_code_base64, "base64");
                                const attachment = new Discord.AttachmentBuilder(buffer, { name: 'qrcodepix.png' })
                                const channel = await client.channels.fetch(interaction.channelId);
                                const lastBotMessage = await channel.messages.fetch(interaction.message.id);
                                lastBotMessage.edit({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setTitle('Pague o sua cobrança pelo qrcode ou pelo pix copiar e colar abaixo!')
                                            .setDescription(`Pix Copiar e Colar:
                                                    ${'**```' + cpc + '```**'}`)
                                            .setImage('attachment://qrcodepix.png')
                                    ],
                                    files: [attachment],
                                    components: [new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setURL(`${webConfig.host}/copyText/${cpc}`)
                                                .setLabel('Copiar Codigo')
                                                .setEmoji(require('./emojisGet.js').copy)
                                                .setStyle(Discord.ButtonStyle.Link),
                                        )

                                    ]

                                })
                                interaction.deleteReply()
                            }).catch((error) => {
                                console.error(error);
                            });
                        } catch (error) {
                            console.log(error)
                        }
                    }


                }




                if (interaction.customId && interaction.customId.includes('quantidadeEdit')) {
                    let productId = null
                    if (interaction.isButton()) {
                        productId = interaction.customId.replace('quantidadeEdit_', '')
                    } else if (interaction.isStringSelectMenu()) {
                        productId = interaction.values[0]
                    }

                    let serverDb = await db.findOne({ colecao: 'servers', doc: interaction.guildId })
                    var produto = await serverDb.products.find(product => product.productID == productId)
                    let estoqueNumber = 0
                    let typeProduct = 'typeProduct' in produto ? produto.typeProduct : 'normal'

                    switch (typeProduct) {
                        case 'single':
                            estoqueNumber = produto.estoque
                            break;
                        case 'subscription':

                            break;
                        case 'normal':
                            estoqueNumber = produto.estoque.length
                            break;
                    }
                    if (estoqueNumber <= 0) {
                        await interaction.reply({
                            content: `⚠️| O produto selecionado está sem estoque!\n Clique no botão para receber um aviso no privado quando voltar o estoque!`,
                            components: [
                                new Discord.ActionRowBuilder().addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`solicitarStok_${productId}`)
                                        .setLabel('Solicitar estoque')
                                        .setEmoji(await require('./emojisGet').stock)
                                        .setStyle(Discord.ButtonStyle.Success),
                                ).addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`privateAviso_${productId}`)
                                        .setLabel('Receber aviso')
                                        .setEmoji(await require('./emojisGet').notice)
                                        .setStyle(Discord.ButtonStyle.Primary),
                                )
                            ],
                            ephemeral: true
                        })
                        let analytics = await db.findOne({ colecao: "analytics", doc: interaction.guildId })

                        if (analytics.error == false) {
                            let canceladosEstoque = analytics['cancelados estoque']
                            await canceladosEstoque.push(await functions.formatDate(new Date()))
                            db.update('analytics', interaction.guildId, {
                                "cancelados estoque": canceladosEstoque
                            })
                        } else {
                            db.create('analytics', interaction.guildId, {
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

                    let findChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && c.name && c.name.includes('🛒・carrinho・'))


                    if (findChannel && !carrinhos[interaction.user.id]) {
                        interaction.reply({ content: 'O seu carrinho expirou vamos apaga-lo! Apos isso você poderá adicionar produtos ao seu novo carrinho! ', ephemeral: true })
                        return await deleteExpiredCart(interaction.guildId, interaction, findChannel.id)
                    }
                    let textT = `Editar quantidade do produto ${produto.productName}`
                    const modal = new Discord.ModalBuilder()
                        .setCustomId(`comprar_${productId}`)
                        .setTitle(textT.length > 44 ? textT.slice(0, 41) + '...' : textT)

                    modal.addComponents(
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.TextInputBuilder()
                                .setCustomId('quantidadeText')
                                .setLabel(`Insira a quantidade em numeros abaixo: `)
                                .setStyle(Discord.TextInputStyle.Short)
                                .setPlaceholder(`Estoque disponivel: ${estoqueNumber.toString()}`)
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
        let carrinho = carrinhos[params.userID]
        delete carrinhos[params.userID]
        let result = await new Promise(async (resolve, reject) => {
            for (let [chave, element] of Object.entries(carrinho)) {
                const produto = serverData.products.find(product => product.productID == element.product);
                let typeProduct = 'typeProduct' in produto ? produto.typeProduct : 'normal'
                switch (typeProduct) {
                    case 'single':
                        if (produto.estoque <= 0) {
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                        break;
                    case 'subscription':

                        break;
                    case 'multiple':

                        break;
                    case 'normal':
                        if (produto.estoque.length <= 0) {
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                        break;
                }
            }


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
                } catch (error) { }
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
        }

        if (result == true) {
            const user = await client.users.fetch(params.userID);
            let dono = DiscordServer.members.cache.get(DiscordServer.ownerId);
            let arrayItensTxt = []
            let numberProdsSingle = 0
            let numberProdsNormal = 0
            let productsName = []

            let products = serverData.products
            for (let index = 0; index < carrinho.length; index++) {
                const element = carrinho[index];
                var product = await products.find(product => product.productID == element.product)
                var productIndex = await products.findIndex(product => product.productID == element.product)
                const requestedQuantity = parseInt(element.quantidade) <= 0 ? 1 : parseInt(element.quantidade);
                let typeProduct = 'typeProduct' in product ? product.typeProduct : 'normal'
                productsName.push(`${product.productName} - ${element.quantidade}x`);


                if (typeProduct == 'single') {
                    try {
                        numberProdsSingle += 1
                        let productSingleChannel = DiscordServer.channels.cache.find(c => c.topic === element.product)
                        let thread = await productSingleChannel.threads.create({
                            name: `Recebimento manual, ${user.username}`,
                            type: 12,
                            invitable: false,
                            reason: `Recebimento de produto ${product.productName} para o usuario ${user.username}`,
                        });
                        thread.send({
                            content: `|| <@${user.id}> || || <@${dono.id}> ||  \n Aguarde ate o recebimento do produto os responsaveis ja foram notificados!`,
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(Discord.ButtonStyle.Danger)
                                            .setEmoji(await require('./emojisGet').apagar)
                                            .setLabel('Fechar topico')
                                            .setCustomId(`closeSingleProdTopic-${user.id}`)
                                    )
                            ]
                        })
                        await user.send({
                            content: `Foi criado um topico para o recebimento do produto ${product.productName} no canal do produto!`,
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(Discord.ButtonStyle.Link)
                                            .setLabel('Ir para o topico')
                                            .setURL(`https://discord.com/channels/${DiscordServer.id}/${thread.id}`)
                                    )
                            ]
                        })
                        await findChannel.send({
                            content: `Foi criado um topico para o recebimento do produto ${product.productName} no canal do produto!`,
                            components: [
                                new Discord.ActionRowBuilder()
                                    .addComponents(
                                        new Discord.ButtonBuilder()
                                            .setStyle(Discord.ButtonStyle.Link)
                                            .setLabel('Ir para o topico')
                                            .setURL(`https://discord.com/channels/${DiscordServer.id}/${thread.id}`)
                                    )
                            ]
                        })

                        product.estoque -= 1
                    } catch (error) {
                        console.log('SendProductSingleERROR', error);
                        return refound();
                    }
                    
                    
                }

                if (typeProduct == 'normal') {
                    try {
                        numberProdsNormal += 1
                        let itensCortados = await product.estoque.splice(0, requestedQuantity)
                        let itens = itensCortados.map(item => item.conteudo)
                        itens.forEach(item => {
                            arrayItensTxt.push(item[0].content)
                        })
                    } catch (mainError) {
                        console.log('SendProductNormalERROR', mainError)
                        return refound();
                    }
                }

                products[productIndex] = product
                await db.update('servers', serverData.id, {
                    products: products
                })

                try {
                    const messageCreator = require(`../Discord/create${product.embendType == 1 ? 'ProductMessage' : 'ProductMessageEmbend'}.js`);
                    await messageCreator(Discord, client, {
                        channelID: product.channel,
                        serverID: serverData.id,
                        productID: product.productID,
                        edit: true
                    });
                } catch (error) {
                    console.log(error);
                }
            }

            console.log('arrayItensTxt', arrayItensTxt);

            const dataHoraAtual = new Date();
            const dataHoraFormatada = `${String(dataHoraAtual.getDate()).padStart(2, '0')}/${String(dataHoraAtual.getMonth() + 1).padStart(2, '0')}/${dataHoraAtual.getFullYear()} ${String(dataHoraAtual.getHours()).padStart(2, '0')}:${String(dataHoraAtual.getMinutes()).padStart(2, '0')}:${String(dataHoraAtual.getSeconds()).padStart(2, '0')}`;




            try {
                if (arrayItensTxt.length > 0) {
                    let productText = await productsName.join('\n');

                    const concatenatedString = await arrayItensTxt.join('\n');
                    const buffer = Buffer.from(concatenatedString, 'utf-8');
                    const attachment = new Discord.AttachmentBuilder(buffer, { name: 'compras.txt' });
                    function sendTxtMensage(target) {
                        try {
                            target.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle('💫 | Sua entrega chegou!')
                                        .setDescription(`Abaixo estão os dados da sua entrega:`)
                                        .setFields(
                                            {
                                                name: "📦 | Produto(s) Comprado(s):", value: '```' + productText + '```'
                                            },
                                            {
                                                name: "💖 | Muito obrigado por comprar conosco!", value: `${DiscordServer.name} agradece o seu carinho!`
                                            },
                                        )
                                        .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                                ],
                            })
                            target.send({ files: [attachment] }).catch(() => { });
                        } catch (error) {
                            console.log('Produtos:', concatenatedString);
                        }
                    }

                    const fetched = await findChannel.messages.fetch({ limit: 100 }).then(() => { }).catch(() => { });
                    findChannel.bulkDelete(fetched).then(() => { }).catch(() => { })

                    sendTxtMensage(findChannel)
                    sendTxtMensage(user)
                }

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
                                        .setLabel('Ir para o produto')
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
                                        {
                                            name: "📦 | Produto(s) Comprado(s):", value: '```' + productText + '```'
                                        },
                                        { name: 'Data e hora da compra', value: dataHoraFormatada },
                                        { name: '\u200B', value: '\u200B' },
                                    )
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                        })
                        findChannelPrivate.send({ files: [attachment] }).catch(() => { });
                    } catch (error) {

                        console.log('Produtos:', arrayItensTxt);
                    }
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
                                    )
                                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                    .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                            ],
                        })
                        sendTxtMensage(dono)
                    } catch (error) {
                        console.log('Produtos:', arrayItensTxt);

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
                carrinhos[params.userID] = []
            } catch (error) {
                console.log(error);
                console.log(arrayItensTxt);
            }
            try {
                if ('personalize' in serverData && 'feedbackChannel' in serverData.personalize) {
                    setTimeout(async () => {
                        user.send({
                            content: `Ola, <@${user.id}>, Vimos que comprou um produto recentemente no servidor ${DiscordServer.name}, pedimos para deixar um comentário no nosso canal de feedback!`,
                            components: [new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setStyle(5)
                                        .setLabel('Deixe o seu feedback')
                                        .setEmoji(await require('./emojisGet').star)
                                        .setURL(`https://discord.com/channels/${DiscordServer.id}/${serverData.personalize.feedbackChannel}`)
                                )]
                        }).then(() => { }).catch(() => { })
                    }, 400000)

                }
            } catch (error) { }

            if (numberProdsNormal == 0 && numberProdsSingle > 0) {
                console.log(1);
                
                setTimeout(async () => {
                    try{
                        findChannel.delete()
                    } catch (error) {
                        console.log(error);
                        
                    }   
                },5000)
            }else{
                console.log(2);
                
                setTimeout(async () => {
                    try{
                        findChannel.delete()
                    } catch (error) {

                    }   
                },600000)
            }

        } else {
            refound()
        }
    }
}



module.exports.sendDiscordMensageChannel = async (server, channel, title, mensage, user, deleteChannel = false, tumbnail = '', banner = '', serverName = true, buttonRef, buttonLabel) => {
    try {
        let serverData = await db.findOne({ colecao: 'servers', doc: server })
        var DiscordServer = await client.guilds.cache.get(server);
        var DiscordChannel
        if (user) {
            DiscordChannel = DiscordServer.channels.cache.find(c => c.topic === user)
        } else {
            DiscordChannel = await DiscordServer.channels.cache.get(channel)
        }
        let comp = null
        if (buttonRef) {
            comp = {
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel(buttonLabel)
                            .setURL(buttonRef)
                            .setStyle(Discord.ButtonStyle.Link),
                    )
                ]
            }
        }
        let embend = new Discord.EmbedBuilder()
            .setTitle(serverName == true ? `${DiscordServer.name} | ${title}` : title)
            .setDescription(mensage)
            .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
        if (tumbnail) {
            embend.setThumbnail(tumbnail)
        }
        if (banner) {
            embend.setImage(banner)
        }
        await DiscordChannel.send({
            embeds: [embend],
            ...comp
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

module.exports.sendDiscordMensageUser = async (user, title, mensage, buttonRef, buttonLabel,) => {
    try {
        const userF = await client.users.fetch(user);
        let comp = null
        if (buttonRef) {
            comp = {
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel(buttonLabel)
                            .setURL(buttonRef)
                            .setStyle(Discord.ButtonStyle.Link),
                    )
                ]
            }
        }
        await userF.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(title)
                    .setDescription(mensage)
                    .setColor('#6E58C7')
            ],
            ...comp
        }).catch((err) => {
            console.log(err);
        })
    } catch (error) {
        console.log('sendDiscordMensageUserERROR: ', error);
    }
}



module.exports.client = client

