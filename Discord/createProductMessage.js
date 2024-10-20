const db = require('../Firebase/models')
require('dotenv').config()
const path = require('path')
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const sharp = require('sharp');


let fontNormal = path.join(__dirname, "..", '/public/font/Poppins/Poppins-Medium.ttf')
let fontSemiBold = path.join(__dirname, "..", '/public/font/Poppins/Poppins-SemiBold.ttf')
let fontBold = path.join(__dirname, "..", '/public/font/Poppins/Poppins-Bold.ttf')
registerFont(fontNormal, { family: 'Poppins' });
registerFont(fontSemiBold, { family: 'Poppins_Semi' })
registerFont(fontBold, { family: 'Poppins_Bold' })
let Discord = require('discord.js')
const functions = require('../functions');
module.exports = async (Discord2, client, data) => {

    try {
        async function createImage(title, description, background, icon, price, estoque,pix,stripe) {
            try {
                function wrapText(context, text, x, y, maxWidth, fontSize) {
                    let words = text.split(' ');
                    let line = '';
                    let lines = [];
                    for (let word of words) {
                        let testLine = line + word + ' ';
                        let metrics = context.measureText(testLine.trim());
                        let testWidth = metrics.width;
                        if (testWidth > maxWidth) {
                            lines.push(line);
                            line = word + ' ';
                        } else {
                            line = testLine;
                        }
                    }
                    lines.push(line);
    
                    let offsetY = 0;
                    for (let line of lines) {
                        context.fillText(line.trim(), x, y + offsetY);
                        offsetY += fontSize * 1.2; // Incremento de linha com espaço adicional
                    }
                }
                const width = 1600;
                const height = 1000;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
    
                const blurredBackground = await sharp(background)
                    .resize(width, height)
                    .blur(8)
                    .toBuffer();
    
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, width, height);
                ctx.globalAlpha = 0.5;
                ctx.drawImage(await loadImage(blurredBackground), 0, 0, width, height);
    
    
    
    
    
    
                //--------- Logo ------------
                const logoTamanho = 400
                const LogoImageX = 100;
                const LogoImageY = 100;
    
    
                //circulo da logo
                ctx.fillStyle = '#404040'
                ctx.globalAlpha = 0.9;
                ctx.filter = 'none';
                ctx.beginPath();
                ctx.arc(LogoImageX + 200, LogoImageY + 200, 210, 0, Math.PI * 2);
                ctx.fill();
    
                let LogoImageFS = fs.readFileSync(path.join(__dirname,'..',icon))
                const LogoImage = await loadImage(LogoImageFS, { quality: 1 });
    
                ctx.filter = 'none';
                ctx.globalAlpha = 1;
    
                ctx.save();
                ctx.beginPath();
                ctx.arc((logoTamanho + LogoImageX * 2) / 2, (logoTamanho + LogoImageY * 2) / 2, logoTamanho / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(LogoImage, LogoImageX, LogoImageY, logoTamanho, logoTamanho);
                ctx.restore();
    
    
    
                //------- descricao ------
    
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#ffffff';
    
                let descriptionX = 150
                let descriptionY = 620
    
    
                ctx.font = '30px Poppins,sans-serif';
                wrapText(ctx, description, descriptionX, descriptionY, 500, 30)
    
    
    
    
    
    
    
                //--------------Title and Price containner---------------
    
                let containerTopPositionX = width - 680
                let containerTopPositionY = 80
                let containerTopWidth = 600
                let containerTopHeight = 450
                const borderWidth = 5;
                const borderColor = '#c7c7c7ef';
                const cornerRadius = 20;
    
    
                //titulo
    
                ctx.font = '38px Poppins_Bold,sans-serif';
                wrapText(ctx, title, containerTopPositionX + 50, containerTopPositionY + 120, 300, 38)
    
    
                //Price
    
                ctx.font = '70px Poppins_Bold,sans-serif';
                wrapText(ctx, price, containerTopPositionX + 50, containerTopPositionY + 270, 500, 70)
                //status estoque
    
                ctx.font = '32px Poppins_Semi,sans-serif';
                let estoqueText = estoque <= 0 ? `Produto sem Estoque!
                Aguarde!` : `Produto em estoque! 
                Aproveite!`
    
                ctx.fillText(estoqueText, containerTopPositionX + 50, containerTopPositionY + 380);
    
    
                //caixa
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
    
                ctx.beginPath();
                ctx.moveTo(containerTopPositionX + cornerRadius, containerTopPositionY);
                ctx.arcTo(containerTopPositionX + containerTopWidth, containerTopPositionY, containerTopPositionX + containerTopWidth, containerTopPositionY + containerTopHeight, cornerRadius);
                ctx.arcTo(containerTopPositionX + containerTopWidth, containerTopPositionY + containerTopHeight, containerTopPositionX, containerTopPositionY + containerTopHeight, cornerRadius);
                ctx.arcTo(containerTopPositionX, containerTopPositionY + containerTopHeight, containerTopPositionX, containerTopPositionY, cornerRadius);
                ctx.arcTo(containerTopPositionX, containerTopPositionY, containerTopPositionX + containerTopWidth, containerTopPositionY, cornerRadius);
                ctx.closePath();
    
                ctx.stroke();
    
    
    
                //----------metodos de pagamento -----------------
    
                let containerPositionX = width - 680
                let containerPositionY = height - 340
                let containerWidth = 600
                let containerHeight = 250
    
    
    
                //icones
                if (pix) {
                    ctx.filter = 'none';
                    ctx.globalAlpha = 1;
                    let pixLogoFS = fs.readFileSync(path.join(__dirname,'..','public/img/PIX.png'))
                    let pixLogo = await loadImage(pixLogoFS, { quality: 1 });
                    ctx.drawImage(pixLogo, containerPositionX + 50, containerPositionY + 120, 100, 100);
                }
    
                if (stripe) {
                    let cartaoLogoFS = fs.readFileSync(path.join(__dirname,'..','public/img/cartao.png'))
                    let cartaoLogo = await loadImage(cartaoLogoFS, { quality: 1 });
                    ctx.drawImage(cartaoLogo, containerPositionX + 250, containerPositionY + 120, 100, 100);
        
                    let boletoLogoFS = fs.readFileSync(path.join(__dirname,'..','public/img/boleto.png'))
                    let boletoLogo = await loadImage(boletoLogoFS, { quality: 1 });
                    ctx.drawImage(boletoLogo, containerPositionX + 450, containerPositionY + 120, 100, 100);
                }
    
                //texto
                ctx.font = '38px Poppins_Semi,sans-serif';
                ctx.fillText('Metodos de Pagamento:', containerPositionX + 80, containerPositionY + 60);
    
                //caixa
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
    
                ctx.beginPath();
                ctx.moveTo(containerPositionX + cornerRadius, containerPositionY);
                ctx.arcTo(containerPositionX + containerWidth, containerPositionY, containerPositionX + containerWidth, containerPositionY + containerHeight, cornerRadius);
                ctx.arcTo(containerPositionX + containerWidth, containerPositionY + containerHeight, containerPositionX, containerPositionY + containerHeight, cornerRadius);
                ctx.arcTo(containerPositionX, containerPositionY + containerHeight, containerPositionX, containerPositionY, cornerRadius);
                ctx.arcTo(containerPositionX, containerPositionY, containerPositionX + containerWidth, containerPositionY, cornerRadius);
                ctx.closePath();
    
                ctx.stroke();
    
    
                //--------footer------
                ctx.textAlign = 'center';
                ctx.font = '22px Poppins,sans-serif';
                ctx.fillText('Clique no botao abaixo para adicionar o produto a seu carrinho!', width / 2, height - 20);
    
    
                const buffer = canvas.toBuffer('image/jpeg', { quality: 1 });
                return buffer;
            } catch (error) {
                console.log(error);
            }
        }
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
        let typeProduct = 'typeProduct' in produto ? produto.typeProduct : 'normal'
        var index = await serverDb.products.findIndex(product => product.productID == productId)
        let preco = ''
        if (typeProduct != 'multiple' && produto.preco && produto.preco != '') {
            preco = (produto.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        let background = fs.readFileSync(produto.backGround == null ? path.join(__dirname, "..", 'public/img/LOGOFUNDO.png') : path.join(__dirname, "..",  produto.backGround))
        let buffer = await createImage(produto.productName, produto.producDesc, background, produto.productLogo, await preco, data.numberEstoque,serverDb.bankData.mercadoPagoToken ? true : false, serverDb.bankData.bankID ? true : false)
        const attachment = new Discord.AttachmentBuilder(buffer, { name: 'ProductImage.jpeg' })
        
        
        let components = []
       
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
        
        
        let embed = await DiscordChannel.send({
            files: [attachment],
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

