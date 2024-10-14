const db = require('../Firebase/models')
require('dotenv').config()
const path = require('path')
let Discord = require('discord.js')
const fs = require('fs');
const sharp = require('sharp');
const functions = require('../functions');

module.exports = async (Discord2, client, data) => {
    try {
        const DiscordServer = await client.guilds.cache.get(data.serverID);
        const DiscordChannel = await DiscordServer.channels.cache.get(data.channelID);

        if (data.edit == true) {
            try {
                const fetched = await DiscordChannel.messages.fetch({ limit: 100 });
                await DiscordChannel.bulkDelete(fetched)
            } catch (error) { }
        }

        let serverId = await data.serverID
        let serverDb = await db.findOne({ colecao: 'servers', doc: serverId })
        let produtos = await serverDb.products
        let productId = await data.productID

        var produto = await serverDb.products.find(product => product.productID == productId)
        var index = await serverDb.products.findIndex(product => product.productID == productId)
        let preco = await (produto.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let totalEstoque = []
        if (produto.estoque.length > 0) {
            let estoque = produto.estoque.length > 25 ? 25 : produto.estoque.length
            for (let index = 0; index < estoque; index++) {
                let indexSring1 = `${index + 1}`
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
        if (totalEstoque.length <= 0) {
            totalEstoque.push(new Discord.StringSelectMenuOptionBuilder().setLabel('Sem estoque').setValue('null').setDefault(true),)
        }
        let backGroundLink = null
        let logoLink = null
        backGroundLink = produto.backGround ? await functions.discordDB(produto.backGround, client, Discord) : null
        logoLink = produto.productLogo ? await functions.discordDB(produto.productLogo, client, Discord) : null


        let embed = await DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(produto.productName,)
                    .setDescription(produto.producDesc)
                    .setColor('personalize' in serverDb && 'colorDest' in serverDb.personalize ? serverDb.personalize.colorDest : '#6E58C7')
                    .setTimestamp()
                    .setFields({
                        name: 'Preço:',
                        value: '`` ' + preco.toString() + ' ``',
                        inline: true
                    }, {
                        name: "Estoque:",
                        value: '`` ' + produto.estoque.length.toString() + ' ``',
                        inline: true
                    })
                    .setThumbnail(logoLink)
                    .setImage(backGroundLink)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId(`quantidadeEdit_${data.productID}`)
                        .setLabel('Comprar')
                        .setEmoji(await require('./emojisGet').comprar)
                        .setStyle('3'),
                )
            ]
        });
        try {
            DiscordChannel.setTopic(data.productID)
            produto.mensageID = embed.id

            produtos[index] = produto;

            db.update('servers', data.serverID, {
                products: produtos
            })
        } catch (error) {
            console.log(error);
        }


    } catch (error) {
        console.log(error);
    }

};

