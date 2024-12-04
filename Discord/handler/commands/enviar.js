let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enviar')
        .setDescription('Envie um produto para um usuario!')
        .addStringOption(option =>
            option.setName('produto')
                .setDescription('Selecione o produto que deseja enviar!')
                .setAutocomplete(true)
                .setRequired(true)
                .setMinLength(1)
        )
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Selecione o usuario que deseja enviar o produto!')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setRequired(false)
                .setDescription('Quantidade de produtos que sera enviada!')
        )
        .addStringOption(option=>
            option.setName('titulo')
            .setDescription('Digite um titulo personalizado para o envio!')
            .setRequired(false)
            // .setChoices({
            //     name:'Titulo padrão ',value:`✉ | Você recebeu um produto!`
            // },)
            .setMinLength(1)
        )
        .addStringOption(option=>
            option.setName('mensagem')
            .setDescription('Digite uma mensagem personalizado para o envio!')
            .setRequired(false)
            // .setChoices({
            //     name:'Mensagem padrão',value:`🛍 | Você recebeu um novo produto de @@usersend!`
            // },)
            .setMinLength(1)
        ).addAttachmentOption(option=>
            option.setName('banner')
            .setDescription('Selecione um banner personalizado para o envio!')
            .setRequired(false)
        ),
    async execute(interaction, client) {
        let quantidade = await interaction.options.getInteger('quantidade') ? await interaction.options.getInteger('quantidade') :  1
        let serverData = await db.findOne({ colecao: `servers`, doc: await interaction.guildId })
        var DiscordServer = await client.guilds.cache.get(interaction.guild.id);
        let produto = await interaction.options.getString('produto')
        let user = await interaction.options.getUser('usuario')
        let titulo = await interaction.options.getString('titulo') ? await interaction.options.getString('titulo') : `✉ | Você recebeu um produto!`
        let mensagem = await interaction.options.getString('mensagem') ? await interaction.options.getString('mensagem') : `🛍 | Você recebeu um novo produto de @@usersend!`
        let attachmentURL = await interaction.options.getAttachment('banner') ? await interaction.options.getAttachment('banner').url : null
        let SendUser = await client.users.fetch(interaction.user.id);
       
        titulo = await titulo.replaceAll('@@server', serverData.name)
        mensagem = await mensagem.replaceAll('@@server', serverData.name)
        titulo = await titulo.replaceAll('@@user', user.username)
        mensagem = await mensagem.replaceAll('@@user', user.username)
        titulo = await titulo.replaceAll('@@usersend', SendUser.username)
        mensagem = await mensagem.replaceAll('@@usersend', SendUser.username)

        let verifyPermissions = await functions.verifyPermissions(interaction.user.id, interaction.guildId, Discord, client)
        if (verifyPermissions.error == false && verifyPermissions.perms.commands == true) {
            if (serverData && serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }

            if (serverData && user && DiscordServer && produto) {
                var product = await serverData.products.find(product => product.productID == produto)
                if (!product) {
                    return interaction.reply({content:'Esse não e um produto valido!', ephemeral:true})
                }
                var productIndex = await serverData.products.findIndex(product => product.productID == produto)
                let estoqueData = await serverData.products[productIndex].estoque
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
                            serverData.products[productIndex] = product
                            db.update('servers', interaction.guild.id, {
                                products: serverData.products
                            })
                        }
                        const concatenatedString = await fields.map(obj => `${obj.value.replace(/`/g, '')}`).join('\n');
                        const buffer = Buffer.from(concatenatedString, 'utf-8');
                        const attachment = new Discord.AttachmentBuilder(buffer, { name: 'compras.txt' });
                        try {
                            await user.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(titulo)
                                        .setDescription(mensagem)
                                        .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                        .setFields({ name: '\u200B', value: '\u200B' },{
                                            name: '🛍️ | Nome do produto: ',
                                            value: '``' + product.productName +'``',
                                            inline:true
                                        }, {
                                            name: '🖥 | Nome do servidor: ',
                                            value: '``' + DiscordServer.name + '``',
                                            inline:true
                                        },{
                                            name: '🧬 | ID do usuario: ',
                                            value: '``' + SendUser.id + '``',
                                            inline:true
                                        },)
                                        .setImage(attachmentURL)
                                        .setTimestamp()
                                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                ],
                            })
                            user.send({ files: [attachment] })
                        } catch (error) {
                            console.log(error);
                            interaction.reply({ content: 'Não foi possivel enviar a mensagem privado do usuario selecionado ele pode ter bloqueado o privado!', ephemeral: true })
                            return
                        }
                        try {
                            interaction.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(`✅ | Produto enviado!`)
                                        .setDescription(`Você enviou um produto para ${user.globalName}, foi enviado em seu privado uma copia do arquivo que o usuario recebeu!`)
                                        .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                                        .setTimestamp()
                                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp  ` })
                                ],
                                ephemeral: true
                            })
                        } catch (error) {
                            console.log(error);
                        }
                        try {
                            SendUser.send({
                                content: `Copia do ultimo produto (${product.productName}) enviado para o usuario ${user.globalName}:`,
                                files: [attachment]
                            })
                        } catch (error) {
                            console.log(error);
                            interaction.reply({ content: 'Não foi possivel enviar a copia no seu privado ele pode estar bloqueado', ephemeral: true })
                            return
                        }
                        if (product.embendType == 0) {
                            require('../../createProductMessageEmbend.js')(Discord, client, {
                                channelID: product.channel,
                                serverID: interaction.guildId,
                                productID: product.productID,
                                edit: true
                            })
                        } else {
                            require('../../createProductMessage.js')(Discord, client, {
                                channelID: channelID,
                                serverID: serverID,
                                productID: product.productID,
                                edit: true
                            })
                        }

                        db.update('servers', interaction.guild.id, {
                            products: serverData.products
                        })
                        
                    } else {
                        interaction.reply({ content: 'Falta de estoque!', ephemeral: true })
                    }
                } else {
                    interaction.reply({ content: 'Erro ao recuperar o produto!', ephemeral: true })
                }
            } else {
                interaction.reply({ content: 'Não foi possivel recuperar os dados do servidor!', ephemeral: true })
            }
        } else {
            interaction.reply({ content: 'Você não tem permissão para enviar comandos', ephemeral: true })
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


