const express = require('express');
const router = express.Router();
const db = require('../../Firebase/models')
const functions = require('../../functions');
const path = require('path');
const multer = require('multer');
const { generateKey } = require('crypto');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'))
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(32).toString('hex');
        const originalName = file.originalname;
        const date = Date.now()
        let extension = originalName.substr(originalName.lastIndexOf('.'));

        if (!extension || !extension.includes('.')) {
            extension = file.mimetype.replace('image/', '.');
        }
        const fileName = date + '-' + codigo + extension;

        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });

const client = require('../../Discord/discordIndex').client

router.post('/integrations/discord/createProduct', async (req, res) => {
    try {
        let { storeID, productID, channelID, autoUpdate, embedType, selectedFields } = req.body
        
        if (!storeID || !productID || !channelID || !autoUpdate || !embedType || !selectedFields) {
            return res.status(200).json({ success: false, data: 'Dados incompletos!' });
        }

        let store = await db.findOne({ colecao: 'stores', doc: storeID })
        if (store.error == true) {
            return res.status(200).json({ success: false, data: 'Loja não encontrada!' });
        }
        let discordIntegration = "discord" in store.integrations ? store.integrations.discord : {}
        let discordIntegrationServers = "servers" in discordIntegration ? discordIntegration.servers : []
        if (!("lastServerID" in discordIntegration && discordIntegration.lastServerID)) {
            return res.status(200).json({ success: false, data: 'Nenhum servidor selecionado!' });
        }
        let discordServer = discordIntegrationServers[discordIntegration.lastServerID]
        if (!discordServer) {
            return res.status(200).json({ success: false, data: 'Servidor não encontrado!' });
        }
        const guilds = client.guilds.cache;
        const isBotInServer = guilds.has(discordIntegration.lastServerID)
        let guild = guilds.get(discordIntegration.lastServerID)
        if (!isBotInServer) {
            return res.status(200).json({ success: false, data: 'Bot não está no servidor!' });
        }
        const channels = guild.channels.cache;
        let discordChannel = channels.get(channelID)
        if (!discordChannel) {
            return res.status(200).json({ success: false, data: 'Canal não encontrado!' });
        }


        let products = "products" in discordServer ? discordServer.products : []
        let model = {
            id: `discP-${Date.now()}-${require('crypto').randomBytes(12).toString('hex')}`,
            productID: productID,
            autoUpdate: autoUpdate,
            channelID: channelID,
            embedType: embedType,
            selectedFields: selectedFields,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        products.push(model)

        
        store.integrations.discord.servers[discordIntegration.lastServerID].products = products
        await db.update('stores', storeID, {
            integrations: store.integrations
        })

        try {
            require("../../Discord/createProductMessageEmbend.js")( client, {
                clean:true,
                serverID: discordIntegration.lastServerID,
                channelID: channelID,
                product: store.products.find(prod => prod.id === productID),
                discordProd: model
            })
        } catch (error) {
            
        }

        res.status(200).json({ success: true, data: 'Produto adicionado com sucesso!' })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar atualizar os dados!' });
    }
})

router.post("")

router.post('/integrations/discord/getProduct', async (req, res) => {
    try {
        let { storeID, discordRef } = req.body

        let store = await db.findOne({ colecao: 'stores', doc: storeID })
        if (store.error == true) {
            return res.status(200).json({ success: false, data: 'Loja não encontrada!' });
        }
        let discordIntegration = "discord" in store.integrations ? store.integrations.discord : {}
        let discordIntegrationServers = "servers" in discordIntegration ? discordIntegration.servers : []
        if (!("lastServerID" in discordIntegration && discordIntegration.lastServerID)) {
            return res.status(200).json({ success: false, data: 'Nenhum servidor selecionado!' });
        }
        let discordServer = discordIntegrationServers[discordIntegration.lastServerID]
        if (!discordServer) {
            return res.status(200).json({ success: false, data: 'Servidor não encontrado!' });
        }
        let products = "products" in discordServer ? discordServer.products : []
        let product = products.find(prod => prod.id === discordRef)
        if (!product) {
            return res.status(200).json({ success: false, data: 'Produto não encontrado!' });
        }
        return res.status(200).json({ success: true, data: product })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar atualizar os dados!' });
    }
})

router.post('/integrations/discord/getProducts', async (req, res) => {
    try {
        let { storeID, productID } = req.body

        let store = await db.findOne({ colecao: 'stores', doc: storeID })
        if (store.error == true) {
            return res.status(200).json({ success: false, data: 'Loja não encontrada!' });
        }
        let discordIntegration = "discord" in store.integrations ? store.integrations.discord : {}
        let discordIntegrationServers = "servers" in discordIntegration ? discordIntegration.servers : []
        if (!("lastServerID" in discordIntegration && discordIntegration.lastServerID)) {
            return res.status(200).json({ success: false, data: 'Nenhum servidor selecionado!' });
        }
        let discordServer = discordIntegrationServers[discordIntegration.lastServerID]
        if (!discordServer) {
            return res.status(200).json({ success: false, data: 'Servidor não encontrado!' });
        }
        let products = "products" in discordServer ? discordServer.products : []
        
        return res.status(200).json({ success: true, data: products })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar atualizar os dados!' });
    }
})
module.exports = router;
