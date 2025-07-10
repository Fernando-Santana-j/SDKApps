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


router.post('/webhook/add', async (req, res) => {
    let { name, url, events, storeID } = req.body
    let store = await db.findOne({ colecao: 'stores', doc: storeID })
    if (store.error == true) {
        return res.status(200).json({ success: false, data: 'Loja não encontrada!' });
    }
    if (!("integrations" in store && "discord" in store.integrations)) {
        return res.status(200).json({ success: false, data: 'Integração Discord não configurada!' });
    }
    let discordIntegration = store.integrations.discord
    let discordIntegrationServers = "servers" in discordIntegration ? discordIntegration.servers : []
    let discordServer = discordIntegrationServers[discordIntegration.lastServerID]
    if (!discordServer) {
        return res.status(200).json({ success: false, data: 'Servidor não encontrado!' });
    }
    let discordChannel = discordServer.channels.cache.find(channel => channel.name === '📋・Logs')
    if (!discordChannel) {
        let categoria = discordServer.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && (c.name === 'staff' || c.name === 'Staff' || c.name === 'logs' || c.name === 'Logs'))
        if (!categoria) {
            categoria = await discordServer.channels.create({
                name: 'Logs',
                type: Discord.ChannelType.GuildCategory,
            })
        }
        discordChannel = await discordServer.channels.create({
            name: '📋・Logs',
            type: Discord.ChannelType.GuildText,
            permissionOverwrites: [{
                id: discordServer.roles.everyone,
                deny: [Discord.PermissionsBitField.Flags.ViewChannel],
            }]
        })
    }
    let webhook = await discordChannel.createWebhook({ name: `webhook-logs-sdkapps` })
    console.log(webhook);
    
    
})