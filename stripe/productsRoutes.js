const express = require('express');
const router = express.Router();

const stripe = require('stripe')(require('../config/web-config').stripe);

const db = require('../Firebase/models')
const fs = require('fs');
const functions = require('../functions');
const webConfig = require('../config/web-config');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'))
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(32).toString('hex');
        const originalName = file.originalname;
        const date = Date.now()
        const extension = originalName.substr(originalName.lastIndexOf('.'));
        const fileName = date + '-' + codigo + extension;
        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });

let Discord = require('discord.js')
const botConfig = require('../config/bot-config.js');
const { error, log } = require('console');
const { rejects } = require('assert');
const client = new Discord.Client({ intents: botConfig.intents })
client.login(botConfig.discordToken)


router.post('/product/mult', functions.authPostState, upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'backGround', maxCount: 1 }]), async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (server.plan == 'inicial') {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Seu plano não dá acesso a essa funcionalidade!' })
            }
            return
        }
        await require('../Discord/createMultiProductMensage.js')(Discord, client, {
            serverID: req.body.serverID,
            channelID: req.body.channelID,
            backGround: req.files.backGround ? req.files.backGround[0].path : null,
            logo: req.files.productLogo[0].path,
            productsList: req.body.productsList,
            productName: req.body.productName,
            producDesc: req.body.producDesc,
            edit: false
        })
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Mensagem enviada!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar enviar a mensagem!' })
        }
        console.log(error);
    }
})

router.post('/product/create', functions.authPostState, upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'backGround', maxCount: 1 }]), async (req, res) => {
    try {

        let { price, productName, producDesc, channelID, serverID, typeProduct } = req.body
        

        let server = await db.findOne({ colecao: 'servers', doc: serverID })

        if (!server.bankData) {
            res.status(200).json({ success: false, data: 'Cadastre uma conta bancaria antes de criar um produto!' })
            return
        }

        if ((isNaN(parseInt(price)) || !price) && typeProduct != 'multiple') return res.status(200).json({ success: false, data: 'Adicione o preço do produto!' });
        if (!productName) return res.status(200).json({ success: false, data: 'Adicione o nome do produto!' });
        if (!producDesc) return res.status(200).json({ success: false, data: 'Adicione a descricão do produto!' });
        if (!channelID) return res.status(200).json({ success: false, data: 'Selecione um canal valido!' });
        if (!req.files.productLogo) return res.status(200).json({ success: false, data: 'Adicione o logo do seu produto!' });

        let backGround = null
        if (req.files.backGround && server.plan != 'inicial') {
            backGround = `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`
            await functions.comprimAndRecort(req.files.backGround[0].path, path.join(__dirname, '..', `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`))
        }

        await functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname, '..', `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`))
        
        let productStripe = {
            id: require('crypto').randomBytes(10).toString('hex')
        }
        let priceStripe = {
            id: require('crypto').randomBytes(10).toString('hex')
        }
        if (typeProduct != 'multiple') {
            productStripe = await stripe.products.create({
                name: req.body.productName,
                description: req.body.producDesc,
            })
    
            priceStripe = await stripe.prices.create({
                unit_amount: parseInt(req.body.price) < 100 ? 100 : parseInt(req.body.price),
                currency: 'brl',
                product: productStripe.id,
            });
        }
        let numberEstoque = 0
        let model = {
            productID: await productStripe.id,
            productName: productName,
            producDesc: producDesc,
            logoActive: req.body.logoActive,
            estoque: '',
            channel: channelID,
            productLogo: `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`,
            backGround: backGround,
            price: price,
            priceID: await priceStripe.id,
            estoqueModel: {
                conteudo: [
                    {
                        title: '',
                        content: ''
                    }
                ]
            },
            embendType: req.body.embendType,
            typeProduct: typeProduct
        }
        switch (typeProduct) {
            case 'normal':
                if ('normalTxtEstoque' in req.body) {
                    let estoqueFront = JSON.parse(req.body.normalTxtEstoque)
                    let preEstoque = []
                    for (let index = 0; index < estoqueFront.length; index++) {
                        const element = estoqueFront[index];
                        preEstoque.push({conteudo:[{ title: req.body.normalTitleEstoque, content: element }]})
                    }
                    numberEstoque = preEstoque.length
                    model.estoque = preEstoque
                    model.estoqueModel = {
                        conteudo: [
                            {
                                title: req.body.normalTitleEstoque,
                                content: ''
                            }
                        ]
                    }
                }
                
                break;
            case 'single':
                model.estoque = req.body.singleEstoqueNumber
                numberEstoque = req.body.singleEstoqueNumber
                model.estoqueModel = {
                    conteudo: [
                        {
                            title: '',
                            content: req.body.singleContent
                        }
                    ]
                }
                break;
            case 'subscription':

                break;
            case 'multiple':
                model.estoque = 'multiple'
                let produtos = JSON.parse(req.body.arrayProdutos)
                model.multipleProducts = produtos
                break;
        }
        
        let produtos = []

        if (server.products) {
            produtos = server.products
        }
        await produtos.push(model)

        await db.update('servers', req.body.serverID, {
            products: await produtos
        })


       
        if ((typeProduct == 'normal' && model.estoque.length > 0) || (typeProduct == 'single' && model.estoque > 0) || (typeProduct == 'multiple')) {
            if (req.body.embendType == '0') {
                require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                    channelID: req.body.channelID,
                    serverID: req.body.serverID,
                    productID: productStripe.id,
                })
            } else {
                require('../Discord/createProductMessage.js')(Discord, client, {
                    channelID: req.body.channelID,
                    serverID: req.body.serverID,
                    productID: productStripe.id,
                })
            }
        }
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: model })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao criar o produto!' })
        }
        console.log(error);
    }

})

router.post('/product/update', functions.authPostState, upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'backGround', maxCount: 1 }]), async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })

        if (!req.body.productName) return res.status(200).json({ success: false, data: 'Adicione o nome do produto!' });
        if (!req.body.producDesc) return res.status(200).json({ success: false, data: 'Adicione a descricão do produto!' });
        let productID = req.body.productID
        var produto = await server.products.find(product => product.productID == productID)
        var index = await server.products.findIndex(product => product.productID == productID)
        
        if (produto == null || index < 0 || produto == undefined) {
            res.status(200).json({ success: false, data: 'Nenhum produto encontrado' })
            return
        }

        let backGround = produto.backGround
        if (req.files.backGround && server.plan != 'inicial') {
            backGround = `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`
            await functions.comprimAndRecort(req.files.backGround[0].path, path.join(__dirname, '..', `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`))
        }

        let logo = produto.productLogo
        if (req.files.productLogo) {
            logo = `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`
            await functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname, '..', `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`))
        }

        let typeProduct = 'typeProduct' in produto ? produto.typeProduct : 'normal'
        
        let price = produto.priceID
        if (req.body.price && (typeProduct != 'multiple' && req.body.price != produto.price)) {
            let lastPrice =  produto.priceID
            await stripe.prices.update(lastPrice, {
                active: false,
            });
    
            const newPrice = await stripe.prices.create({
                unit_amount: parseInt(req.body.price) < 100 ? 100 : parseInt(req.body.price),
                currency: 'brl',
                product: productID,
            });
            price = newPrice.id
        }


        let model = {
            estoque: produto.estoque ? produto.estoque : [],
            estoqueModel: produto.estoqueModel ? produto.estoqueModel : {
                conteudo: [
                    {
                        title: '',
                        content: ''
                    }
                ]
            },
        }
        switch (typeProduct) {
            case 'normal':
                if ('normalTxtEstoque' in req.body && req.body.normalTxtEstoque && req.body.normalTitleEstoque) {
                    
                    let estoqueFront = JSON.parse(req.body.normalTxtEstoque)
                    
                    for (let index = 0; index < estoqueFront.length; index++) {
                        const element = estoqueFront[index];
                        model.estoque.push({conteudo:[{ title: req.body.normalTitleEstoque, content: element }]})
                    }
                    
                    model.estoqueModel = {
                        conteudo: [
                            {
                                title: req.body.normalTitleEstoque ? req.body.normalTitleEstoque : '',
                                content: ''
                            }
                        ]
                    }
                }
                
                break;
            case 'single':
                if ( 'singleEstoqueNumber' in req.body && req.body.singleEstoqueNumber) {
                    model.estoque = req.body.singleEstoqueNumber
               
                    numberEstoque = req.body.singleEstoqueNumber
                    model.estoqueModel = {
                        conteudo: [
                            {
                                title: '',
                                content: req.body.singleContent
                            }
                        ]
                    }
                }
                break;
            case 'subscription':

                break;
           
        }
     
        let produtos = server.products
        produto.productName = req.body.productName,
        produto.producDesc = req.body.producDesc,
        produto.price = req.body.price,
        produto.priceID = price
        produto.productLogo = logo
        produto.backGround = backGround
        produto.embendType = req.body.embendType
        produto.estoqueModel = model.estoqueModel
        produto.estoque = model.estoque
        produto.logoActive = req.body.logoActive
        if (req.body.channelID) {
            produto.channel = req.body.channelID
        }
        
        produtos[index] = produto;

        db.update('servers', req.body.serverID, {
            products: produtos
        })
        if (produto.embendType == 0) {
            require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                channelID: produto.channel,
                serverID: req.body.serverID,
                productID: productID,
                edit: true
            })
        } else {
            require('../Discord/createProductMessage.js')(Discord, client, {
                channelID: produto.channel,
                serverID: req.body.serverID,
                productID: productID,
                edit: true
            })
        }
        res.status(200).json({ success: true, data: '' })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao atualizar o produto!' })
    }
})

router.post('/product/delete', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (!server.bankData) {
            return res.status(200).json({ success: false, data: 'Cadastre uma conta bancaria antes de criar um produto!' })
        }

        let products = server.products
        let productID = req.body.productID

        let produto = await products.find(product => product.productID == productID)
        var index = await products.findIndex(product => product.productID == productID)

        if (index !== -1) {
            products.splice(index, 1);
        }

        if (produto.backGround) {
            fs.unlink(path.join(__dirname, '..', produto.backGround), (err) => {
                if (err) {
                    console.error('Erro ao apagar o arquivo original:', err);
                    return { error: true, err: err }
                }
            });
        }
        fs.unlink(path.join(__dirname, '..', produto.productLogo), (err) => {
            if (err) {
                console.error('Erro ao apagar o arquivo original:', err);
                return { error: true, err: err }
            }
        });


        await stripe.prices.update(produto.priceID, {
            active: false,
        });

        await stripe.products.update(productID, {
            active: false,
        });
        db.update('servers', req.body.serverID, {
            products: products
        })

        try {
            const DiscordServer = client.guilds.cache.get(server.id);
            const DiscordChannel = DiscordServer.channels.cache.get(produto.channel);

            DiscordChannel.messages.fetch(produto.mensageID).then((res) => {
                try {
                    res.delete()
                } catch (error) { }
            }).catch((err) => { })
        } catch (error) {
            console.log(error);
        }

        res.status(200).json({ success: true, data: '' })
    } catch (error) {
        res.status(200).json({ success: false, data: 'Erro ao tentar deletar o produto!' })
        console.error("Erro ao remover produto:", error);
    }


})

router.post('/product/getOne', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        let productID = req.body.productID
        let product = await server.products.find(product => product.productID == productID)
        if (product) {
            res.status(200).json({ success: true, data: product })
        }

    } catch (error) {
        console.log(error);
    }
})

router.post('/product/get', functions.authPostState, async (req, res) => {
    let verify = await new Promise(async (resolve, reject) => {
        try {
            let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
            if (server) {
                resolve({
                    err: false,
                    error: null,
                    data: server.products
                })
            } else {
                reject({
                    err: true,
                    error: 'not server',
                    data: null
                })
            }
        } catch (error) {
            reject({
                err: true,
                error: error,
                data: null
            })
        }
    }).then(result => {
        if (result.err == false && !res.headersSent) {
            res.status(200).json({ success: true, data: result.data })
        }
    }).catch(err => {
        console.log(err);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: "error" })
        }

    })

})



router.post('/product/estoqueAdd', functions.authPostState, async (req, res) => {
    let verify = await new Promise(async (resolve, reject) => {
        try {
            let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
            if (server) {
                let productID = req.body.productID
                let produtos = server.products
                let product = await produtos.find(product => product.productID == productID)
                var index = await produtos.findIndex(product => product.productID == productID)
                let estoqueADD = req.body.estoque
                if (!productID || !produtos || !product || index == -1 || !estoqueADD) {
                    reject({
                        err: false
                    })
                }

                await product.estoque.push(estoqueADD)
                if (`estoqueAviso` in product) {
                    for (let index = 0; index < product.estoqueAviso.length; index++) {
                        const element = product.estoqueAviso[index];
                        await require(`../Discord/discordIndex.js`).sendDiscordMensageUser(element, `O produto ${product.productName} ja esta em estoque!`, 'O produto que você tentou comprar anteriormente já está em estoque, aproveite para comprar antes que se esgote novamente!', `https://discord.com/channels/${req.body.serverID}/${product.channel}`, '📤・Ir para o produto',)
                    }
                    product.estoqueAviso = []
                }
                product.estoqueModel = estoqueADD
                produtos[index] = product

                db.update('servers', req.body.serverID, {
                    products: produtos
                })
                if (product.embendType == 0) {
                    require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                        channelID: product.channel,
                        serverID: req.body.serverID,
                        productID: productID,
                        edit: true
                    })
                } else {
                    require('../Discord/createProductMessage.js')(Discord, client, {
                        channelID: product.channel,
                        serverID: req.body.serverID,
                        productID: productID,
                        edit: true
                    })
                }
                resolve({
                    err: false,
                    error: null
                })
            } else {
                reject({
                    err: true,
                    error: 'not server'
                })
            }
        } catch (error) {
            reject({
                error: true,
                err: error
            })
        }
    }).then(result => {
        if (result.err == false && !res.headersSent) {
            res.status(200).json({ success: true, data: "" })
        }
    }).catch(err => {
        console.log(err);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: "erro ao adicionar estoque" })
        }

    })

})


router.post('/product/mensage', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        let productID = req.body.productID
        let produtos = server.products
        let produto = await produtos.find(product => product.productID == productID)
        let typeProduct = 'typeProduct' in produtos ? produtos.typeProduct : 'normal'
        let numberEstoque = 0
        switch (typeProduct) {
            case 'normal':
                if (!produtos.estoque) {
                    numberEstoque = 0
                }else{
                    numberEstoque = produtos.estoque.length
                }
                break;
        
            case 'single':
                numberEstoque = produtos.estoque
                
                break;
        }
        
        if (produto.embendType == 0) {
            require('../Discord/createProductMessageEmbend.js')(Discord, client, {
                channelID: produto.channel,
                serverID: req.body.serverID,
                productID: req.body.productID,
                numberEstoque: numberEstoque,
                edit: true
            })
        } else {
            require('../Discord/createProductMessage.js')(Discord, client, {
                channelID: produto.channel,
                serverID: req.body.serverID,
                productID: req.body.productID,
                numberEstoque: numberEstoque,
                edit: true
            })
        }
        res.status(200).json({ success: true, data: 'Mensagem Enviada!' })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao enviar a mensagem!' })
    }

})

module.exports = router;



