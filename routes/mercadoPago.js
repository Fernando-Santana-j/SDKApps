const express = require('express');
const router = express.Router();
const functions = require('../functions')
const db = require('../Firebase/models')
const axios = require('axios')

let clientDiscord = require('../Discord/discordIndex').client
const { Payment, MercadoPagoConfig, Preference } = require('mercadopago');
let mercadoPago = require('mercadopago');
const mercadoPagoData = require('../config/mercadoPagoData.json');
const webConfig = require('../config/web-config');


const Mercadoclient = new MercadoPagoConfig({ accessToken: "TEST-5422321950640583-081017-c4a168dbc487cc205f5a5f28448051a8-1968643066" });



router.post('/mercadopago/createPreference', async (req, res) => {
  const {itens , paymentAccept} = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    let excluded_payment_types = [
      { id: 'credit_card' },
      { id: 'debit_card' },
      { id: 'ticket' } ,
      { id: "pix"}
    ]
    if (paymentAccept) {
        switch (paymentAccept) {
            case 'card':
                excluded_payment_types = excluded_payment_types.filter((item) => item.id !== 'credit_card' && item.id !== 'debit_card');
                break;
            case 'pix':
                excluded_payment_types = excluded_payment_types.filter((item) => item.id !== 'pix');
                break;
            case 'boleto':
                excluded_payment_types = excluded_payment_types.filter((item) => item.id !== 'ticket');
                break;
        }
    }

  const preferences = {
    items: itens,
    payment_methods: {
      excluded_payment_types: excluded_payment_types
    }
  };

  try {
    const preference = new Preference(Mercadoclient);
    const response = await preference.create({ body: preferences }); // <-- IMPORTANTE
    if (!response || !response.id) {
        res.json({success: false, data: 'Resposta inválida do Mercado Pago' });
    }
    res.json({ id: response.id, success: true });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    res.json({success: false, data: 'Erro ao criar preferência', detalhe: error });
  }
});

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
                                            const channel = await clientDiscord.channels.fetch(metadataC.channelID);
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
                                try {
                                    const currentPeriodEnd = Math.floor(Date.now() / 1000);
                                    let additionalTime;
                        
                                    if (time === 'month' || time == 'mensal') {
                                        additionalTime = 30 * 24 * 60 * 60;
                                    } else if (time === 'year' || time == 'anual') {
                                        additionalTime = 365 * 24 * 60 * 60;
                                    } else if (time === 'quarter' || time === 'trimestral') {
                                        additionalTime = 3 * 30 * 24 * 60 * 60;
                                    }
                        
                                    const newTrialEnd = currentPeriodEnd + additionalTime;
                        
                                    let subscriptionData = serverP.subscriptionData
                                    subscriptionData.expires_at = newTrialEnd
                                    subscriptionData.lastPayment = Date.now()
                                    db.update('servers', metadataP.serverID, {
                                        isPaymented: true,
                                        assinante:true,
                                        payment_status:'paid',
                                        subscriptionData: subscriptionData
                                    })
                                } catch (error) {
                                    console.log(error);
                                }
                            } else {
                                let user = await db.findOne({ colecao: 'users', doc: metadataP.uid })
                                await functions.createAccount({
                                    customer: await functions.createCustomer(user.username, user.email),
                                    payment_status: 'paid',
                                    subscription: crypto.randomBytes(10).toString('hex'),
                                    customer_details:{
                                        email: user.email,
                                        name: user.username,
                                        phone: null
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


router.post('/pix/create', async (req, res) => {
    try {
        let timeMultiply = req.body.timeMultiply
        let time = req.body.time
        let plan = req.body.plan
        let indexPrice = timeMultiply == 1 ? 0 : timeMultiply == 3 ? 1 : 2

        let itemPlan = webConfig.planos[plan][indexPrice]



        
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