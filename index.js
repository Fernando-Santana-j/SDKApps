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

require('./handler/index.js')(client)

require('./Discord/discordIndex.js')(Discord, client)



client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();

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

//TODO monitoramento de erros
client.on(Events.ShardError, error => {
    console.error('A websocket connection encountered an error:', error);
});



//TODO------------WEB PAGE--------------


//TODO Discord Routes
const discordRouter = require('./Discord/discordRoutes.js')
app.use('/', discordRouter);


//TODO Mercado Pago Routes

const mercadoPago = require('./mercadoPago.js')
app.use('/', mercadoPago);

//TODO STRIPE ROUTES

const stripeRoutes = require('./stripe/stripeRoutes.js');

app.use('/', stripeRoutes);


//TODO PRODUTOS ROUTES

const produtoRoutes = require('./stripe/productsRoutes.js');

app.use('/', produtoRoutes);





app.get('/', async (req, res) => {
    res.render('index', { host: `${webConfig.host}`, isloged: req.session.uid ? true : false, user: { id: req.session.uid ? req.session.uid : null }, error: req.query.error ? req.query.error : '' })
})


app.get('/dashboard', async (req, res) => {
    if (req.session.uid) {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
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
                res.redirect('/')
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


    } else {
        res.redirect('/')
    }
})


app.get('/logout', async (req, res) => {
    try {
        if (req.session.uid) {
            const sessionID = req.session.id;
            req.sessionStore.destroy(sessionID, (err) => {
                if (err) {
                    return console.error(err)
                } else {
                    res.redirect('/')
                }
            })
        } else {
            res.redirect('/')
        }
    } catch (error) {
        res.redirect('/')
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

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard')
        return
    }
    if ('botConfig' in verifyPerms.perms && verifyPerms.perms.botEdit == false) {
        res.redirect('/dashboard?botedit=false')
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
    res.render('painel', { host: `${webConfig.host}`, chatItens: chatItens, user: user, server: server, comprasCanceladas: comprasCanceladas, comprasConcluidas: comprasConcluidas })
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
    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard')
        return
    }

    if ('botConfig' in verifyPerms.perms && verifyPerms.perms.botConfig == false) {
        res.redirect(`/dashboard`)
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
    res.render('sales', { perms: verifyPerms.perms, chatItens: chatItens, host: `${webConfig.host}`, bankData: bankData, user: user, server: server, channels: textChannels, formatarMoeda: functions.formatarMoeda })
})



app.get('/server/personalize/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
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



app.get('/server/analytics/:id', functions.subscriptionStatus, async (req, res) => {
    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
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


app.get('/server/permissions/:id', functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.owner == false) {
        res.redirect(`/server/${serverID}`)
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


app.get('/server/ticket/:id', functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.botEdit == false) {
        res.redirect(`/server/${serverID}`)
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
    let rolesFilter = roles.filter(role => role.managed == false && role.mentionable == false && role.name != "@everyone")

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

app.get('/server/cupom/:id', functions.subscriptionStatus, async (req, res) => {

    let serverID = req.params.id
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    let server = await db.findOne(({ colecao: 'servers', doc: serverID }))
    if (server.assinante == false || server.isPaymented == false) {
        res.redirect('/dashboard')
        return
    }

    let verifyPerms = await functions.verifyPermissions(user.id, server.id, Discord, client)
    if (verifyPerms.error == true) {
        res.redirect('/dashboard')
        return
    }

    if (verifyPerms.error == false && verifyPerms.perms.botEdit == false) {
        res.redirect(`/server/${serverID}`)
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



app.post('/firebase/configs', (req, res) => {
    res.status(200).json({ success: true, projectId: require('./config/firebase.json').project_id, data: require('./config/firebase.json') })
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

app.post('/config/blockbank', async (req, res) => {
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


app.post('/perms/changeOne', async (req, res) => {
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

app.post('/perms/get', async (req, res) => {
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

app.post('/personalize/avatarbot', upload.single('avatarBot'), async (req, res) => {
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
app.post('/personalize/change', async (req, res) => {
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
app.post('/personalize/productIcon', async (req, res) => {
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
app.post('/personalize/welcome', async (req, res) => {
    try {
        let server = await db.findOne({ colecao: "servers", doc: req.body.serverID })
        if (server) {
            let personalize = 'personalize' in server ? server.personalize : {}
            personalize.welcomeMensage = {
                active:true,
                channel:req.body.channel,
                mensage:req.body.mensage,
                title:req.body.title
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
app.post('/personalize/welcomeActive', async (req, res) => {
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
app.post('/personalize/welcomeDesactive', async (req, res) => {
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
app.post('/sales/privateLog', async (req, res) => {
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
app.post('/sales/publicLog', async (req, res) => {
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

app.post('/ticket/create', async (req, res) => {
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

app.post('/ticket/saveSend', async (req, res) => {
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
app.post('/ticket/motivoDEL', async (req, res) => {
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

app.post('/ticket/motivoUPD', async (req, res) => {
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
                    res.status(200).json({ success: true, data: 'Motivo deletado!' })
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

app.post('/ticket/motivoADD', async (req, res) => {
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


app.post('/ticket/banner', upload.single('BannerTicket'), async (req, res) => {
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


app.post('/ticket/horario', async (req, res) => {
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
app.post('/ticket/privatelog', async (req, res) => {
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
app.post('/ticket/desc', async (req, res) => {
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
app.post('/ticket/publiclog', async (req, res) => {
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

app.post('/cupom/create', async (req, res) => {
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
            findCupom = await server.cupons.find(cupom=>cupom.code == code)
        }
        if (findCupom) {
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Ja existe um cupom com esse codigo!' })
            }
            return
        }
        
        await cupons.push({
            code:code,
            products:req.body.productsList,
            descontoType:req.body.descontoType,
            descontoValue:req.body.descontoValue,
            active:true,
            id:cupomId
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

app.post('/send/discordMensage', async (req, res) => {
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


app.post('/verify/adm', (req, res) => {
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


app.post('/get/server', async (req, res) => {
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
    const dataHora = new Date();
    const formatado = d => ('0' + d).slice(-2);
    const dataHoraFormatada = `${formatado(dataHora.getDate())}/${formatado(dataHora.getMonth() + 1)}/${dataHora.getFullYear()} ${formatado(dataHora.getHours())}:${formatado(dataHora.getMinutes())}:${formatado(dataHora.getSeconds())}`;
    console.log(`${dataHoraFormatada} [WEB] Servidor rodando na porta ${webConfig.port}`);
});






