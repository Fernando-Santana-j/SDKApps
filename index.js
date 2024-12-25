//TODO-------------importes------------
const Discord = require("discord.js");
const { Events, GatewayIntentBits } = require('discord.js');
const db = require('./Firebase/models.js')
const dataBase = require('./Firebase/db.js')
const express = require('express')
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session')
const path = require('path');
const multer = require('multer')
const cron = require('node-cron');
const cookieParser = require("cookie-parser");
const webConfig = require('./config/web-config.js')

const botConfig = require('./config/bot-config.js');
const { default: axios } = require("axios");

const functions = require('./functions.js');

const cors = require('cors');


const stripe = require('stripe')(require('./config/web-config').stripe);


//TODO------------Configs--------------
const app = express();



const corsOptions = {
    origin: 'https://api.mercadopago.com'
};
app.use(cors(corsOptions));


require('dotenv').config()

const client = new Discord.Client({ intents: botConfig.intents })

require('./Discord/discordIndex.js')(Discord, client)


client.login(botConfig.discordToken)


app.use(session(webConfig.session));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(express.static('views'));
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use(express.static('src'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs');


app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/uploads/')
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(42).toString('hex');
        const originalName = file.originalname;
        const extension = originalName.substr(originalName.lastIndexOf('.'));
        const fileName = codigo + extension;
        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });



async function copyAccount() {
    let s = await db.findOne({ colecao: 'servers', doc: '1315776941671841792' })
    db.create('servers', '1316103661113577495', s)
}





//TODO------------WEB PAGE--------------


//TODO Discord Routes
const discordRouter = require('./Discord/discordRoutes.js')
app.use('/', discordRouter);


//TODO Mercado Pago Routes

const mercadoPago = require('./routes/mercadoPago.js')
app.use('/', mercadoPago);

//TODO STRIPE ROUTES

const stripeRoutes = require('./stripe/stripeRoutes.js');

app.use('/', stripeRoutes);


//TODO PRODUTOS ROUTES

const produtoRoutes = require('./stripe/productsRoutes.js');

app.use('/', produtoRoutes);

//TODO SEGURANCA ROUTES


const securityRoutes = require('./routes/security.js');
const { error } = require("console");

app.use('/', securityRoutes);


app.get('/', async (req, res) => {
    res.render('index', { host: `${webConfig.host}`, isloged: req.session.uid && req.session.email ? true : false, user: { id: req.session.uid ? req.session.uid : null }, error: req.query.error ? req.query.error : '' })
})


app.get('/dashboard', functions.authGetState, async (req, res) => {

    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await functions.reqServerByTime(user, functions.findServers)

    let servidoresEnd = []
    if (server.error) {
        if (user.lastServers) {
            for (let index = 0; index < user.lastServers.length; index++) {
                const element = user.lastServers[index];
                let Findserver = await db.findOne({ colecao: 'servers', doc: element })
                if (Findserver.error == false) {
                    servidoresEnd.push(Findserver)
                }
            }
        } else {
            res.redirect('/redirect/discord')
        }
    } else {
        let lastServers = []
        for (let i = 0; i < server.length; i++) {
            let element = server[i]

            let Findserver = await db.findOne({ colecao: 'servers', doc: element.id })
            if (Findserver.error == false) {
                servidoresEnd.push(Findserver)
                lastServers.push(Findserver.id)
            } else {
                servidoresEnd.push(element)
            }

        }
        db.update('users', user.id, {
            lastServers: lastServers
        })
    }
    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if ('ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('dashboard', { host: `${webConfig.host}`, chatItens: chatItens, user: user, servers: servidoresEnd })

})


app.get('/user/config', functions.authGetState, async (req, res) => {

    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }

    res.render('userConfig', { host: `${webConfig.host}`, user: user })

})


app.get('/logout', async (req, res) => {
    try {
        try {
            res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
            res.cookie('verifyEmail', '', { httpOnly: true, expires: new Date(0) });
            res.cookie('verify2fa', '', { httpOnly: true, expires: new Date(0) });
        } catch (error) { }
        if (req.session.uid) {
            const sessionID = req.session.id;
            req.sessionStore.destroy(sessionID, (err) => {
                if (err) {
                    return console.error(err)
                } else {
                    res.redirect(`${req.query.redirect ? req.query.redirect : '/'}?error=${req.query.error ? req.query.error : ''}`)
                }
            })

        } else {
            res.redirect(`${req.query.redirect ? req.query.redirect : '/'}?error=${req.query.error ? req.query.error : ''}`)
        }
    } catch (error) {
        res.redirect(`${req.query.redirect ? req.query.redirect : '/'}?error=${req.query.error ? req.query.error : ''}`)
    }
})


app.get('/payment/:id', async (req, res) => {
    if (!req.params.id || !req.session.uid) {
        res.redirect('/?error=Parametros invalidos!')
        return
    }
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    res.render('payment', { host: `${webConfig.host}`, user: user })
})

app.get('/server/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))

    if (!server || !user) {
        res.redirect('/?error=Erro ao recuperar o servidor ou o seu usuario!')
        return
    }
    if (server.hasOwnProperty('bankData')) {
        delete server.bankData
    }

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        console.log(verifyPerms);
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }
    if ('botConfig' in verifyPerms.perms && verifyPerms.perms.botEdit == false) {
        res.redirect('/dashboard?error=Você não tem permissão para editar esse bot')
        return
    }

    let analytics = await db.findOne({ colecao: "analytics", doc: req.params.id })

    let comprasConcluidas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas completas"], functions.formatDate))
    let comprasCanceladas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas canceladas"], functions.formatDate))

    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('painel', { host: `${webConfig.host}`, chatItens: chatItens, user: user, server: server, serverString: JSON.stringify(server), comprasCanceladas: comprasCanceladas, comprasConcluidas: comprasConcluidas })
})


app.get('/server/sales/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (!server) {
        return
    }
    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }

    if ('botConfig' in verifyPerms.perms && verifyPerms.perms.botConfig == false) {
        res.redirect(`/dashboard?error=Você não tem permissão para editar esse bot`)
        return
    }
    let bankData = server.bankData ? server.bankData : null

    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    const channels = guild.channels.cache;

    const textChannels = channels.filter(channel => channel.type === 0);
    let adminServer = db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    const roles = guild.roles.cache;
    const filteredRoles = roles.filter(role => {
        return role.name !== '@everyone' && role.managed !== true;
    });
    const roleObjects = filteredRoles.map(role => {
        return {
            name: role.name,
            id: role.id
        };
    });


    let productsSimple = 'products' in server ? server.products.filter(product => {
        let typeProduct = 'typeProduct' in product ? product.typeProduct : 'normal';
        return typeProduct != 'multiple';
    }).map(product => {
        let estoqueNumber = 0
        let typeProduct = 'typeProduct' in product ? product.typeProduct : 'normal'
        switch (typeProduct) {
            case 'single':
                estoqueNumber = product.estoque
                break;
            case 'subscription':

                break;
            case 'normal':
                estoqueNumber = product.estoque.length
                break;
        }
        return {
            name: product.productName,
            desc: `Preço: ${functions.formatarMoeda(product.price)} • Estoque: ${estoqueNumber}`,
            value: product.productID
        }
    }) : []

    res.render('sales', { perms: verifyPerms.perms, chatItens: chatItens, host: `${webConfig.host}`, bankData: bankData, user: user, server: server, cargosString: JSON.stringify(roleObjects), channels: textChannels, channelsString: JSON.stringify(textChannels), formatarMoeda: functions.formatarMoeda, productString: JSON.stringify(productsSimple) })
})


app.get('/server/personalize/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.plan == 'inicial') {
        res.redirect(`/server/${serverID}?error=Seu plano não dá acesso a essa funcionalidade`)
        return
    }
    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.botEdit == false) {
        res.redirect(`/dashboard?error=Você não tem permissão para editar esse bot`)
        return
    }
    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    const roles = guild.roles.cache;
    const filteredRoles = roles.filter(role => {
        return role.name !== '@everyone' && role.managed !== true;
    });
    const roleObjects = filteredRoles.map(role => {
        return {
            name: role.name,
            id: role.id
        };
    });
    const channels = guild.channels.cache;

    const textChannels = channels.filter(channel => channel.type === 0);
    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('personalize', { host: `${webConfig.host}`, channels: textChannels, chatItens: chatItens, cargos: roleObjects, user: user, server: server })
})

app.get('/server/backups/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.plan == 'inicial') {
        res.redirect(`/server/${serverID}?error=Seu plano não dá acesso a essa funcionalidade`)
        return
    }
    let backupCode
    let authLink
    if ('backupCode' in server == false) {
        //backupCode
        backupCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
        while (await db.findOne({ colecao: 'servers', where: ['backupCode', '==', backupCode] }).then(data => data.error == false)) {
            backupCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
            break
        }

        //authLink
        const authData = new URLSearchParams({
            client_id: webConfig.clientId,
            response_type: "code",
            redirect_uri: webConfig.redirectAuthVerify,
            scope: ["guilds.join", "gdm.join", "guilds", "identify", "email", "connections"].join(" "),
            state: serverID
        });
        let backups = 'backups' in server ? server.backups : {}
        backups.authLink = "https://discord.com/oauth2/authorize?" + authData.toString()
        authLink = backups.authLink


        db.update('servers', serverID, {
            backupCode: backupCode,
            backups: backups
        })
    } else {
        backupCode = server.backupCode
        authLink = server.backups.authLink
    }
    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }
    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    const channels = guild.channels.cache;

    const textChannels = channels.filter(channel => channel.type === 0);

    res.render('backups', { host: `${webConfig.host}`, backupCode: backupCode, authLink: authLink, user: user, channelsString: JSON.stringify(textChannels), server: server })
})


app.get('/server/analytics/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.plan == 'inicial') {
        res.redirect(`/server/${serverID}?error=Seu plano não dá acesso a essa funcionalidade`)
        return
    }
    let analytics = await db.findOne({ colecao: "analytics", doc: req.params.id })

    let comprasConcluidas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas completas"], functions.formatDate))
    let comprasCanceladas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas canceladas"], functions.formatDate))
    let canceladosEstoque = JSON.stringify(await functions.getDatesLast7Days(analytics["cancelados estoque"], functions.formatDate))
    let reebolsos = JSON.stringify(await functions.getDatesLast7Days(analytics["reebolsos"], functions.formatDate))
    let paymentMetod
    if (analytics.pagamentos) {
        paymentMetod = analytics.pagamentos
    } else {
        paymentMetod = {
            "PIX": 0,
            "card": 0,
            "boleto": 0,
        }
    }
    paymentMetod = JSON.stringify(paymentMetod)
    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('analytics', { host: `${webConfig.host}`, chatItens: chatItens, user: user, server: server, paymentMetod: paymentMetod, canceladosEstoque: canceladosEstoque, reebolsos: reebolsos, comprasCanceladas: comprasCanceladas, comprasConcluidas: comprasConcluidas })
})


app.get('/server/permissions/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.owner == false) {
        res.redirect(`/dashboard?error=Você não tem permissão para editar esse bot`)
        return
    }

    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    let roles = guild.roles.cache
    let rolesFilter = roles.filter(role => role.managed == false && role.mentionable == false && role.name != "@everyone")
    let adminServer = db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('perms', { host: `${webConfig.host}`, chatItens: chatItens, user: user, server: server, roles: JSON.stringify(rolesFilter) })
})


app.get('/server/ticket/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.plan == 'inicial') {
        res.redirect(`/server/${serverID}?error=Seu plano não dá acesso a essa funcionalidade`)
        return
    }
    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.botEdit == false) {
        res.redirect(`/dashboard?error=Você não tem permissão para editar esse bot`)
        return
    }

    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    const channels = guild.channels.cache;

    const textChannels = channels.filter(channel => channel.type === 0);

    let roles = guild.roles.cache
    let rolesFilter = roles.filter(role => role.managed == false && role.name != "@everyone")

    
    let ticketOptions = {
        motivos: [],
        permissions: [],
        channel: '',
        atend: {
            start: '',
            end: '',
            days: []
        },
        avaliacao: '',
        log: ''
    }

    if ('ticketOptions' in server) {
        ticketOptions = server.ticketOptions
    }

    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }
    res.render('ticket', { host: `${webConfig.host}`, chatItens: chatItens, ticketOptions: ticketOptions, roles: JSON.stringify(rolesFilter), user: user, server: server, channels: textChannels, })
})

app.get('/server/cupom/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if ('pass' in user == true) {
        delete user.security
    }
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard?error=Erro ao verificar a permissão do bot')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.botEdit == false) {
        res.redirect(`/dashboard?error=Você não tem permissão para editar esse bot`)
        return
    }

    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let guild = guilds.get(serverID)
    const channels = guild.channels.cache;

    const textChannels = channels.filter(channel => channel.type === 0);

    let adminServer = await db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
    let chatItens = []
    if (adminServer && 'ticketOptions' in adminServer) {
        chatItens = adminServer.ticketOptions.motivos
    }



    res.render('cupom', { host: `${webConfig.host}`, chatItens: chatItens, user: user, server: server, channels: textChannels, })
})



app.get('/server/config/:id', functions.authGetState, functions.subscriptionStatus, async (req, res) => {
    try {
        let serverID = req.params.id
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if ('pass' in user == true) {
            delete user.security
        }
        let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
        const guilds = client.guilds.cache;
        const isBotInServer = guilds.has(serverID);
        if (!isBotInServer) {
            res.redirect(`/addbot/${serverID}`)
            return
        }
        let guild = guilds.get(serverID)
        const channels = guild.channels.cache;

        const textChannels = channels.filter(channel => channel.type === 0);
        let adminServer = db.findOne({ colecao: 'servers', doc: process.env.ADMINSERVER })
        let chatItens = []
        if (adminServer && 'ticketOptions' in adminServer) {
            chatItens = adminServer.ticketOptions.motivos
        }

        res.render('config', { host: `${webConfig.host}`, chatItens: chatItens, user: user, channels: textChannels, server: server })
    } catch (error) {

    }
})



app.get('/help', (req, res) => {
    res.redirect('https://discord.com/channels/1246186853241978911/1246186854349537295')
})



app.get('/redirect/sucess', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})


app.get('/redirect/cancel', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})

app.get('/redirect/discord', (req, res) => {
    res.redirect(webConfig.loginURL)
})


app.get('/adm', (req, res) => {
    res.render('admin', { host: `${webConfig.host}` })
})

app.get('/copyText/:copy', async (req, res) => {
    res.render('copyText', { host: `${webConfig.host}`, copyText: req.params.copy })
})


//-----POST-------

app.post('/firebase/configs', functions.authPostState, (req, res) => {
    res.status(200).json({ success: true, projectId: require('./config/firebase.json').project_id, data: require('./config/firebase.json') })
})

app.post('/accout/delete', functions.authPostState, async (req, res) => {
    try {
        if (!req.session.uid || !req.body.serverID) {
            res.status(200).json({ success: false, data: 'Erro ao tentar deletar a conta!' })
            return
        }
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (server) {
            if (server.products && server.products.length > 0) {
                for (let index = 0; index < server.products.length; index++) {
                    try {
                        let prod = await axios({
                            method: 'post',
                            url: '/product/delete',
                            data: {
                                productID: element.productID,
                                serverID: req.body.serverID
                            }
                        })
                    } catch (error) {

                    }
                }
            }


            await stripe.subscriptions.cancel(server.subscription)
            if (server.bankData && server.bankData.accountID) {
                await stripe.accounts.del(server.bankData.accountID)
            }
            db.delete('servers', req.body.serverID)
            db.delete('analytics', req.body.serverID)
            res.status(200).json({ success: true })
        } else {
            res.status(200).json({ success: false, data: 'Erro ao tentar deletar a conta!' })
        }

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar deletar a conta!' })
    }
})


app.post("/config/notify", functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        let newconfigs = {}
        if (server.configs) {
            server.configs.sendPaymentStatus = true
            newconfigs = server.configs
        } else {
            newconfigs.sendPaymentStatus = true
        }
        db.update("servers", req.body.serverID, {
            configs: newconfigs
        })
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(200).json({ success: false })
    }
})


app.post('/config/change', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server.error == false) {
            let configs = {
                noticeChannel: null,
                publicBuyChannel: null
            }
            if ('configs' in server) {
                configs = server.configs
            }
            configs.publicBuyChannel
            configs.noticeChannel = req.body.noticeChannel
            configs.publicBuyChannel = req.body.publicBuyChannel
            db.update('servers', req.body.serverID, {
                configs: configs
            })
        }
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(200).json({ success: false, data: 'Erro ao salvar as configurações' })
        console.log(error);
    }
})

app.post('/config/blockbank', functions.authPostState, async (req, res) => {
    try {
        let bank = req.body.bank
        let possiveisBanks = ['Banco Inter S.A.', "Picpay Serviços S.A."]
        if (!possiveisBanks.includes(bank)) {
            res.status(200).json({ success: false, data: 'Banco invalido!' })
            return
        }

        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })

        if (!server) {
            res.status(200).json({ success: false, data: 'Erro ao bloquear o banco!' })
            return
        }

        let blockBank = []
        if ('blockBank' in server) {
            blockBank = server.blockBank
        }

        if (blockBank.includes(bank)) {
            res.status(200).json({ success: false, data: 'Este banco ja foi bloqueado!' })
            return
        }


        blockBank.push(bank)

        db.update('servers', req.body.serverID, {
            blockBank: blockBank
        })
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao bloquear o banco!' })
    }


})


app.post('/perms/changeOne', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        let roleID = await req.body.roleID
        if (!server || !roleID) {
            return
        }
        if (!('permissions' in server)) {
            await db.update('servers', req.body.serverID, {
                permissions: [
                    {
                        id: roleID,
                        perms: {
                            botEdit: true,
                            paymentEdit: false,
                            commands: true,
                            commandsAllChannel: false,
                        }
                    }
                ]
            })
        }
        server = await db.findOne({ colecao: "servers", doc: req.body.serverID })

        let permissions = server.permissions
        let rolePermission = permissions.find(element => element.id == roleID)
        let index = permissions.findIndex(element => element.id == roleID)

        rolePermission.perms[await req.body.item] = await req.body.value

        permissions[index] = rolePermission

        await db.update('servers', req.body.serverID, {
            permissions: permissions
        })

    } catch (error) {

    }
})

app.post('/perms/get', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        let roleID = await req.body.roleID
        if (!server || !roleID) {
            return
        }
        if (!('permissions' in server)) {
            res.status(200).json({
                success: true, data: {
                    botEdit: true,
                    paymentEdit: false,
                    commands: true,
                    commandsAllChannel: false,
                    owner: false
                }
            })
            return
        }
        let rolePermission = server.permissions.find(element => element.id == roleID)
        let roleData
        if (rolePermission) {
            roleData = rolePermission.perms
        } else {
            roleData = {
                botEdit: true,
                paymentEdit: false,
                commands: true,
                commandsAllChannel: false,
                owner: false
            }
        }
        res.status(200).json({ success: true, data: roleData })

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false })
    }
})

app.post('/personalize/avatarbot', functions.authPostState, upload.single('avatarBot'), async (req, res) => {
    try {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
        return
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        var DiscordServer = await client.guilds.cache.get(req.body.serverID);
        if (server && DiscordServer) {
            if (req.file && DiscordServer.members.me) {
                const uploadedFile = req.file;
                const filePath = uploadedFile.path;
                fs.readFile(filePath, async (err, data) => {
                    if (err) {
                        console.error('Erro ao ler o arquivo:', err);
                        return res.status(200).json({ success: false, data: 'Erro ao tentar alterar o avatar!' })
                    }
                    try {
                        await client.user.setAvatar(data)
                    } catch (error) {
                        console.log(error);
                        if (!res.headersSent) {
                            res.status(200).json({ success: false, data: 'Erro ao tentar alterar o avatar!' })
                        }
                    }
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Erro ao apagar o arquivo original:', err);
                            return { error: true, err: err }
                        } else {
                            return null
                        }
                    });
                    if (!res.headersSent) {
                        res.status(200).json({ success: true, data: 'Avatar Alterado!' })
                    }
                });
                if (!res.headersSent) {
                    res.status(200).json({ success: true, data: 'Avatar Alterado!' })
                }
            } else {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o bot!' })
                }
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log("PersonalizeChangeERROR: ", error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/change', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            if (req.body.botName) {
                var DiscordServer = await client.guilds.cache.get(req.body.serverID)
                DiscordServer.members.me.setNickname(req.body.botName)

                if (!res.headersSent) {
                    res.status(200).json({ success: true, })
                }
                return
            }
            let Newpersonalize = {
                colorDest: null,
                cargoPay: null
            }
            if ('personalize' in server) {
                Newpersonalize = server.personalize
            }

            if ('colorDest' in req.body) {
                Newpersonalize.colorDest = req.body.colorDest
            }
            if ('cargoPay' in req.body) {
                Newpersonalize.cargoPay = req.body.cargoPay
            }

            db.update('servers', req.body.serverID, {
                personalize: Newpersonalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log("PersonalizeChangeERROR: ", error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/productIcon', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.iconProduct = req.body.icon
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/feedback', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.feedbackChannel = req.body.channelID
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/welcome', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.welcomeMensage = {
                active: true,
                channel: req.body.channel,
                mensage: req.body.mensage,
                buttons: req.body.buttons
            }
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/welcomeActive', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            server.personalize.welcomeMensage.active = true
            db.update('servers', req.body.serverID, {
                personalize: server.personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/welcomeDesactive', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            server.personalize.welcomeMensage.active = false
            db.update('servers', req.body.serverID, {
                personalize: server.personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {

        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/lembrete', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.lembreteMensage = {
                active: true,
                mensage: req.body.mensage,
                title: req.body.title
            }
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})
app.post('/personalize/lembreteToogle', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            try {
                let personalize = 'personalize' in server ? server.personalize : {}
                personalize.welcomeMensage.active = req.body.active
                db.update('servers', req.body.serverID, {
                    personalize: personalize
                })
                if (!res.headersSent) {
                    res.status(200).json({ success: true, })
                }
            } catch (error) {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Erro tentar mudar a visibilidade do lembrete o servidor!' })
                }
            }
            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})



app.post('/personalize/autoReact', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.react = 'react' in personalize ? personalize.react : []
            personalize.react.push({
                channel: req.body.channelID,
                emoji: req.body.emoji
            })

            db.update('servers', req.body.serverID, {
                personalize: personalize
            })

            if (!res.headersSent) {
                res.status(200).json({ success: true, })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a personalização!' })
        }
    }
})



app.post('/sales/privateLog', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let logs = {
                publicLog: '',
                privateLog: ''
            }
            if ('saleLogs' in server) {
                logs = server.saleLogs
            }
            logs.privateLog = req.body.channelID
            db.update('servers', req.body.serverID, {
                saleLogs: logs
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Log alterada' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a log!' })
        }
    }
})
app.post('/sales/publicLog', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let logs = {
                publicLog: '',
                privateLog: ''
            }
            if ('saleLogs' in server) {
                logs = server.saleLogs
            }
            logs.publicLog = req.body.channelID
            db.update('servers', req.body.serverID, {
                saleLogs: logs
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Log alterada' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a log!' })
        }
    }
})

app.post('/ticket/create', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        const user = await client.users.fetch(body.userID);
        require('./Discord/newTicketFunction')(client, {
            guildId: body.guildId,
            user: user
        }, body.ticketOptions)
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Ticket Criado aguarde ate que algum adiministrador entre em contato!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar criar o ticket!' })
        }
        console.log(error);
    }
})

app.post('/ticket/saveSend', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        if ('ticketOptions' in server && server.ticketOptions.motivos.length <= 0) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Cadastre os motivos do ticket primeiro!' })
            }
            return
        }
        require('./Discord/createTicketMensage.js')(client, body.channelID, body.serverID)
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: ''
            },
            avaliacao: '',
            log: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.channel = body.channelID
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })

        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Mensagem do ticket enviada!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar criar a mensagem do ticket!' })
        }
        console.log(error);
    }
})
app.post('/ticket/motivoDEL', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        if (server && body.motivoID && 'ticketOptions' in server && server.ticketOptions.motivos.length > 0) {
            let ticketOptions = server.ticketOptions
            let findIndex = await ticketOptions.motivos.findIndex(element => element.id == body.motivoID)
            if (findIndex >= 0) {
                ticketOptions.motivos.splice(findIndex, 1)
                db.update('servers', body.serverID, {
                    ticketOptions: ticketOptions
                })
                if (ticketOptions.channel) {
                    require('./Discord/createTicketMensage.js')(client, ticketOptions.channel, body.serverID)
                }
                if (!res.headersSent) {
                    res.status(200).json({ success: true, data: 'Motivo deletado!' })
                }
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao deletar o motivo!' })
        }
        console.log(error);
    }
})

app.post('/ticket/motivoUPD', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        if (server && body.motivoID && 'ticketOptions' in server && server.ticketOptions.motivos.length > 0) {
            let ticketOptions = server.ticketOptions
            let findIndex = await ticketOptions.motivos.findIndex(element => element.id == body.motivoID)
            let find = await ticketOptions.motivos.find(element => element.id == body.motivoID)
            if (findIndex >= 0 && find) {
                find.name = body.name
                find.desc = body.desc
                find.responsavel = body.responsavel
                ticketOptions.motivos[findIndex] = find
                db.update('servers', body.serverID, {
                    ticketOptions: ticketOptions
                })
                require('./Discord/createTicketMensage.js')(client, ticketOptions.channel, body.serverID)
                if (!res.headersSent) {
                    res.status(200).json({ success: true, data: 'Motivo atualizado!' })
                }
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao editar o motivo!' })
        }
        console.log(error);
    }
})

app.post('/ticket/motivoADD', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: ''
            },
            avaliacao: '',
            log: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        let id = require('crypto').randomBytes(22).toString('base64').slice(0, 22).replace(/\+/g, '0').replace(/\//g, '0');
        let premotivo = body.motivo
        premotivo.id = id
        premotivo.cargos = []

        ticketOptions.motivos.push(premotivo)
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })

        if (ticketOptions.channel) {
            require('./Discord/createTicketMensage.js')(client, ticketOptions.channel, body.serverID)
        }
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Motivo adicionado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar adicionar o motivo!' })
        }
        console.log(error);
    }
})


app.post('/ticket/banner', functions.authPostState, upload.single('BannerTicket'), async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        var DiscordServer = await client.guilds.cache.get(req.body.serverID);
        if (server && DiscordServer) {
            if (req.file && DiscordServer.members.me) {
                const uploadedFile = req.file;
                const filePath = uploadedFile.path;
                await functions.comprimAndRecort(filePath, path.join(__dirname, `/uploads/personalize/ticketBanner/${'ticketBanner_' + uploadedFile.filename}`))
                let ticketOptions = {
                    motivos: [],
                    channel: '',
                    atend: {
                        start: '',
                        end: ''
                    },
                    avaliacao: '',
                    log: '',
                    banner: ''
                }
                if ('ticketOptions' in server) {
                    ticketOptions = server.ticketOptions
                }
                ticketOptions.banner = `/uploads/personalize/ticketBanner/${'ticketBanner_' + uploadedFile.filename}`
                db.update('servers', req.body.serverID, {
                    ticketOptions: ticketOptions
                })
                if (ticketOptions.channel) {
                    require('./Discord/createTicketMensage.js')(client, ticketOptions.channel, req.body.serverID)
                }
                if (!res.headersSent) {
                    res.status(200).json({ success: true, data: 'Banner Alterado!' })
                }
            } else {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o bot!' })
                }
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log("PersonalizeBOTBannerERROR: ", error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar o banner!' })
        }
    }
})


app.post('/ticket/horario', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: '',
                days: []
            },
            avaliacao: '',
            log: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.atend.days = body.options.days,
            ticketOptions.atend.start = body.options.init,
            ticketOptions.atend.end = body.options.end
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Horario de funcionamento modificado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar modificar o horario de funcionamento!' })
        }
        console.log(error);
    }
})
app.post('/ticket/privatelog', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: '',
                days: []
            },
            avaliacao: '',
            log: '',
            privateLog: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.privateLog = body.log
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })

        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Log privado modificado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar modificar o Log privado!' })
        }
        console.log(error);
    }
})
app.post('/ticket/desc', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: '',
                days: []
            },
            avaliacao: '',
            log: '',
            privateLog: '',
            desc: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.desc = body.desc
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })
        if (ticketOptions.channel) {
            require('./Discord/createTicketMensage.js')(client, ticketOptions.channel, body.serverID)
        }
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Descrição modificado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar modificar a descrição do ticket!' })
        }
        console.log(error);
    }
})
app.post('/ticket/publiclog', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        let ticketOptions = {
            motivos: [],
            channel: '',
            atend: {
                start: '',
                end: '',
                days: []
            },
            avaliacao: '',
            log: ''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.log = body.log
        db.update('servers', body.serverID, {
            ticketOptions: ticketOptions
        })
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Log publico modificado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar modificar o Log publico!' })
        }
        console.log(error);
    }
})

app.post('/cupom/create', functions.authPostState, async (req, res) => {
    try {
        let body = await req.body
        console.log(body);
        let server = await db.findOne({ colecao: 'servers', doc: body.serverID })
        const cupomId = require('crypto').randomBytes(11).toString('hex')
        let cupons = []
        let findCupom = null
        let code = await req.body.cupomCode
        if (`cupons` in server) {
            cupons = server.cupons
            findCupom = await server.cupons.find(cupom => cupom.code == code)
        }
        if (findCupom) {
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Ja existe um cupom com esse codigo!' })
            }
            return
        }

        await cupons.push({
            code: code,
            products: req.body.productsList,
            descontoType: req.body.descontoType,
            descontoValue: req.body.descontoValue,
            active: true,
            id: cupomId
        })
        db.update('servers', body.serverID, {
            cupons: cupons
        })
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Cupom criado!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar criar o cupom!' })
        }
        console.log(error);
    }
})

app.post('/send/discordMensage', functions.authPostState, async (req, res) => {
    try {
        var DiscordServer = await client.guilds.cache.get(req.body.guildId);
        var DiscordChannel = await DiscordServer.channels.cache.get(req.body.channelId)
        const user = await client.users.fetch(req.body.userID);
        let ticket = await db.findOne({ colecao: 'tickets', doc: req.body.protocolo })
        const libreTranslateUrl = 'https://libretranslate.de/translate';
        let textTranslate = req.body.content
        if (req.body.trad) {
            const translateText = async (text, targetLang) => {
                try {
                    const response = await axios.post(libreTranslateUrl, {
                        q: text,
                        source: 'auto',
                        target: targetLang,
                        format: "text"
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    return response.data.translatedText;
                } catch (error) {
                    return null;
                }
            };

            let resposta = await translateText(req.body.content, ticket.idioma).then(translatedText => { return translatedText });
            if (resposta && resposta != null) {
                textTranslate = resposta
            }
        }


        DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Nova mensagem!')
                    .setDescription(`\n${textTranslate}\n`)
                    .addFields({ name: '\u200B', value: '\u200B' }, { name: 'Tipo', value: `${req.body.admin == true ? "administrador" : "usuario"}`, inline: true }, { name: "Nome do usuario", value: user.username, inline: true }, { name: "ID do usuario", value: user.id, inline: true })
                    .setColor('#6E58C7')
                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                    .setTimestamp()

            ]
        })

        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Mensagem enviada!' })
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar enviar a mensagem!' })
        }
        console.log(error);
    }
})


app.post('/verify/adm', functions.authPostState, (req, res) => {
    if (req.body.pass == process.env.ADMINPASS && req.body.userID == process.env.ADMINLOGIN) {
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: req.body.userID })
        }
    } else {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar enviar a mensagem!' })
        }
    }
})


app.post('/get/server', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: 'servers', doc: req.body.serverID })
        if (server) {
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: server })
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
    }
})


app.post('/statusBotVendas', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            if (req.body.type == 'bot') {
                db.update('servers', req.body.serverID, {
                    botActive: req.body.active
                })
            } else {
                db.update('servers', req.body.serverID, {
                    vendasActive: req.body.active
                })
            }
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: `${req.body.type} ${req.body.active == true ? 'ativado' : 'desativado'} com sucesso!` })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar mudar a log!' })
        }
    }
})
app.post('/personalize/repost', functions.authPostState, async (req, res) => {
    try {
        if (req.body.serverID) {
            db.update('servers', req.body.serverID, {
                repostProduct: req.body.hour
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Repost atualizado com sucesso' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar salvar o repost!' })
        }
    }
})

app.post('/backups/cancelRecovery', functions.authPostState, async (req, res) => {
    try {
        if (req.body.serverID) {
            var serverID = req.body.serverID
            let server = await db.findOne({ colecao: "servers", doc: serverID })
            if ('backups' in server && 'lastBackup' in server.backups && server.backups.lastBackup) {
                db.update('servers', serverID, server.backups.lastBackup)
            } else {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o backup!' })
                }
                return
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
        }
    }
})

app.post('/backups/recovery', functions.authPostState, async (req, res) => {
    try {
        var serverID = req.body.serverID
        let server = await db.findOne({ colecao: "servers", doc: serverID })
        let backupServer = await db.findOne({ colecao: "servers", where: ['backupCode', '==', req.body.backupCode] })
        if (server.error == true || backupServer.error == true) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
            return
        }

        let recoveryType = await req.body.recoveryType
        let result = {}
        switch (recoveryType) {
            case 'users':
                if ('backups' in backupServer && 'verified' in backupServer.backups && backupServer.backups.verified.length > 0) {
                    let usersPassed = []
                    let usersErrors = []
                    async function recoveryUser(token, id) {
                        return new Promise(async (resolve, reject) => {
                            try {
                                let param = new URLSearchParams({
                                    client_id: webConfig.clientId,
                                    client_secret: botConfig.clientSecret,
                                    grant_type: 'refresh_token',
                                    refresh_token: token
                                })
                                const response = await axios.post('https://discord.com/api/oauth2/token', param, {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Accept-Encoding': 'application/x-www-form-urlencoded'
                                }).then((res) => { return res }).catch((err) => {
                                    resolve({ error: true, err: err })
                                })
                                if (!('data' in response)) {
                                    resolve({ error: true })
                                }

                                let access_token = response.data.access_token


                                const joinGuild = await axios.put(`https://discord.com/api/v10/guilds/${serverID}/members/${id}`, {
                                    access_token: access_token
                                }, {
                                    headers: {
                                        ["Content-Type"]: "application/json",
                                        Authorization: `Bot ${botConfig.discordToken}`
                                    }
                                }).then((res) => { return res }).catch((err) => {
                                    resolve({ error: true, err: err.response.data })
                                })
                                console.log(joinGuild);

                                if ('data' in joinGuild) {
                                    resolve({ error: false, data: joinGuild.data, })
                                } else {
                                    resolve({ error: true })
                                }
                            } catch (error) {
                                resolve({ error: true, err: error })
                            }
                        })
                    }
                    let users = await backupServer.backups.verified
                    for (let i = 0; i < users.length; i++) {
                        let element = users[i]
                        let pullUser = await recoveryUser(element.refresh_token, element.id)
                        if ('error' in pullUser && pullUser.error == false) {
                            usersPassed.push(element)
                        } else {
                            usersErrors.push(element)
                        }
                    }
                    result.data = 'Usuários recuperados com sucesso!'
                    result.usersPassed = usersPassed
                    result.usersErrors = usersErrors
                    let backups = backupServer.backups
                    delete backups.verified
                    await db.update('servers', backupServer.id, {
                        backups: backups
                    })
                } else {
                    result.data = 'Esse servidor não tem usuários verificados.'
                    break
                }



                break;
            case 'priorize':
                let newServer = await mergeObjects(server, backupServer)
                async function mergeObjects(obj1, obj2) {
                    // Criar um novo objeto para armazenar a combinação
                    const result = { ...obj2 };

                    for (const key in obj1) {
                        // Se a chave não existe no obj2 ou se os valores não são objetos, adicionar ao result
                        if (!obj2.hasOwnProperty(key) || typeof obj1[key] !== 'object' || obj1[key] === null) {
                            result[key] = obj1[key];
                        } else {
                            // Se a chave existe em ambos os objetos e o valor é um objeto, chamamos a função recursivamente
                            result[key] = await mergeObjects(obj1[key], obj2[key]);
                        }
                    }

                    return result;
                }
                let backups = 'backups' in newServer ? newServer.backups : {}
                backups.lastServer = server
                newServer.backups = backups
                await db.update('servers', newServer.id, newServer)
                result.data = 'Servidor atualizado com sucesso!'
                break;
            case 'replace':
                try {
                    let newServer = { subscriptionData: {} }
                    newServer = await backupServer
                    newServer.id = server.id
                    newServer.subscriptionData.created = server.subscriptionData.created
                    newServer.subscriptionData.lastPayment = server.subscriptionData.lastPayment
                    newServer.subscriptionData.expires_at = server.subscriptionData.expires_at
                    newServer.isPaymented = server.isPaymented
                    newServer.payment_status = server.payment_status
                    newServer.subscription = server.subscription
                    newServer.assinante = server.assinante
                    newServer.plan = server.plan
                    newServer.server_pic = server.server_pic
                    newServer.name = server.name
                    let backups = 'backups' in newServer ? newServer.backups : {}
                    backups.lastServer = server
                    newServer.backups = backups


                    await db.update('servers', newServer.id, newServer)
                    result.data = 'Servidor substituido com sucesso!'

                } catch (error) {
                    console.log(error);
                    result.data = 'Erro ao substituir o servidor!'
                    result.error = error
                }

                break;
        }

        if (!res.headersSent) {
            res.status(200).json({ success: true, data: result })
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
        }
    }
})

app.post('/backups/sendMensage', functions.authPostState, async (req, res) => {
    try {

        if (!req.body.title) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Insira um titulo!' })
            }
        }
        if (!req.body.mensage) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Insira uma mensagem!' })
            }
        }
        if (!req.body.link) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao gerar o auth!' })
            }
        }


        await require('./Discord/discordIndex.js').sendDiscordMensageChannel(req.body.serverID, req.body.channel, req.body.title, req.body.mensage, null, false, null, null, true, req.body.link, '✅ • Verificar')
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: 'Mensagem enviada com sucesso!' })
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao gerar o auth!' })
        }
    }

})

app.post('/personalize/antifake', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            let antifake = 'antifake' in personalize ? personalize.antifake : {}
            let antifakeDays = antifake.days ? antifake.days : 0
            let antifakeNames = antifake.names ? antifake.names : []
            if (req.body.antifakeDays) {
                antifakeDays = req.body.antifakeDays
            }
            if (req.body.antifakeNames) {
                antifakeNames = req.body.antifakeNames.split(',')
            }
            antifake.antifakeDays = antifakeDays
            antifake.antifakeNames = antifakeNames
            personalize.antifake = antifake
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Antifake atualizado com sucesso!' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao atualizar o antifake!' })
        }
    }

})





app.post('/sales/rankConfig', functions.authPostState, async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            let antifake = 'antifake' in personalize ? personalize.antifake : {}
            let antifakeDays = antifake.days ? antifake.days : 0
            let antifakeNames = antifake.names ? antifake.names : []
            if (req.body.antifakeDays) {
                antifakeDays = req.body.antifakeDays
            }
            if (req.body.antifakeNames) {
                antifakeNames = req.body.antifakeNames.split(',')
            }
            antifake.antifakeDays = antifakeDays
            antifake.antifakeNames = antifakeNames
            personalize.antifake = antifake
            db.update('servers', req.body.serverID, {
                personalize: personalize
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Antifake atualizado com sucesso!' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao tentar recuperar o servidor!' })
            }
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao atualizar o antifake!' })
        }
    }

})






app.use((req, res, next) => {
    res.status(404).render('NotFoundPage.ejs', { host: `${webConfig.host}` })
});

//TODO------------Listen--------------
tem()
async function tem(params) {

    client.on('ready', async () => {
       
    
    })
}

cron.schedule('0 * * * *',async () => {
    let hora = await toString(new Date().getHours())
    try {
        let firebaseDB = require("./Firebase/db.js")
        let snapshot;
        let ultimoDocumento = null;

        do {
            let query = firebaseDB.collection('servers')
                .where('repostProduct', '==', hora)
                .orderBy('__name__') // Ordena para garantir a paginação correta
                .limit(500); // Máximo por lote (Firestore suporta até 1000, mas 500 é mais seguro)

            if (ultimoDocumento) {
                query = query.startAfter(ultimoDocumento);
            }

            snapshot = await query.get();

            if (snapshot.empty) {
                console.log('Nenhum documento encontrado com esse valor.');
                break;
            }

            snapshot.forEach(doc => {
                let data = doc.data();
                let products = data.products
                products.forEach(async product => {
                    try {
                        if (product.embendType == '0') {
                            require('./Discord/createProductMessageEmbend.js')(Discord, client, {
                                channelID: product.channel,
                                serverID: data.id,
                                productID: product.productID,
                                edit:true
                            })
                        } else {
                            require('./Discord/createProductMessage.js')(Discord, client, {
                                channelID: product.channel,
                                serverID: data.id,
                                productID: product.productID,
                                edit:true
                            })
                        }
                    } catch (error) {
                        
                    }
                    
                })
            });

            // Atualiza o último documento para a próxima iteração
            ultimoDocumento = snapshot.docs[snapshot.docs.length - 1];
        } while (snapshot.size === 500); // Continua até não retornar mais 500 documentos

    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
    }


});


client.on('ready', () => {
    console.log([
        `[BOT] ${client.user.tag} está online!`,
        `[BOT] Estou em ${client.guilds.cache.size} servidores.`,
        `[BOT] Cuidando de ${client.users.cache.size} membros.`
    ].join('\n'))
})

app.listen(webConfig.port, () => {
    const dataHora = new Date();
    const formatado = d => ('0' + d).slice(-2);
    const dataHoraFormatada = `${formatado(dataHora.getDate())}/${formatado(dataHora.getMonth() + 1)}/${dataHora.getFullYear()} ${formatado(dataHora.getHours())}:${formatado(dataHora.getMinutes())}:${formatado(dataHora.getSeconds())}`;
    console.log(`${dataHoraFormatada} [WEB] Servidor rodando na porta ${webConfig.port}`);
});




