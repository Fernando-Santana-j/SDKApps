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
const cookieParser = require("cookie-parser");

var firebase = require("firebase-admin");

const webConfig = require('./config/web-config.js')

const botConfig = require('./config/bot-config.js');
const { default: axios } = require("axios");

const functions = require('./functions.js');

const cors = require('cors');


const stripe = require('stripe')(require('./config/web-config').stripe);



//TODO------------Configs--------------

require('dotenv').config()

const client = new Discord.Client({ intents: botConfig.intents })

require('./handler/index.js')(client)

require('./Discord/discordIndex.js')(Discord, client)



client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();

client.login(botConfig.discordToken)


const app = express();

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




//TODO------------Clients discord--------------

client.on("interactionCreate", async (interaction) => {
    if (!interaction.guild) return;

    if (interaction.isCommand()) {

        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd)
            return;

        cmd.run(client, interaction);
    }

    if (interaction.isContextMenuCommand()) {
        await interaction.deferReply({ ephemeral: false });
        const command = client.slashCommands.get(interaction.commandName);
        if (command) command.run(client, interaction);

    }
})


//TODO------------WEB PAGE--------------

app.get('/', async (req, res) => {

    res.render('index', { host: `${webConfig.host}`, isloged: req.session.uid ? true : false, error: req.query.error ? req.query.error : '' })
})


app.get('/dashboard', async (req, res) => {
    if (req.session.uid) {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        let server = await functions.reqServerByTime(user, functions.findServers)
        let servidoresEnd = []
        for (let i = 0; i < server.length; i++) {
            let element = server[i]

            let Findserver = await db.findOne({ colecao: 'servers', doc: element.id })
            if (Findserver.error == false) {
                servidoresEnd.push(Findserver)
            } else {
                servidoresEnd.push(element)
            }
        }
        res.render('dashboard', { host: `${webConfig.host}`, user: user, servers: servidoresEnd })


    } else {
        res.redirect('/')
    }
})



app.get('/auth/callback', async (req, res) => {
    if (!req.query.code) {
        res.redirect('/?error="Não foi possivel fazer login tente novamente!"')
    } else {
        let param = new URLSearchParams({
            client_id: webConfig.clientId,
            client_secret: webConfig.secret,
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: webConfig.redirect
        })
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/x-www-form-urlencoded'
        };
        const response = await axios.post('https://discord.com/api/oauth2/token', param, { headers }).then((res) => { return res }).catch((err) => console.error(err))
        if (!response) {
            res.redirect('/?error="Não foi possivel fazer login tente novamente!"')
            return
        }
        let userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
                ...headers
            }
        }).then((res) => { return res.data }).catch((err) => console.error(err));

        await db.create('users', userResponse.id, {
            id: userResponse.id,
            username: userResponse.username,
            profile_pic: userResponse.avatar ? `https://cdn.discordapp.com/avatars/${userResponse.id}/${userResponse.avatar}.png` : 'https://res.cloudinary.com/dgcnfudya/image/upload/v1709143898/gs7ylxx370phif3usyuf.png',
            displayName: userResponse.global_name,
            email: userResponse.email,
            access_token: response.data.access_token
        })

        req.session.uid = userResponse.id

        res.redirect('/dashboard')
    }
})
app.get('/auth/callback/guild', async (req, res) => {
    if (!req.query.code) {
        res.redirect('/dashboard')
    } else {
        let param = new URLSearchParams({
            client_id: webConfig.clientId,
            client_secret: webConfig.secret,
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: webConfig.redirect + '/guild'
        })
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/x-www-form-urlencoded'
        };
        const response = await axios.post('https://discord.com/api/oauth2/token', param, { headers }).then((res) => { return res }).catch((err) => console.error(err))
        if (!response) {
            res.redirect('/dashboard')
            return
        }
        await db.update('servers', req.query.guild_id, {
            access_token: response.data.access_token
        })
        res.redirect(`/server/${req.query.guild_id}`)
    }
})



app.get('/logout', async (req, res) => {
    if (req.session.uid) {
        const sessionID = req.session.id;
        req.sessionStore.destroy(sessionID, (err) => {
            if (err) {
                return console.error(err)
            } else {
                res.redirect('/')
            }
        })

    }
})

app.get('/payment/:id', async (req, res) => {
    if (!req.params.id || !req.session.uid) {
        res.redirect('/')
        return
    }
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    res.render('payment', { host: `${webConfig.host}`, user: user })
})


app.get('/server/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(serverID);
    if (!isBotInServer) {
        res.redirect(`/addbot/${serverID}`)
        return
    }
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (!server || !user) {
        res.redirect('/')
        return
    }
    if (server.hasOwnProperty('bankData')) {
        delete server.bankData
    }
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    let analytics = await db.findOne({ colecao: "analytics", doc: req.params.id })

    let comprasConcluidas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas completas"], functions.formatDate))
    let comprasCanceladas = JSON.stringify(await functions.getDatesLast7Days(analytics["vendas canceladas"], functions.formatDate))

    res.render('painel', { host: `${webConfig.host}`, user: user, server: server, comprasCanceladas: comprasCanceladas, comprasConcluidas: comprasConcluidas })
})





app.get('/server/sales/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (!server) {
        return
    }
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
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

    res.render('sales', { host: `${webConfig.host}`, bankData: bankData, user: user, server: server, channels: textChannels, formatarMoeda: functions.formatarMoeda })
})



app.get('/addbot/:serverID', (req, res) => {
    if (!req.params.serverID) {
        res.redirect(`/`)
        return
    }
    res.redirect(`${webConfig.discordGuildUrl}&guild_id=${req.params.serverID}&disable_guild_select=true`)
})


// host:`${webConfig.host}`,







app.get('/server/personalize/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    res.render('personalize', { host: `${webConfig.host}`, user: user, server: server })
})

app.get('/server/analytics/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    res.render('analytics', { host: `${webConfig.host}`, user: user, server: server })
})


app.get('/server/permissions/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    res.render('perms', { host: `${webConfig.host}`, user: user, server: server })
})


app.get('/server/config/:id', functions.subscriptionStatus, async (req, res) => {
    try {
        let serverID = req.params.id
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
        if (!server || server.assinante == false || server.isPaymented == false) {
            res.redirect('/dashboard')
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
        res.render('config', { host: `${webConfig.host}`, user: user, channels: textChannels, server: server })
    } catch (error) {

    }
})







app.get('/redirect/sucess', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})


app.get('/redirect/cancel', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})





app.post('/accout/delete', async (req, res) => {
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
                        console.log(prod);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }


            await stripe.subscriptions.cancel(server.subscription)
            if (server.bankData && server.bankData.accountID) {
                await stripe.accounts.del(server.bankData.accountID)
            }
            db.delete('servers', req.body.serverID)
            res.status(200).json({ success: true })
        } else {
            res.status(200).json({ success: false, data: 'Erro ao tentar deletar a conta!' })
        }

    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar deletar a conta!' })
    }
})


app.post("/config/notify", async (req, res) => {
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


app.post('/config/change', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server.error == false) {
            let configs = server.configs
            configs.noticeChannel = req.body.noticeChannel
            db.update('servers', req.body.serverID, {
                configs: configs
            })
        }
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(200).json({ success: false,data:'Erro ao salvar as configurações' })
        console.log(error);
    }
})


//TODO Mercado Pago

const mercadoPago = require('./mercadoPago.js')
app.use('/', mercadoPago);

//TODO STRIPE ROUTES

const stripeRoutes = require('./stripe/stripeRoutes.js');

app.use('/', stripeRoutes);


//TODO PRODUTOS ROUTES

const produtoRoutes = require('./stripe/productsRoutes.js');
const { doc } = require("firebase/firestore");

app.use('/', produtoRoutes);








app.use((req, res, next) => {
    res.status(404).render('NotFoundPage.ejs', { host: `${webConfig.host}` })
});

//TODO------------Listen--------------

client.on('ready', () => {
    console.log([
        `[BOT] ${client.user.tag} está online!`,
        `[BOT] Estou em ${client.guilds.cache.size} servidores.`,
        `[BOT] Cuidando de ${client.users.cache.size} membros.`
    ].join('\n'))
})


app.listen(webConfig.port, () => {
    console.log(`[WEB] Servidor rodando na porta ${webConfig.port}`);
});






