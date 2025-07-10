const db = require('../Firebase/models')
require('dotenv').config()
let Discord = require('discord.js')
const functions = require('../functions');


module.exports = async (client = require("./discordIndex").client, data) => {
    let promise = new Promise(async (resolve, reject) => {
        try {
            const DiscordServer = await client.guilds.cache.get(data.serverID);
            const DiscordChannel = await DiscordServer.channels.cache.get(data.channelID);

            if (data.clean == true) {
                try {
                    const fetched = await DiscordChannel.messages.fetch({ limit: 100 });
                    const messagesToDelete = fetched.filter(
                        (msg) => !msg.hasThread && !msg.system
                    );
                    await DiscordChannel.bulkDelete(messagesToDelete, true)
                } catch (error) { }
            }


            var produto = data.product
            let preco = await (produto.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            let backGroundLink = data.discordProd.selectedFields.includes('image') ? await functions.discordDB(produto.background, client, Discord,false) : null
            let logoLink = null
            let logoActive = 'logoActive' in produto ? produto.logoActive : false

            if (produto.logo && logoActive == true) {
                logoLink = await functions.discordDB(produto.logo, client, Discord)
            } else {
                logoLink = null
            }


            let components = []
            let fields = []
            let showName = false
            let showDesc = false

            await data.discordProd.selectedFields.forEach( async element => {
                switch (element) {
                    case "price":
                        fields.push({
                            name: 'Preço:',
                            value: '`` ' + preco.toString() + ' ``',
                            inline: true
                        })
                        break;
                    case "stock":
                        let stockNumber = produto.type == 'normal' ? produto.stock.stockItems.length : produto.stock.stockAmount
                        fields.push({
                            name: 'Estoque:',
                            value: '`` ' + stockNumber + ' ``',
                            inline: true
                        })
                        break;
                    case "rating": 
                        fields.push({
                            name: 'Avaliação:',
                            value: '`` 0/5 ``',
                            inline: true
                        })
                        break;
                    case "name":
                        showName = true
                        break;
                    case "description":
                        showDesc = true
                        break;
                }
            });

            let message = await DiscordChannel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(showName == true ? produto.name : null)
                        .setDescription(showDesc == true ? produto.description : null)
                        .setColor('#6E58C7')
                        .setTimestamp()
                        .setFields(...fields)
                        .setImage(backGroundLink)
                        .setFooter({ text: DiscordServer.name, iconURL: `https://cdn.discordapp.com/icons/${DiscordServer.id}/${DiscordServer.icon}.webp` })
                ],//.setThumbnail(logoLink)
                components: components
            });
            
            DiscordChannel.setTopic(produto.id)
            
            if (message) {
                resolve(message)
            } else {
                reject('Mensagem não enviada')
            }
                
            
        } catch (error) {
            console.log(error);
            
            reject(error)
        }
    })

    return promise.then((result) => {
        return {
            error: false,
            data: result
        }
    }).catch((error) => {
        return {
            error: true,
            data: error
        }
    })
};

