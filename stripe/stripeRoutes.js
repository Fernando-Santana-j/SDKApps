const express = require('express');
const router = express.Router();

const stripe = require('stripe')(require('../config/web-config').stripe);

const db = require('../Firebase/models')
const fs = require('fs');
const functions = require('../functions');
const webConfig = require('../config/web-config');
const sharp = require('sharp');

const axios = require('axios')

router.post('/subscription/create', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: req.body.plan == 1 ? webConfig.product1 : req.body.plan == 2 ? webConfig.product2 : webConfig.product3,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${req.body.host}/server/${req.body.serverID}`,
            cancel_url: `${req.body.host}/payment/${req.body.serverID}`,
            metadata: {
                plan: req.body.plan,
                serverID: req.body.serverID,
                uid: req.body.uid,
                action: 'newSubscription'
            }
        });

        res.status(200).json({ success: true, url: session.url })
    } catch (error) {
        console.error('Erro ao iniciar o checkout:', error);
        res.status(200).json({ success: false })
    }
})


router.post('/subscription/update', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let session = await stripe.billingPortal.sessions.create({
                customer: server.subscriptionData.customer,
            });
            res.status(200).json({ success: true, data: session.url })
        }
    } catch (error) {
        console.error('Erro ao iniciar o checkout:', error);
        res.status(200).json({ success: false, data:"Erro ao redirecionar para o checkout!" })
    }
})



router.post('/webhook/stripe/payment', async (req, res) => {
    let data = req.body.data.object
    let type = req.body.type
    switch (type) {
        case 'checkout.session.completed':
            if (data.status == 'complete') {
                if (data.metadata.action == 'newSubscription') {
                    let user = await db.findOne({ colecao: 'users', doc: data.metadata.uid })
                    let servers = await functions.reqServerByTime(user, functions.findServers)
                    let filterServers = await servers.find(server => server.id == data.metadata.serverID)

                    var dataUnixConvert = new Date(parseInt(data.created) * 1000)
                    dataUnixConvert.setMonth(dataUnixConvert.getMonth() + 1);
                    var novaDataUnix = Math.floor(dataUnixConvert.getTime() / 1000);
                    let serverADD = {
                        assinante: true,
                        id: data.metadata.serverID,
                        subscription: data.subscription,
                        plan: data.metadata.plan,
                        tipo: filterServers.tipo,
                        server_pic: filterServers.server_pic,
                        name: filterServers.name,
                        payment_status: data.payment_status,
                        isPaymented: true,
                        subscriptionData: {
                            lastPayment: data.created,
                            created: data.created,
                            email: data.customer_details.email,
                            name: data.customer_details.name,
                            phone: data.customer_details.phone,
                            expires_at: novaDataUnix,
                            customer: data.customer
                        }
                    }
                    let newServer = []
                    if (user.server) {
                        newServer = user.server
                        newServer.push(data.metadata.serverID)
                    } else {
                        newServer.push(data.metadata.serverID)
                    }
                    db.update('users', data.metadata.uid, {
                        servers: newServer
                    })
                    db.create('servers', data.metadata.serverID, serverADD)
                }
                if (data.metadata.action == 'productCompra') {
                    require("../Discord/discordIndex").sendProductPayment({
                        serverID:data.metadata.serverID,
                        userID: data.metadata.user,
                        carrinhos: data.metadata.products,
                    },data.payment_intent,'stripe')
                }
            }
            break;
        case 'invoice.payment_failed':
            if (data.billing_reason == "subscription_cycle") {
                if (data.attempt_count == 3) {
                    let server = await db.findOne({ colecao: 'servers', where: ['subscription', "==", data.subscription] })
                    if (server.error) {
                        return
                    }
                    await functions.pausarAssinatura(server.subscription, stripe)
                    db.update('servers', server.id, {
                        payment_status: 'paused',
                        isPaymented: false,
                    })
                    // pausar a assinatura do usuario
                } else if (data.attempt_count == 1) {
                    let server = await db.findOne({ colecao: 'servers', where: ['subscription', "==", data.subscription] })
                    if (server.error) {
                        return
                    }
                    if (server.configs && server.configs.sendPaymentStatus) {
                        require('../Discord/discordIndex').sendPaymentStatus(server.id, 3)
                    }
                    db.update('servers', server.id, {
                        payment_status: 'pending',
                        isPaymented: false,
                    })
                    
                    // integrar codigo de pendencia na fatura
                }
                
            }
            break;
        case 'invoice.payment_succeeded':
            if (data.status == 'paid') {
                let server = await db.findOne({ colecao: 'servers', where: ['subscription', "==", data.subscription] })
                if (server.error) {
                    return
                }
                if (server.payment_status == 'paused') {
                    let returnSubscription = await functions.retomarAssinatura(server.subscription, stripe)
                    console.log(returnSubscription);
                }
                let subscriptionData = server.subscriptionData
                subscriptionData.expires_at = data.lines.data[0].period.end
                subscriptionData.lastPayment = data.lines.data[0].period.start
                db.update('servers', server.id, {
                    payment_status: data.status,
                    isPaymented: data.paid,
                    subscriptionData: subscriptionData
                })
            }

            break
        case 'invoice.upcoming':

            break
        default:
            break;
    }

    res.status(200).end();
})

router.post('/addDadosBanc', async (req, res) => {
    try {
        if (!req.session.uid) {
            res.status(200).json({ success: false, data: 'Sessao invalida' })
            return
        }
        var user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        var server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        const partesNome = req.body.name.split(" ");
        const nome = partesNome[0];
        const sobrenome = partesNome.slice(1).join(" ");
        let agencia = req.body.agencia;
        let numeroBanco = req.body.bank;
        while (agencia.length < 4) {
            agencia = "0" + agencia;
        }

        while (numeroBanco.length < 3) {
            numeroBanco = "0" + numeroBanco;
        }

        const numeroConta = numeroBanco + "-" + agencia
        if (server.bankData) {
            res.status(200).json({ success: false, data: "Você ja tem uma conta bancaria cadastrata!" })
        } else {
            const account = await stripe.accounts.create({
                country: 'BR',
                type: 'express',
                capabilities: {
                    card_payments: {
                        requested: true,
                    },
                    transfers: {
                        requested: true,
                    },
                },
                business_type: 'individual',
                individual: {
                    political_exposure: 'none',
                    first_name: nome,
                    last_name: sobrenome,
                    email: user.email,
                    address: {
                        country: 'BR',
                    },
                    id_number: req.body.cpf
                },
                business_profile: {
                    name: 'SDK Vendedor',
                    mcc: '7299',
                    url: 'https://skapps.com.br',
                },
            })
            let bank = await stripe.accounts.createExternalAccount(account.id, {
                external_account: {
                    object: 'bank_account',
                    country: 'BR',
                    currency: 'BRL',
                    account_holder_name: req.body.name,
                    account_holder_type: 'individual',
                    routing_number: numeroConta,
                    account_number: req.body.numero
                }
            });
            let accountLink = await stripe.accountLinks.create({
                account: account.id,
                return_url: `${webConfig.host}/server/sales/${req.body.serverID}`,
                refresh_url: `${webConfig.host}/accountLink/${account.id}/${req.body.serverID}`,
                type: 'account_onboarding',
            });
            db.update('servers', req.body.serverID, {
                bankData: {
                    userRef: req.session.uid,
                    nome: req.body.name,
                    cpf: req.body.cpf,
                    accountID: account.id,
                    bankID: bank.id
                }
            })
            res.status(200).json({ success: true, data: accountLink.url })
        }
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: "Erro ao adicionar a conta bancaria" })
    }
})

router.post('/account/modify', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (server.bankData) {
            const accountLink = await stripe.accountLinks.create({
                account: server.bankData.accountID,
                refresh_url: `${webConfig.host}/server/sales/${req.body.serverID}`,
                return_url: `${webConfig.host}/server/sales/${req.body.serverID}`,
                type: 'account_onboarding',
            });
            res.status(200).json({ success: true, data: accountLink.url })
        } else {
            res.status(200).json({ success: false, data: "Primeiro cadastre os seus dados bancarios na pagina de vendas!" })
        }

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: "Erro ao adicionar a conta bancaria" })
    }
})


router.get('/accountLink/:account/:serverID', async (req, res) => {
    if (!req.session.uid || !req.params.account) {
        return res.redirect('/')
    }
    const accountLink = await stripe.accountLinks.create({
        account: req.params.account,
        return_url: `${webConfig.host}/server/sales/${req.params.serverID}`,
        refresh_url: `${webConfig.host}/accountLink/${req.params.account}/${req.params.serverID}`,
        type: 'account_onboarding',
    });
    console.log(accountLink);
    res.redirect(accountLink.url)
})

router.get('/subscription/get/:serverID',async(req,res)=>{
    try {
        if (req.params.serverID) {
            let server = await db.findOne({colecao:"servers",doc:req.params.serverID})
            let session = await stripe.billingPortal.sessions.create({
                customer: server.subscriptionData.customer,
                return_url: `${webConfig.host}/dashboard`
            });
            if (session) {
                res.render('updatePayment',{url:session.url})
            }
        }
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;

// stripe.accounts.del('acct_1OsBocIOPwdTmaXd');


