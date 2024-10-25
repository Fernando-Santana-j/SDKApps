const express = require('express');
const router = express.Router();
const functions = require('../functions')
const db = require('../Firebase/models')
const axios = require('axios')

let client = require('../Discord/discordIndex').client
const { Payment, MercadoPagoConfig } = require('mercadopago');
const mercadoPagoData = require('../config/mercadoPagoData.json');
const webConfig = require('../config/web-config');


router.post('/mercadopago/webhook', async (req, res) => {
    let resposta = req.body
    let params = req.query
    res.sendStatus(200)
    try {
        if (resposta.action == 'payment.updated') {
            let id = await resposta.data.id
            if (params) {
                axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${params.token}`
                    }
                }).then(async (doc) => {
                    switch (doc.data.metadata.action) {
                        case 'cobrancaPay':
                            let metadataC = {
                                serverID: doc.data.metadata.server_id,
                                user: doc.data.metadata.user,
                                token: doc.data.metadata.token,
                                userCobrador: doc.data.metadata.userCobrador,
                                valor: doc.data.metadata.valor,
                                mensageID: doc.data.metadata.mensageID,
                                channelID: doc.data.metadata.channelID
                            }
                            if (doc.data.status === "approved") {
                                let bank = doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name

                                if ('blockBank' in server && server.blockBank.includes(bank)) {
                                    try {
                                        await axios.post(`https://api.mercadopago.com/v1/payments/${id}/refunds`, {}, {
                                            headers: {
                                                Authorization: `Bearer ${params.token}`
                                            }
                                        })
                                        require("../Discord/discordIndex").sendDiscordMensageChannel(metadataC.serverID, null, 'Reembolso', `Esse servidor não está aceitando pagamentos desta instituição ${bank}, seu dinheiro foi reembolsado, tente novamente usando outro banco.`, metadataC.user, false)
                                    } catch (error) {
                                        console.log(error);
                                    }
                                } else {
                                    try {
                                        require("../Discord/discordIndex").sendDiscordMensageUser(metadataC.user, '✅ Pagamento concluido!', `O pagamento da sua ultima cobrança foi concluido com sucesso.`, null, null)
                                        require("../Discord/discordIndex").sendDiscordMensageUser(metadataC.userCobrador, '✅ cobranca paga!', `O usuario com id ${metadataC.user} pagou a sua ultima cobrança.`, null, null)
                                        try {
                                            const channel = await client.channels.fetch(metadataC.channelID);
                                            const message = await channel.messages.fetch(metadataC.mensageID);
                                            await message.edit({
                                                components: []
                                            });
                                            try {
                                                await message.edit({
                                                    embeds: [Discord.EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Você ja pagou essa cobrança!`)],
                                                });
                                            } catch (error) {}
                                        } catch (error) {}
                                    } catch (error) {
                                        console.log(error);
                                    }
                                }
                            }
                            break;
                        case 'produtoPay':
                            let metadata = {
                                serverID: doc.data.metadata.server_id,
                                carrinhos: doc.data.metadata.carrinhos,
                                token: doc.data.metadata.token,
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
                                        require("../Discord/discordIndex").sendDiscordMensageChannel(metadata.serverID, null, 'Reembolso', `Esse servidor não está aceitando pagamentos desta instituição ${bank}, seu dinheiro foi reembolsado, tente novamente usando outro banco.`, metadata.userID, false)
                                    } catch (error) {
                                        console.log(error);
                                    }
                                } else {
                                    try {
                                        require("../Discord/discordIndex").sendProductPayment(metadata, id, 'pix')
                                    } catch (error) {
                                        console.log(error);
                                    }
                                }

                            }
                            break;
                        case 'planPay':
                            let metadataP = {
                                serverID: doc.data.metadata.server_id,
                                token: doc.data.metadata.token,
                                userID: doc.data.metadata.user_id,
                                price: doc.data.metadata.price,
                                plan: doc.data.metadata.plan,
                                time: doc.data.metadata.time
                            }
                            let serverP = await db.findOne({ colecao: 'servers', doc: metadataP.serverID })
                            if (serverP.error == false) {
                                await functions.renovarPix(serverP.subscription, metadataP.time)
                            } else {
                                await functions.createAccount({
                                    metadata: {
                                        uid: metadataP.userID,
                                        plan: metadataP.plan,
                                        serverID: metadataP.serverID
                                    }
                                }, 'pix', metadataP.price, functions)
                            }
                            break;
                    }
                }).catch(err => {
                    console.log(err);
                })
            }
        }

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

router.post('/pix/create', async (req, res) => {
    try {
        let timeMultiply = req.body.timeMultiply
        let time = req.body.time
        let plan = req.body.plan
        let indexPrice = timeMultiply == 1 ? 0 : timeMultiply == 3 ? 1 : 2

        let itemPlan = webConfig.planos[plan][indexPrice]



        const Mercadoclient = new MercadoPagoConfig({ accessToken: webConfig.mercadoPagoToken, options: { timeout: 5000 } });
        const payment = new Payment(Mercadoclient);

        let amount = itemPlan.price

        const body = {
            transaction_amount: amount,
            description: `Cobranca do plano ${plan} na plataforma SDKApps`,
            payment_method_id: 'pix',
            external_reference: req.body.uid,
            payer: require(`../config/mercadoPagoData.json`).payer,
            notification_url: `${require(`../config/mercadoPagoData.json`).notification_url}/mercadopago/webhook?token=${webConfig.mercadoPagoToken}`,
            metadata: {
                userID: req.body.uid,
                serverID: req.body.serverID,
                action: 'planPay',
                plan: req.body.plan,
                price: itemPlan,
                token: webConfig.mercadoPagoToken,
                time: time
            }
        };

        let dataPix = await payment.create({ body })
        const cpc = dataPix.point_of_interaction.transaction_data.qr_code
        const base64 = dataPix.point_of_interaction.transaction_data.qr_code_base64
        if (!res.headersSent) {
            res.status(200).json({ success: true, cpc: cpc, qrcode: base64 })
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao criar o pix' })
        }
    }
})

module.exports = router