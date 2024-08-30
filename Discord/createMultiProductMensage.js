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
        let serverDb = await db.findOne({ colecao: 'servers', doc: data.serverID })
        try {
            const fetched = await DiscordChannel.messages.fetch({ limit: 100 });
            await DiscordChannel.bulkDelete(fetched)
        } catch (error) {}
        let dburl = data.backGround ? await functions.discordDB(data.backGround,client,Discord,true) : null
        let dburl2 = data.logo ? await functions.discordDB(data.logo,client,Discord,true) : null
        if (data.logo) {
            try {
                fs.unlink(data.logo.path, (err) => {
                    if (err) {
                        console.error('Erro ao apagar o arquivo original:', err);
                        return { error: true, err: err }
                    } else {
                        return null
                    }
                });
            } catch (error) {
                
            }
        }

        let productsArrayOptions = []
        let productList = await data.productsList.split(',')
        for (let index = 0; index < productList.length; index++) {
            const element = await productList[index];
            let produto = await serverDb.products.find(product => product.productID == element)
            await productsArrayOptions.push(
                await new Discord.StringSelectMenuOptionBuilder().setLabel(produto.productName).setDescription(`${functions.formatarMoeda(produto.price)} • Estoque: ${produto.estoque.length}`).setValue(produto.productID)
            )
        }

        DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(data.productName)
                    .setDescription(data.producDesc)
                    .setColor('personalize' in serverDb && 'colorDest' in serverDb.personalize ? serverDb.personalize.colorDest : '#6E58C7')
                    .setTimestamp()
                    .setThumbnail(dburl2)
                    .setImage(dburl)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId('multSelectProduct')
                        .setPlaceholder('Selecione um produto!')
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(...productsArrayOptions)
                )
            ]
        })
        DiscordChannel.setTopic('multi')
    } catch (error) {
        console.log(error);
    }

};

