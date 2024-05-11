const express = require('express');
const router = express.Router();
const functions = require('./functions')
const db = require('./Firebase/models')
const axios = require('axios')


const { Payment, MercadoPagoConfig } = require('mercadopago');
const mercadoPagoData = require('./config/mercadoPagoData.json')


router.post('/mercadopago/webhook', async (req, res) => {
    let resposta = req.body
    let params = req.query
    try {
        if (resposta.action == 'payment.updated') {
            let id = await resposta.data.id
            if (params) {
                axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${params.token}`
                    }
                }).then(async (doc) => {
                    let metadata = {
                        serverID:doc.data.metadata.server_id,
                        carrinhos:doc.data.metadata.carrinhos,
                        token:doc.data.metadata.token,
                        userID: doc.data.metadata.user_id
                    }
                    
                    let server = await db.findOne({ colecao: 'servers', doc: metadata.serverID })
                    if (doc.data.status === "approved") {
                        let bank = doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name

                        if ('blockBank' in server && server.blockBank.includes(bank)) {
                            try {
                                await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
                                    headers: {
                                        Authorization: `Bearer ${params.token}`
                                    }
                                })
                                require("./Discord/discordIndex").sendDiscordMensageChannel(metadata.serverID,null,'Reembolso',`Esse servidor não está aceitando pagamentos desta instituição ${bank}, seu dinheiro foi reembolsado, tente novamente usando outro banco.`,params.userID,false)
                            } catch (error) {
                                console.log(error);
                            }
                        } else {
                            try {
                                require("./Discord/discordIndex").sendProductPayment(metadata, id, 'pix')
                            } catch (error) {
                                console.log(error);
                            }
                        }

                    }

                }).catch(err => {
                    console.log(err);
                })
            }
        }
        res.sendStatus(200)
    } catch (error) {
        console.log(error);
    }
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
            // notification_url: mercadoPagoData.notification_url + '/test',
        };
        let test = await payment.create({ body })
        if (test) {
            let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
            let bankData = {}
            if (server.bankData) {
                bankData = server.bankData
            }
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