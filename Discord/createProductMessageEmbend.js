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

        let backGroundLink = produto.backGround ? await functions.discordDB(produto.backGround, client, Discord) : null
        let logoLink = produto.productLogo ? await functions.discordDB(produto.productLogo, client, Discord) : null


        let components = []
        let typeProduct = 'typeProduct' in produto ? produto.typeProduct : 'normal'
        if (typeProduct == 'multiple') {
            let productsArrayOptions = []
            let productList = produto.multipleProducts
            for (let index = 0; index < productList.length; index++) {
                const element = await productList[index];
                let produto = await serverDb.products.find(product => product.productID == element)
                await productsArrayOptions.push(
                    await new Discord.StringSelectMenuOptionBuilder().setLabel(produto.productName).setDescription(`${functions.formatarMoeda(produto.price)} • Estoque: ${'typeProduct' in produto ? produto.typeProduct == 'normal' ? produto.estoque.length : produto.estoque : produto.estoque.length}`).setValue(produto.productID)
                )
            }
            components = [await new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId(`quantidadeEdit_${data.productID}`)
                    .setOptions(productsArrayOptions)
            )]
        }else{
            components = [new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`quantidadeEdit_${data.productID}`)
                    .setLabel('Comprar')
                    .setEmoji(await require('./emojisGet').comprar)
                    .setStyle('3'),
            )]
        }
        let fields  = [
            
        ]
        
        if (typeProduct != 'multiple') {
            
            let estoqueNumber = typeProduct == 'single' ? produto.estoque : produto.estoque ?  produto.estoque.length : 0 
            fields.push({
                name: 'Estoque:',
                value: '`` ' + estoqueNumber + ' ``',
                inline: true
            },{
                name: 'Preço:',
                value: '`` ' + preco.toString() + ' ``',
                inline: true
            },)
        }
        let embed = await DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(produto.productName,)
                    .setDescription(produto.producDesc)
                    .setColor('personalize' in serverDb && 'colorDest' in serverDb.personalize ? serverDb.personalize.colorDest : '#6E58C7')
                    .setTimestamp()
                    .setFields(...fields)
                    .setThumbnail(logoLink)
                    .setImage(backGroundLink)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: components
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

