const express = require('express');
const router = express.Router();
const functions = require('./functions')
const db = require('./Firebase/models')
const axios = require('axios')


const { Payment, MercadoPagoConfig } = require('mercadopago');
const mercadoPagoData = require('./config/mercadoPagoData.json')

router.post('/mercadopago/webhook', async (req, res) => {
    try {
        if (req.body.action == 'payment.created') {
            let id = await req.body.data.id
            let params = await req.query
            if (params) {
                axios.get(`https://api.mercadolibre.com/collections/notifications/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${params.token}`
                    }
                }).then(async (doc) => {
                    // if (doc.data.collection.status === "approved") {
                    require("./Discord/discordIndex").sendProductPayment(params, id,'pix')

                    // }
                })
            }
        }
    } catch (error) {

    }
    res.status(200)
})


router.post('/mercadopago/add', async (req, res) => {
    try {
        let token = await (req.body.token).trim()
        const Mercadoclient = new MercadoPagoConfig({ accessToken: token, options: { timeout: 5000 } });
        const payment = new Payment(Mercadoclient);
        const body = {
            transaction_amount: 1.00,
            description: `Valid token`,
            payment_method_id: 'pix',
            external_reference: '',
            payer: mercadoPagoData.payer,
            notification_url: mercadoPagoData.notification_url + '/test',
        };
        let test = await payment.create({ body })
        if (test) {
            let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
            let bankData = await server.bankData
            bankData.mercadoPagoToken = token
            db.update('servers', req.body.serverID, {
                bankData: bankData
            })
            res.status(200).json({ success: true, data: 'Token pix adicionado' })
        } else {
            res.status(200).json({ success: false, data: 'Token pix Invalido' })
        }

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Token pix Invalido' })
    }
})




router.post('/mercadopago/desative', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        let bankData = await server.bankData
        bankData.mercadoPagoToken = ''
        db.update('servers', req.body.serverID, {
            bankData: bankData
        })
        res.status(200).json({ success: true, data: 'Pix desativado!' })
    } catch (error) {
        res.status(200).json({ success: false, data: 'Erro ao desativar o pix' })
    }
})

module.exports = router