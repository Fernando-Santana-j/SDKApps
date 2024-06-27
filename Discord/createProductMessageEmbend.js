const db = require('../Firebase/models')
require('dotenv').config()
const path = require('path')
let Discord = require('discord.js')
const fs = require('fs');
const sharp = require('sharp');

module.exports = async (Discord2, client, data) => {
    try {
        const DiscordServer = await client.guilds.cache.get(data.serverID);
        const DiscordChannel = await DiscordServer.channels.cache.get(data.channelID);

        if (data.edit == true ) {
            try {
                const fetched = await DiscordChannel.messages.fetch({ limit: 100 });
                await DiscordChannel.bulkDelete(fetched)
            } catch (error) {}
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
                }else{
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
        let dburl = null
        let Newdbres = null
        if (produto.backGround) {
            const bannerPath = path.join(__dirname, "..",  produto.backGround);
            let file = await fs.readFileSync(bannerPath);
            let buffer = Buffer.from(file, 'binary');
            let newBuffer = await sharp(buffer).jpeg().toBuffer()
            const attachment = new Discord.AttachmentBuilder(newBuffer, { name: 'test.jpg' });
            let dbBannerDiscordServer = await client.guilds.cache.get('1246186853241978911')
            let dbBannerDiscordChannel = await dbBannerDiscordServer.channels.cache.get('1253279027662426142')
            let dbres = await dbBannerDiscordChannel.send({
                files: [attachment]
            })
            Newdbres = dbres
            dburl = await dbres.attachments.first().url
        }
        let dburl2 = null
        let Newdbres2 = null
        if (produto.productLogo) {
            const bannerPath = path.join(__dirname, "..",  produto.productLogo);
            let file = await fs.readFileSync(bannerPath);
            let buffer = Buffer.from(file, 'binary');
            let newBuffer = await sharp(buffer).jpeg().toBuffer()
            const attachment = new Discord.AttachmentBuilder(newBuffer, { name: 'test.jpg' });
            let dbBannerDiscordServer = await client.guilds.cache.get('1246186853241978911')
            let dbBannerDiscordChannel = await dbBannerDiscordServer.channels.cache.get('1253279027662426142')
            let dbres = await dbBannerDiscordChannel.send({
                files: [attachment]
            })
            Newdbres2 = dbres
            dburl2 = await dbres.attachments.first().url
        }
        let embed = await DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(produto.productName,)
                    .setDescription(produto.producDesc)
                    .setColor('personalize' in serverDb && 'colorDest' in serverDb.personalize ? serverDb.personalize.colorDest : '#6E58C7')
                    .setTimestamp()
                    .setFields({
                        name:'Preço:',
                        value:preco.toString(),
                        inline:true
                    },{
                        name:"Estoque:",
                        value: produto.estoque.length.toString(),
                        inline:true
                    })
                    .setThumbnail('personalize' in serverDb && 'iconProduct' in serverDb.personalize ? serverDb.personalize.iconProduct == true ? dburl2 : null : dburl2)
                    .setImage(dburl)
                    .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
            ],
            components: [
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId(`qntProduct_${data.productID}`)
                        .setPlaceholder('Selecione a quantidade!')
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(...totalEstoque)
                        .setDisabled(produto.estoque.length <= 0 ? true : false)
                ),
                new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId(`comprar_${data.productID}`)
                        .setLabel('Comprar')
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

