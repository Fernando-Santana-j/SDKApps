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
const { error } = require('console');
const { rejects } = require('assert');
const client = new Discord.Client({ intents: botConfig.intents })
client.login(botConfig.discordToken)


router.post('/product/create', upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'backGround', maxCount: 1 }]), async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (!server.bankData) {
            res.status(200).json({ success: false, data: 'Cadastre uma conta bancaria antes de criar um produto!' })
            return
        }
        // if (isNaN(parseInt(req.body.price)) || req.body.price < 100 || req.body.price == undefined) {
        //     res.status(200).json({ success: false, data: 'Preço invalido!' })
        //     return
        // }
        const product = await stripe.products.create({
            name: req.body.productName,
            description: req.body.producDesc,
        });

        const price = await stripe.prices.create({
            unit_amount: parseInt(req.body.price) < 100 ? 100 : parseInt(req.body.price),
            currency: 'brl',
            product: product.id,
        });

        await functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname, '..', `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`))
        let backGround = null
        if (req.files.backGround) {
            backGround = `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`
            await functions.comprimAndRecort(req.files.backGround[0].path, path.join(__dirname, '..', `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`))
        }





        let produtos = []

        let model = {
            productID: await product.id,
            productName: await req.body.productName,
            producDesc: await req.body.producDesc,
            estoque: await JSON.parse(req.body.estoque),
            channel: await req.body.channelID,
            productLogo: `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`,
            backGround: backGround,
            price: await req.body.price,
            priceID: await price.id,
            estoqueModel: JSON.parse(req.body.estoque)[0]
        }
        if (server.products) {
            produtos = server.products
        }
        await produtos.push(model)

        await db.update('servers', req.body.serverID, {
            products: await produtos
        })

        require('../Discord/createProductMessage.js')(Discord, client, {
            channelID: req.body.channelID,
            serverID: req.body.serverID,
            productID: product.id,
        })

        res.status(200).json({ success: true, data: model })
    } catch (error) {
        console.log(error);
    }

})

router.post('/product/update', upload.fields([{ name: 'productLogo', maxCount: 1 }, { name: 'bacKGround', maxCount: 1 }]), async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (!server.bankData) {
            res.status(200).json({ success: false, data: 'Cadastre uma conta bancaria antes de criar um produto!' })
            return
        }
        let productID = req.body.productID
        var produto = await server.products.find(product => product.productID == productID)
        var index = await server.products.findIndex(product => product.productID == productID)
        if (produto == null || index < 0 || produto == undefined) {
            res.status(200).json({ success: false, data: 'Nenhum produto encontrado' })
            return
        }

        // if (isNaN(parseInt(req.body.price)) || req.body.price < 100 || req.body.price == undefined) {
        //     res.status(200).json({ success: false, data: 'Preço incorreto!' })
        //     return
        // }

        let logo = null
        if (req.files.productLogo) {
            logo = `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`
            await functions.comprimAndRecort(req.files.productLogo[0].path, path.join(__dirname, '..', `/uploads/produtos/logos/${'logo_' + req.files.productLogo[0].filename}`))
            fs.unlink(path.join(__dirname, '..', produto.productLogo), (err) => {
                if (err) {
                    console.error('Erro ao apagar o arquivo original:', err);
                    return { error: true, err: err }
                }
            });
        }
        let backGround = null
        if (req.files.backGround) {
            backGround = `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`
            await functions.comprimAndRecort(req.files.backGround[0].path, path.join(__dirname, '..', `/uploads/produtos/background/${'background_' + req.files.backGround[0].filename}`))
            if (produto.backGround != null) {
                fs.unlink(path.join(__dirname, '..', produto.backGround), (err) => {
                    if (err) {
                        console.error('Erro ao apagar o arquivo original:', err);
                        return { error: true, err: err }
                    }
                });
            }
        }

        let lastPrice = produto.priceID
        await stripe.prices.update(lastPrice, {
            active: false,
        });

        const price = await stripe.prices.create({
            unit_amount: parseInt(req.body.price) < 100 ? 100 : parseInt(req.body.price),
            currency: 'brl',
            product: productID,
        });




        let produtos = server.products

        produto.productName = req.body.productName,
        produto.producDesc = req.body.producDesc,
        produto.price = req.body.price,
        produto.priceID = price.id
        if (logo != null) {
            produto.productLogo = logo
        }
        if (backGround != null) {
            produto.backGround = backGround
        }


        produtos[index] = produto;

        db.update('servers', req.body.serverID, {
            products: produtos
        })
        require('../Discord/createProductMessage.js')(Discord, client, {
            channelID: produto.channel,
            serverID: req.body.serverID,
            productID: productID,
            edit: true
        })
        res.status(200).json({ success: true, data: '' })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao atualizar o produto!' })
    }
})

router.post('/product/delete', async (req, res) => {
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
                res.delete().then((res) => { }).catch((err) => { })
            })
        } catch (error) {
            console.log(error);
        }

        res.status(200).json({ success: true, data: '' })
    } catch (error) {
        res.status(200).json({ success: false, data: 'Erro ao tentar deletar o produto!' })
        console.error("Erro ao remover produto:", error);
    }


})

router.post('/product/getOne', async (req, res) => {
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

router.post('/product/get', async (req, res) => {
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

router.post('/estoque/txt', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (server) {
            let productID = req.body.productID
            let produtos = server.products
            let product = await produtos.find(product => product.productID == productID)
            var index = await produtos.findIndex(product => product.productID == productID)
            let file = req.body.txt
            let title = req.body.title


            if (index != -1 && product && file && title) {
                let finalEstoqueArr = []

                if (product.estoque) {
                    finalEstoqueArr = product.estoque
                }


                await file.forEach(element => {
                    element = element.trim()
                    if (element && element != '' && element != null && element != undefined) {
                        finalEstoqueArr.push({
                            conteudo: [
                                {
                                    title: title,
                                    content: element
                                }
                            ]
                        })
                    }
                });
                finalEstoqueArr = await finalEstoqueArr.filter(linha => linha.conteudo[0].content.length > 0)
                produtos[index] = product

                db.update('servers', req.body.serverID, {
                    products: produtos
                })
                require('../Discord/createProductMessage.js')(Discord, client, {
                    channelID: product.channel,
                    serverID: req.body.serverID,
                    productID: req.body.productID,
                    edit: true
                })
            }
            if (!res.headersSent) {
                res.status(200).json({ success: true })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false })
        }
        console.log(error);
    }
})

router.post('/product/estoqueAdd', async (req, res) => {
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

                produtos[index] = product

                db.update('servers', req.body.serverID, {
                    products: produtos
                })
                require('../Discord/createProductMessage.js')(Discord, client, {
                    channelID: product.channel,
                    serverID: req.body.serverID,
                    productID: req.body.productID,
                    edit: true
                })
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


router.post('/product/mensage', (req, res) => {
    try {
        require('../Discord/createProductMessage.js')(Discord, client, {
            channelID: req.body.channelID,
            serverID: req.body.serverID,
            productID: req.body.productID,
            edit: true
        })
        res.status(200).json({ success: true, data: 'Mensagem Enviada!' })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao enviar a mensagem!' })
    }

})

module.exports = router;



