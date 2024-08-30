const express = require('express');
const router = express.Router();

const stripe = require('stripe')(require('../config/web-config').stripe);

const db = require('../Firebase/models')
const fs = require('fs');
const functions = require('../functions');
const webConfig = require('../config/web-config');
const sharp = require('sharp');

const axios = require('axios');

router.post('/subscription/create', async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.body.uid })

        let time = req.body.time
        let plan = req.body.plan
        let indexPrice = time == 1 ? 0 : time == 3 ? 1 : 2

        let itemPlan = webConfig.planos[plan][indexPrice]

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            line_items: [{
                price: itemPlan.id,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${req.body.host}/server/${req.body.serverID}`,
            cancel_url: `${req.body.host}/payment/${req.body.serverID}`,
            metadata: {
                plan: req.body.plan,
                serverID: req.body.serverID,
                uid: req.body.uid,
                time: req.body.time,
                action: 'newSubscription'
            },
            customer: user.customer
        });
        db.create('preServers', req.body.serverID, {
            serverID: req.body.serverID,
            uid: req.body.uid,
            plan: req.body.plan,
            time: req.body.time,
            sessionID: session.id
        })
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
        res.status(200).json({ success: false, data: "Erro ao redirecionar para o checkout!" })
    }
})



router.post('/webhook/stripe/payment', async (req, res) => {
    let data = req.body.data.object
    let type = req.body.type

    switch (type) {
        case 'checkout.session.completed':
            if (data.status == 'complete') {
                if (data.metadata.action == 'productCompra') {
                    require("../Discord/discordIndex").sendProductPayment({
                        serverID: data.metadata.serverID,
                        userID: data.metadata.user,
                        carrinhos: data.metadata.products,
                    }, data.payment_intent, 'stripe')
                }
                if (data.metadata.action == 'newSubscription') {
                    let time = data.metadata.time
                    let plan = data.metadata.plan
                    let indexPrice = time == 1 ? 0 : time == 3 ? 1 : 2

                    let itemPlan = webConfig.planos[plan][indexPrice]
                    functions.createAccount(data, 'stripe', itemPlan.id,functions)
                }
                if (data.metadata.action == 'cobrancaPay') {
                    require("../Discord/discordIndex").sendDiscordMensageUser(data.metadata.user, '✅ Pagamento concluido!', `O pagamento da sua ultima cobrança foi concluido com sucesso.`, null, null)
                    require("../Discord/discordIndex").sendDiscordMensageUser(data.metadata.userCobrador, '✅ cobranca paga!', `O usuario com id ${data.metadata.user} pagou a sua ultima cobrança.`, null, null)
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
            if (data.metadata.action == 'newSubscription') {
                let time = data.metadata.time
                let plan = data.metadata.plan
                let indexPrice = time == 1 ? 0 : time == 3 ? 1 : 2

                let itemPlan = webConfig.planos[plan][indexPrice]
                functions.createAccount(data, 'stripe', itemPlan.id,functions)
                return
            }
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
    res.sendStatus(200)
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
        if (server.bankData && server.bankData.bankID) {
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
            let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
            db.update('servers', req.body.serverID, {
                bankData: {
                    userRef: req.session.uid,
                    nome: req.body.name,
                    cpf: req.body.cpf,
                    accountID: account.id,
                    bankID: bank.id,
                    mercadoPagoToken: server.bankData && server.bankData.mercadoPagoToken ? server.bankData.mercadoPagoToken : null
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
        if (server.bankData && server.bankData.bankID) {
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
        return res.redirect('/?error=Erri ao recuperar a sessao!')
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



router.post('/subscription/exist', async (req, res) => {

    try {
        let preserver = await db.findOne({ colecao: `preServers`, doc: req.body.serverID })
        const checkout = await stripe.checkout.sessions.retrieve(preserver.sessionID);
        if (checkout && checkout.status == 'complete' && checkout.payment_status == 'paid') {
            let subscription = await stripe.subscriptions.retrieve(checkout.subscription)
            let time = data.metadata.time
            let plan = data.metadata.plan
            let indexPrice = time == 1 ? 0 : time == 3 ? 1 : 2

            let itemPlan = webConfig.planos[plan][indexPrice]
            functions.createAccount({
                payment_status: checkout.payment_status,
                subscription: checkout.subscription,
                metadata: {
                    serverID: preserver.serverID,
                    uid: preserver.uid,
                    plan: preserver.plan
                },
                created: subscription.created,
                customer_details: {
                    email: null,
                    name: null,
                    phone: null
                },
                customer: subscription.customer

            }, 'stripe',itemPlan.id,functions)
            if (!res.headersSent) {
                res.status(200).json({ success: true })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro!' })
            }
        }

    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro!' })
        }
    }
})
module.exports = router;



// stripe.accounts.del('acct_1OsBocIOPwdTmaXd');


