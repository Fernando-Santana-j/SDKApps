const axios = require('axios')
const sharp = require('sharp');
const fs = require('fs');
const stripe = require('stripe')(require('./config/web-config').stripe);
const db = require('./Firebase/models');
const webConfig = require('./config/web-config')
const path = require(`path`);
const botConfig = require('./config/bot-config');
const nodemailer = require('nodemailer');
require('dotenv').config()
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const ejs = require('ejs')
const crypto = require('crypto');

async function gerarToken(res, req, session, email, code, tokenName) {
    try {
        const payload = {
            id: session,
            email: email
        };
        let jwtConfig = {
            expiresIn: '6M'
        }
        let configsCookie = { ...webConfig.cookieConfig }
        if (tokenName == 'token') {
            configsCookie.maxAge = 3600000
            jwtConfig.expiresIn = '1h'
        }
        const token = await jwt.sign(payload, process.env.TOKENCODE, jwtConfig);
        await res.cookie(tokenName, token, configsCookie)
        return token;
    } catch (error) {
        return null
    }
}


async function verificarToken(req, res, token, code) {
    // const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return 'invalid'
    try {
        const verified = await jwt.verify(token, process.env.TOKENCODE, (err, decoded) => {
            if (err) {
                return 'invalid'
            }
            return decoded
        });

        return verified
    } catch (err) {
        return 'invalid'
    }
}

function renovarToken(req, res, token, code, tokenName) {
    try {
        const decoded = jwt.verify(token, code, { ignoreExpiration: true });
        const novoToken = gerarToken(res, req, decoded.id, null, process.env.TOKENCODE, tokenName);
        return novoToken;
    } catch (err) {
        return 'invalid'
    }
}



module.exports = {
    gerarToken: gerarToken,
    verifyPermissions: async (user, server, Discord, client) => {
        try {
            let serverDB = await db.findOne({ colecao: "servers", doc: server })
            if (!serverDB) {
                return { error: true, err: "server not found" };
            }
            const guild = await client.guilds.cache.get(server);
            if (!guild) {
                return { error: true, err: "server not found" };
            }

            const member = await guild.members.cache.get(user);

            if (!member) {
                return { error: true, err: "member not found" };
            }

            if (guild.ownerId == member.user.id) {
                return {
                    error: false, perms: {
                        owner: true,
                        botEdit: true,
                        paymentEdit: true,
                        commands: true,
                        commandsAllChannel: true,
                    }
                }
            }
            if (serverDB.permissions) {


                const memberRoles = await member.roles.cache;

                if (memberRoles.size > 1) {
                    const UserRolesPerms = await serverDB.permissions.filter(role => memberRoles.has(role.id));
                    if (UserRolesPerms.length > 0) {
                        let totalPerms = {}
                        await UserRolesPerms.forEach((element) => {
                            let perms = element.perms
                            if (perms.botEdit == true) {
                                totalPerms.botEdit = true
                            }
                            if (perms.paymentEdit == true) {
                                totalPerms.paymentEdit = true
                            }
                            if (perms.commands == true) {
                                totalPerms.commands = true
                            }
                            if (perms.commandsAllChannel == true) {
                                totalPerms.commandsAllChannel = true
                            }
                        })
                        if (!('botEdit' in totalPerms)) {
                            totalPerms.botEdit = false
                        }
                        if (!('paymentEdit' in totalPerms)) {
                            totalPerms.paymentEdit = false
                        }
                        if (!('commands' in totalPerms)) {
                            totalPerms.commands = false
                        }
                        if (!('commandsAllChannel' in totalPerms)) {
                            totalPerms.commandsAllChannel = false
                        }
                        totalPerms.owner = false
                        return { error: false, perms: totalPerms }
                    } else {
                        return {
                            error: false, perms: {
                                botEdit: true,
                                paymentEdit: false,
                                commands: true,
                                commandsAllChannel: false,
                                owner: false
                            }
                        }
                    }
                } else {
                    console.log(`${member.user.username} não possui cargos.`);
                    return { error: true, err: "user not roles" };
                }
            } else {
                return {
                    error: false, perms: {
                        botEdit: true,
                        paymentEdit: false,
                        commands: true,
                        commandsAllChannel: false,
                        owner: false
                    }
                }
            }
        } catch (error) {
            console.log(error);
            return { error: true, err: error }
        }
    },
    authGetState: async (req, res, next) => {
        try {
            console.log(req.session.uid);
            
            if (!req.session.uid) return res.redirect('/?error=Faca login novamente!');

            let user = await db.findOne({colecao:'users',doc:req.session.uid})


    
            if (req.cookies && 'token' in req.cookies) {
                let verify = await verificarToken(req, res, await req.cookies.token, process.env.TOKENCODE)
                if (verify == 'invalid') {
                    await gerarToken(res, req, await req.session.uid, await req.session.email, process.env.TOKENCODE, 'token')
                }
            } else {
                await gerarToken(res, req, await req.session.uid, await req.session.email, process.env.TOKENCODE, 'token')
            }
            if (req.url.includes('/security/pass')) {
                next()
                return
            }
            if (!req.session.pass && !req.url.includes('/security/pass')) {
                return res.redirect(`/security/pass`);
            }
    
            
            
            if (!req.url.includes('/security/code')) {
                let securityExist = 'security' in user
                let emailVerifyExist = securityExist ? 'emailVerify' in user.security : false

                if ((emailVerifyExist == true && user.security.emailVerify == false) || emailVerifyExist == false) {
                    return res.redirect('/security/code/email')
                }

                let securityExist2FA = securityExist ? 'data2fa' in user.security : false

                if (securityExist2FA == false || (securityExist2FA == true && user.security.data2fa.active == false)) {
                    if (req.url.includes('/security/code/2fa')) {
                        return res.redirect('/dashboard')
                    }else{
                        return next()
                    }
                }else {
                    if (securityExist == true && (req.cookies && req.cookies.verify2fa)) {
                        let verify = await verificarToken(req, res, await req.cookies.verify2fa, process.env.TOKENCODE2FA)
                        if (verify == 'invalid') {
                            if (!req.url.includes('/security/code/2fa')) {
                                await res.cookie('verify2fa', '', { httpOnly: true, expires: new Date(0) });
                                return res.redirect('/security/code/2fa')
                            }else{
                                return next()
                            }
                        }
                    }else{
                        await res.cookie('verify2fa', '', { httpOnly: true, expires: new Date(0) });
                        return res.redirect('/security/code/2fa')
                    }
                }
            }
            next()
        } catch (error) {
            console.log(error);
            
        }
    },
    authPostState: async (req, res, next) => {
        try {
            if (!req.session.uid) return res.redirect('/logout?error=Faca login!');
            let user = await db.findOne({colecao:'users',doc:req.session.uid})
            if (user && 'status' in user && user.status && user.status.type != 'active'  ) {
                if (user.status.type == 'banned') {
                    return res.redirect('/logout?error=Sua conta foi banida!')
                }
            };

    
            let verifyToken = await verificarToken(req, res, req.cookies.token)
            if (verifyToken == 'invalid' || !req.cookies.token) {
                try {
                    let newToken = await renovarToken(req, res, req.cookies.token, process.env.TOKENCODE, 'token')
                    if (newToken == 'invalid') {
                        if (!res.headersSent) {
                            res.status(200).json({ success: false, data: 'Logue novamente, seu token e invalido' })
                        }
                    } else {
                        next()
                    }
                } catch (error) {
                    if (!res.headersSent) {
                        res.status(200).json({ success: false, data: 'Não foi possível concluir sua solicitação' })
                    }
                }
            } else {
                next()
            }
        } catch (error) {
            console.log(error);
            
        }
    },
    generateSession: async (req, res, email, uid) => {
        try {
            let token = await gerarToken(res, req, uid, email, process.env.TOKENCODE, 'token')
            return token
        } catch (error) {
            return null
        }
    },
    subscriptionStatus: async (req, res, next) => {
        let server = await db.findOne({ colecao: "servers", doc: req.params.id })
        if ("vitalicio" in server && server.vitalicio == true) {
            next()
            return
        }
        if (server) {
            try {
                if ('bankData' in server && server.bankData.bankID) {
                    let account = await stripe.accounts.retrieve(server.bankData.accountID);
                    if (account.payouts_enabled == false || account.requirements.disabled_reason != null) {
                        let accountLink = await stripe.accountLinks.create({
                            account: account.id,
                            return_url: `${webConfig.host}/server/sales/${server.id}`,
                            refresh_url: `${webConfig.host}/accountLink/${account.id}/${server.id}`,
                            type: 'account_onboarding',
                        });
                        res.redirect(accountLink.url)
                        return
                    }
                }
                const assinatura = await stripe.subscriptions.retrieve(server.subscription);
                if (assinatura) {
                    if ('type' in server && server.type == 'pix') {
                        if (assinatura.status == 'past_due' || assinatura.status == 'canceled') {
                            await db.update('servers', req.params.id, {
                                assinante: false,
                                payment_status: "cancel",
                                isPaymented: false
                            })
                            res.redirect('/dashboard?error=Assinatura vencida!')
                        } else {
                            next()
                        }
                    } else {

                        const tempoUnixConvert = new Date(assinatura.current_period_end * 1000);
                        const hoje = new Date();
                        const diferencaEmMilissegundos = tempoUnixConvert - hoje;
                        const diasRestantes = Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
                        if (server.payment_status == "paused") {
                            res.redirect('/dashboard?error=Sua assinatura esta pausada!')
                            return
                        }
                        switch (assinatura.status) {
                            case 'active':
                                if (diasRestantes <= 3) {
                                    req.query.lastdays = diasRestantes
                                }
                                next()
                                break;
                            case 'canceled':
                                await db.update('servers', req.params.id, {
                                    assinante: false,
                                    payment_status: "cancel",
                                    isPaymented: false
                                })
                                res.redirect('/dashboard?error=Sua assinatura foi cancelada!')
                                break;
                            default:
                                next()
                                break;
                        }

                    }
                } else {
                    res.redirect('/?error=nao foi possivel localizar a assinatura')
                }



            } catch (error) {
                console.log(error);

                res.redirect('/?error=Erro ao verificar os dados da assinatura!')
            }
        } else {
            res.redirect('/?error=Erro ao recuperar o servidor')
            return
        }

    },
    findServers: async (user) => {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/x-www-form-urlencoded'
        };
        let serverResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${user.access_token}`,
                ...headers
            }
        }).then((res) => { return res.data }).catch((err) => {
            return { error: true, err: err }
        })
        if (serverResponse.error) return serverResponse;

        const servidores = await Promise.all(serverResponse.map(async element => {
            element.server_pic = element.icon ? `https://cdn.discordapp.com/icons/${element.id}/${element.icon}.png` : "https://res.cloudinary.com/dgcnfudya/image/upload/v1709143898/gs7ylxx370phif3usyuf.png";
            element.tipo = element.owner ? 'Dono' : (element.permissions === 2147483647 ? 'Administrador' : 'Membro');
            element.assinante = false
            return element;
        }));
        let servidoresFiltrados = servidores.filter(element => element.tipo !== 'Membro')

        return servidoresFiltrados
    },
    reqServerByTime: async (token, functions) => {
        try {
            let promise = await new Promise(async (resolve, reject) => {
                verifyServer(await functions(token))
                async function verifyServer(server) {
                    if (server.error) {
                        let time = (parseFloat(server.err.response.data.retry_after) * 1000)
                        return setTimeout(async () => {
                            let newServer = await functions(token)
                            resolve(newServer)
                        }, time)

                    } else {
                        resolve(server)
                    }
                }
            })
            return await promise
        } catch (error) {
            console.log(error);
        }
    },
    pausarAssinatura: async (subscriptionID, stripe) => {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionID, {
                pause_collection: {
                    behavior: 'void' // Pausa a coleta de pagamentos sem modificar a assinatura
                }
            });
            return subscription;
        } catch (error) {
            return { error: true, err: error };
        }
    },

    retomarAssinatura: async (subscriptionID, stripe) => {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionID, {
                pause_collection: null // Retoma a coleta de pagamentos
            });
            return subscription;
        } catch (error) {
            return { error: true, err: error };
        }
    },

    cancelarAssinatura: async (subscriptionID, stripe) => {
        try {
            const subscription = await stripe.subscriptions.del(subscriptionID);
            return subscription;
        } catch (error) {
            return { error: true, err: error };
        }
    },

    comprimAndRecort: async (arquivoOrigem, novoCaminho) => {
        const metadata = await sharp(arquivoOrigem).metadata();
        return await sharp(arquivoOrigem, { animated: metadata.pages > 1 })
            [metadata.format === 'gif' && metadata.pages > 1 ? 'gif' : 'png']({ quality: 70 })
            .toFile(novoCaminho)
            .then(() => fs.unlink(arquivoOrigem))
            .catch(err => ({ error: true, err }));
    },
    formatarMoeda: (numeroCentavos) => {
        const valorReal = numeroCentavos / 100;
        return valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    getDatesLast7Days: async (dates, formatdate) => {
        if (!Array.isArray(dates)) {
            dates = []
        }
        let getLast7Days = () => [...Array(7)].map((_, i) => {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}`;
        });
        const contagemDatas = {};
        await getLast7Days().forEach(async data1 => {
            const datasIguais = await dates.filter(data2 => data2.startsWith(data1));
            const contagem = datasIguais.length;
            contagemDatas[data1] = contagem;
        });
        return contagemDatas
    },
    formatDate: async (data) => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return dia + '/' + mes + '/' + ano;
    },
    discordDB: async (imagePath, client, Discord, isFullPath = false) => {
        const bannerPath = isFullPath ? imagePath : path.join(__dirname, imagePath);
        const file = await fs.readFileSync(bannerPath);
        const buffer = Buffer.from(file, 'binary');
        const metadata = await sharp(buffer).metadata();
        
        const newBuffer = await sharp(buffer, { animated: metadata.pages > 1 })
            [metadata.format === 'gif' && metadata.pages > 1 ? 'gif' : 'jpeg']()
            .toBuffer();
            
        const attachment = new Discord.AttachmentBuilder(newBuffer, { 
            name: `image.${metadata.format === 'gif' && metadata.pages > 1 ? 'gif' : 'jpg'}` 
        });

        const dbChannel = await client.guilds.cache.get(botConfig.dbServer)
            .channels.cache.get(botConfig.dbChannel);
            
        const dbres = await dbChannel.send({ files: [attachment] });
        
        return dbres.attachments.first().url;
    },
    addFreeMonthSubscription: async (subscriptionID,) => {
        try {
            const { current_period_end } = await stripe.subscriptions.retrieve(subscriptionID);
            const newEndDate = current_period_end + 30 * 24 * 60 * 60;
            await stripe.subscriptions.update(subscriptionID, {
                cancel_at: newEndDate,
                proration_behavior: 'none',
            });

            console.log('Assinatura atualizada com sucesso.');
        } catch (error) {
            console.error('Erro ao atualizar a assinatura:', error.message);
        }
    },
    createCustomer: async (name, email) => {
        const customer = await stripe.customers.create({
            name: name,
            email: email,
        });
        return customer.id
    },
    createAccount: async (data, type, price, functions) => {
        let user = await db.findOne({ colecao: 'users', doc: data.metadata.uid })
        if (type == 'pix') {
            const subscription = await stripe.subscriptions.create({
                // customer: user.customer,
                customer: await functions.createCustomer('test', 'test@gmail.com'),
                items: [{
                    price: price.id,
                }],
                collection_method: 'send_invoice',
                days_until_due: 5,
            });
            data.subscription = await subscription.id
            data.created = subscription.created,
                data.payment_status = await subscription.status
            data.customer = user.customer
            data.customer_details = {
                email: null,
                name: null,
                phone: null
            }
        }
        let servers = await functions.reqServerByTime(user, functions.findServers)
        let filterServers = await servers.find(server => server.id == data.metadata.serverID)

        var dataUnixConvert = new Date(parseInt(data.created) * 1000)
        dataUnixConvert.setMonth(dataUnixConvert.getMonth() + 1);
        var novaDataUnix = Math.floor(dataUnixConvert.getTime() / 1000);
        let serverADD = {
            assinante: true,
            type: type,
            id: data.metadata.serverID,
            subscription: data.subscription,
            plan: data.metadata.plan,
            tipo: filterServers.tipo,
            server_pic: filterServers.server_pic,
            name: filterServers.name,
            payment_status: data.payment_status,
            isPaymented: true,
            vendasActive: true,
            botActive: true,
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
        db.create('servers', data.metadata.serverID, serverADD)


        try {
            db.delete(`preServers`, data.metadata.serverID)
        } catch (error) { }
    },
    renovarPix: async (subscriptionID, time) => {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionID);
            const currentPeriodEnd = Math.floor(Date.now() / 1000);
            const billingInterval = time ? time : subscription.items.data[0].price.recurring.interval;
            let additionalTime;

            if (billingInterval === 'month' || billingInterval == 'mensal') {
                additionalTime = 30 * 24 * 60 * 60;
            } else if (billingInterval === 'year' || billingInterval == 'anual') {
                additionalTime = 365 * 24 * 60 * 60;
            } else if (billingInterval === 'quarter' || billingInterval === 'trimestral') {
                additionalTime = 3 * 30 * 24 * 60 * 60;
            }

            const newTrialEnd = currentPeriodEnd + additionalTime;

            await stripe.subscriptions.update(subscriptionID, {
                trial_end: newTrialEnd,
                proration_behavior: 'none',
            });
        } catch (error) {
            console.log(error);

        }
    },
    sendEmail: async (email, subject, html) => {
        try {
            const transporter = await nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'sdkapps2023@gmail.com',
                    pass: 'rbio wgsd reox fsap'
                }
            });
            await transporter.sendMail({
                from: 'SDKApps <sdkapps2023@gmail.com>',
                to: email,
                subject: subject,
                html: html,
                headers: {
                    'X-Mailer': 'Nodemailer',
                    'List-Unsubscribe': '<mailto:unsubscribe@skapps.com.br>',
                },
            });
        } catch (error) {
            console.log(error);
        }
    },

    criptografar: async (text, key) => {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(process.env.ALGORITHM, Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    },

    descriptografar:async (encrypted, key) => {
        const [iv, data]= await encrypted.split(':')
        const decipher = crypto.createDecipheriv(process.env.ALGORITHM, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },
    readTemplate: async (relativePath, data)=>{
        let caminho = await path.join(__dirname, '/templates',relativePath)
        return await ejs.renderFile(caminho, data);
    }
}