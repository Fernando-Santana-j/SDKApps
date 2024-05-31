//TODO-------------importes------------
const Discord = require("discord.js");
const { Events, GatewayIntentBits } = require('discord.js');
const rpc = require('discord-rpc')
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


client.on(Events.ShardError, error => {
    console.error('A websocket connection encountered an error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('unhandRejection', (reason, promise) => {
    console.log(`🚫 Erro Detectado:\n\n` + reason, promise)
});

process.on('uncaughtException', (error, origin) => {
    console.log(`🚫 Erro Detectado:\n\n` + error, origin)
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    console.log(`🚫 Erro Detectado:\n\n` + error, origin)
});








//TODO------------WEB PAGE--------------

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







app.get('/', async (req, res) => {
    res.render('index', { host: `${webConfig.host}`, isloged: req.session.uid ? true : false, user:{id:req.session.uid ? req.session.uid : null}, error: req.query.error ? req.query.error : '' })
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
        res.render('dashboard', { host: `${webConfig.host}`, user: user, servers: servidoresEnd })


    } else {
        res.redirect('/')
    }
})



app.get('/auth/verify/:acesstoken', async (req, res) => {
    let param = req.params.acesstoken
    if (param) {
        try {
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/x-www-form-urlencoded'
            };
            let userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${param}`,
                    ...headers
                }
            }).then((res) => { return res.data })
            if (userResponse) {
                req.session.uid = userResponse.id
                res.redirect('/dashboard')
            } else {
                res.redirect(webConfig.loginURL)
            }
        } catch (error) {
            res.redirect(webConfig.loginURL)
        }
    } else {
        res.redirect(webConfig.loginURL)
    }
})

app.get('/auth/callback', async (req, res) => {
    try {
        if (req.session.uid) {
            res.redirect('/dashboard')
        } else {
            if (!req.query.code) {
                res.redirect('/logout')
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
                const response = await axios.post('https://discord.com/api/oauth2/token', param, { headers }).then((res) => { return res }).catch((err) => {
                    console.error(err)
                })
                if (!response) {
                    res.redirect('/logout')
                    return
                }
                let userResponse = await axios.get('https://discord.com/api/users/@me', {
                    headers: {
                        Authorization: `Bearer ${response.data.access_token}`,
                        ...headers
                    }
                }).then((res) => { return res.data }).catch((err) => {
                    console.error(err)
                });
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
        }
    } catch (error) {
        res.redirect('/logout')
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

    res.render('sales', { perms: verifyPerms.perms, host: `${webConfig.host}`, bankData: bankData, user: user, server: server, channels: textChannels, formatarMoeda: functions.formatarMoeda })
})



app.get('/addbot/:serverID', (req, res) => {
    if (!req.params.serverID) {
        res.redirect(`/`)
        return
    }
    const guilds = client.guilds.cache;
    const isBotInServer = guilds.has(req.params.serverID);
    if (isBotInServer) {
        res.redirect(`/server/${req.body.serverID}`)
    } else {
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${webConfig.clientId}&permissions=8&response_type=code&scope=bot+applications.commands+guilds.members.read+applications.commands.permissions.update&redirect_uri=${process.env.DISCORDURI}&guild_id=${req.params.serverID}&disable_guild_select=true`)
    }

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

    res.render('personalize', { host: `${webConfig.host}`, cargos: roleObjects, user: user, server: server })
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
    res.render('analytics', { host: `${webConfig.host}`, user: user, server: server, paymentMetod: paymentMetod, canceladosEstoque: canceladosEstoque, reebolsos: reebolsos, comprasCanceladas: comprasCanceladas, comprasConcluidas: comprasConcluidas })
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
    let rolesFilter = roles.filter(role => role.managed == false && role.mentionable == false)
    res.render('perms', { host: `${webConfig.host}`, user: user, server: server, roles: JSON.stringify(rolesFilter) })
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
    let rolesFilter = roles.filter(role => role.managed == false && role.mentionable == false)

    let ticketOptions = {
        motivos:[],
        permissions:[],
        channel:'',
        atend:{
            start:'',
            end:''
        },
        avaliacao: '',
        log:''
    }

    if (server && 'ticketOptions' in server && 'motivos' in server) {
        ticketOptions = server.ticketOptions
    }

    res.render('ticket', { host: `${webConfig.host}`, ticketOptions:ticketOptions,roles: JSON.stringify(rolesFilter), user: user, server: server, channels: textChannels,})
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



app.get('/help', (req, res) => {
    res.redirect('https://discord.com/channels/1234582432196333729/1234582432708169814')
})



app.get('/redirect/sucess', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})


app.get('/redirect/cancel', (req, res) => {
    res.render('redirect', { host: `${webConfig.host}` })
})


app.get('/redirect/discord',(req,res)=>{
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
                        console.log(prod);
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
                fs.readFile(filePath, async(err, data) => {
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


app.post('/ticket/create', async(req,res)=>{
    try {
        let body = await req.body
        const user = await client.users.fetch(body.userID);
        require('./Discord/newTicketFunction')(client,{
            guildId:body.guildId,
            user:user
        },body.ticketOptions)
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

app.post('/ticket/saveSend',async(req,res)=>{
    try {
        let body = await req.body
        require('./Discord/createTicketMensage.js')(client,body.channelID,body.serverID)
        let server = await db.findOne({colecao:'servers',doc: body.serverID})
        let ticketOptions = {
            motivos:[],
            permissions:[],
            channel:'',
            atend:{
                start:'',
                end:''
            },
            avaliacao: '',
            log:''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        ticketOptions.channel = body.channelID
        db.update('servers',body.serverID,{
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

app.post('/ticket/motivoADD',async(req,res)=>{
    try {
        let body = await req.body
        let server = await db.findOne({colecao:'servers',doc: body.serverID})
        let ticketOptions = {
            motivos:[],
            permissions:[],
            channel:'',
            atend:{
                start:'',
                end:''
            },
            avaliacao: '',
            log:''
        }
        if ('ticketOptions' in server) {
            ticketOptions = server.ticketOptions
        }
        let id = require('crypto').randomBytes(22).toString('base64').slice(0, 22).replace(/\+/g, '0').replace(/\//g, '0');
        let premotivo = body.motivo
        premotivo.id = id
        premotivo.cargos = []
        
        ticketOptions.motivos.push(premotivo)
        db.update('servers',body.serverID,{
            ticketOptions: ticketOptions
        })
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
    
            let resposta = await translateText(req.body.content, ticket.idioma).then(translatedText => {return translatedText});
            if (resposta && resposta != null) {
                textTranslate = resposta
            }
        }
        

        DiscordChannel.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Nova mensagem!')
                    .setDescription(`\n${textTranslate}\n`)
                    .addFields({ name: '\u200B', value: '\u200B' },{ name: 'Tipo', value: `${req.body.admin == true ? "administrador" : "usuario"}`,inline:true },{name:"Nome do usuario", value:user.username,inline:true},{name:"ID do usuario", value:user.id,inline:true})
                    .setColor('#6E58C7')
                    .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png`, url: 'https://discord.gg/jVuVx4PEju' })
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


app.post('/verify/adm',(req,res)=>{
    if (req.body.pass == process.env.ADMINPASS && req.body.userID == process.env.ADMINLOGIN) {
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: req.body.userID})
        }
    }else{
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao tentar enviar a mensagem!' })
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






