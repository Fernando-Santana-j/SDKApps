const express = require('express');
const router = express.Router();
require('dotenv').config()
const stripe = require('stripe')(require('../config/web-config').stripe);
const Discord = require("discord.js");
const db = require('../Firebase/models')
const fs = require('fs');
const functions = require('../functions');
const webConfig = require('../config/web-config');
const sharp = require('sharp');
const botConfig = require('../config/bot-config.js');
const { default: axios } = require("axios");
const e = require('express');
const client = new Discord.Client({ intents: botConfig.intents })
client.login(botConfig.discordToken)


router.get('/auth/verify/:acesstoken', async (req, res) => {
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
                req.session.uid = await userResponse.id
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

router.get('/discord/verify', async (req, res) => {
    try {
        if (!req.query.code || !req.query.state) {
            res.redirect('/?error=Codigo invalido')
        } else {
            let server = await db.findOne({ colecao: 'servers', doc: req.query.state })
            if (server.error == true) {
                res.redirect('/?error=Erro ao autenticar')
                return
            }
            let param = new URLSearchParams({
                client_id: webConfig.clientId,
                client_secret: botConfig.clientSecret,
                grant_type: 'authorization_code',
                code: req.query.code,
                redirect_uri: webConfig.redirectAuthVerify
            })
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/x-www-form-urlencoded'
            };
            const response = await axios.post('https://discord.com/api/oauth2/token', param, { headers }).then((res) => { return res }).catch((err) => {
                console.error(err.response.data)
            })
            if (!response) {
                res.redirect('/?error=Erro ao autenticar')
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



            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            let backups = 'backups' in server ? server.backups : {}
            let userVerified = 'verified' in backups ? backups.verified : []
            await userVerified.push({
                id: await userResponse.id,
                username: await userResponse.username,
                avatar: await userResponse.avatar,
                ip: await ip,
                access_token: await response.data.access_token,
                refresh_token: await response.data.refresh_token,
                email: await userResponse.email,
            })

            backups.verified = userVerified
            db.update('servers', req.query.state, {
                backups: backups
            })
            res.redirect('/redirect/sucess')
        }
    } catch (error) {
        res.redirect('/redirect/cancel')
        console.log(error);

    }
})



router.get('/discord/addbot/:storeID', functions.authGetState, async (req, res) => {
    if (!req.params.storeID) {
        res.redirect(`/`)
        return
    }
    let store = await db.findOne({ colecao: 'stores', doc: req.params.storeID })
    if (store.error == true) {
        res.redirect(`/`)
        return
    }
    const guilds = client.guilds.cache;

    if ("integrations" in store && "serverID" in store.integrations) {
        const isBotInServer = guilds.has(store.integrations.serverID);
        if (isBotInServer) {
            // Verificar se estamos numa popup ou não
            if (req.query.popup === 'true') {
                // Se estamos numa popup, redirecionar para página de verificação com status de sucesso
                return res.render('discord-callback', {
                    status: 'success',
                    guildName: guilds.get(store.integrations.serverID).name,
                    storeID: req.params.storeID
                });
            } else {
                // Caso contrário, redirecionar para a página de integrações
                return res.redirect(`/console/integrations/${req.params.storeID}`);
            }
        }
    }

    // Redirecionar para a autorização do Discord, especificando nossa callback como redirect_uri
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${webConfig.clientId}&permissions=8&response_type=code&scope=bot+applications.commands+guilds.members.read+applications.commands.permissions.update&redirect_uri=${process.env.REDIRECTURI}&state=${req.params.storeID}`);
})




router.get('/test/auth/callback', async (req, res) => {
    try {
        console.log(req.query);

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

                res.redirect(`/close/${userResponse.id}`)
            }
        }
    } catch (error) {
        res.redirect('/logout')
        console.log(error);

    }
})

// Rota para verificar o status do bot no servidor
router.get('/check-bot-status/:storeID', functions.authGetState, async (req, res) => {
    if (!req.params.storeID) {
        return res.json({ success: false, botAdded: false, error: 'ID da loja não fornecido' });
    }

    try {
        // Buscar informações da loja
        let store = await db.findOne({ colecao: 'stores', doc: req.params.storeID });

        if (store.error === true) {
            return res.json({ success: false, botAdded: false, error: 'Loja não encontrada' });
        }

        // Verificar se há integração configurada
        if (!("integrations" in store) || !("serverID" in store.integrations)) {
            return res.json({ success: false, botAdded: false, error: 'Integração não configurada' });
        }

        // Verificar se o bot está no servidor
        const serverID = store.integrations.serverID;
        const guilds = client.guilds.cache;
        const isBotInServer = guilds.has(serverID);

        return res.json({
            success: true,
            botAdded: isBotInServer,
            serverID: serverID,
            serverName: isBotInServer ? guilds.get(serverID).name : null
        });
    } catch (error) {
        console.error("Erro ao verificar status do bot:", error);
        return res.json({ success: false, botAdded: false, error: 'Erro ao verificar status' });
    }
});

// Rota para redirecionamento após autenticação do Discord
router.get('/auth/callback', async (req, res) => {
    const { code, state, error } = req.query;
    console.log(req.query);

    // Se houver erro ou não houver código, redirecionar com erro
    if (error || !code) {
        return res.render('discord-callback', {
            status: 'error',
            errorMsg: error || 'Autorização negada ou cancelada',
            storeID: state
        });
    }

    if (!state) {
        return res.render('discord-callback', {
            status: 'error',
            errorMsg: 'ID da loja não fornecido',
            storeID: ''
        });
    }

    try {
        // Buscar a loja
        const store = await db.findOne({ colecao: 'stores', doc: state });

        if (store.error === true) {
            return res.render('discord-callback', {
                status: 'error',
                errorMsg: 'Loja não encontrada',
                storeID: state
            });
        }

        // Aqui normalmente você trocaria o código de autorização por um token de acesso
        // Mas como já temos a rota /addbot que redireciona para o Discord OAuth,
        // e depois o Discord redireciona para esta rota, vamos apenas verificar se o bot está no servidor

        // Simular um pequeno atraso para dar tempo ao Discord de processar a adição do bot
        setTimeout(async () => {
            try {
                // Verificar os servidores onde o bot está presente
                const guilds = client.guilds.cache;

                // Se houver integrations.serverID, usar esse valor, senão definir como null
                const serverID = store.integrations && store.integrations.serverID
                    ? store.integrations.serverID
                    : null;

                // Verificar se o bot está no servidor especificado
                const isBotInServer = serverID ? guilds.has(serverID) : false;

                if (isBotInServer) {
                    // Bot está no servidor
                    const guild = guilds.get(serverID);

                    return res.render('discord-callback', {
                        status: 'success',
                        guildName: guild.name,
                        storeID: state
                    });
                } else {
                    // Verificar se o bot foi adicionado a um novo servidor
                    // Se sim, atualizar a configuração da loja
                    let newServerID = null;
                    let newGuildName = null;

                    // Se o bot for adicionado a apenas um servidor ou a um servidor novo, usar esse
                    if (guilds.size === 1) {
                        const guild = guilds.first();
                        newServerID = guild.id;
                        newGuildName = guild.name;
                    } else if (guilds.size > 1) {
                        // Se o bot estiver em múltiplos servidores, verificar apenas os mais recentes
                        // Normalmente o servidor recém-adicionado seria o último
                        guilds.forEach(guild => {
                            // Verificar se este servidor não é o atual na configuração
                            if (guild.id !== serverID) {
                                newServerID = guild.id;
                                newGuildName = guild.name;
                            }
                        });
                    }

                    if (newServerID) {
                        // Atualizar a configuração da loja com o novo servidor
                        let store = await db.findOne({ colecao: 'stores', doc: state })
                        let integrations = "integrations" in store ? store.integrations : {}
                        let discordIntegration = "discord" in integrations ? integrations.discord : {}
                        let discordServers = "servers" in discordIntegration ? discordIntegration.servers : {}
                        discordIntegration.enabled = true
                        discordIntegration.lastServerID = newServerID

                        if (!(newServerID in discordServers)) {
                            discordServers[newServerID] = {
                                id: newServerID,
                                name: newGuildName,
                                createdAt: new Date(),
                                products: []
                            }
                        }
                        discordIntegration.servers = discordServers
                        await db.update('stores', state, {
                            integrations: integrations
                        }
                        );

                        return res.render('discord-callback', {
                            status: 'success',
                            guildName: newGuildName,
                            storeID: state
                        });
                    } else {
                        // Bot não está em nenhum servidor
                        return res.render('discord-callback', {
                            status: 'error',
                            errorMsg: 'O bot não foi adicionado a nenhum servidor',
                            storeID: state
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar servidores:", error);
                return res.render('discord-callback', {
                    status: 'error',
                    errorMsg: 'Erro ao verificar servidores',
                    storeID: state
                });
            }
        }, 2000); // Esperar 2 segundos para o Discord processar
    } catch (error) {
        console.error("Erro na verificação da loja:", error);
        return res.render('discord-callback', {
            status: 'error',
            errorMsg: 'Erro interno do servidor',
            storeID: state
        });
    }
});



router.post("/sendMessage/product", async (req, res) => {
    try {
        const { productID, discordRef, storeID } = req.body;

        let store = await db.findOne({ colecao: 'stores', doc: storeID })

        if (!("integrations" in store && "discord" in store.integrations && "servers" in store.integrations.discord)) {
            return res.status(200).json({ success: false, data: 'Integração Discord nao configurada' })
        }

        let serverID = store.integrations.discord.lastServerID
        let server = store.integrations.discord.servers[serverID]

        if (!server) {
            return res.status(200).json({ success: false, data: 'Integração Discord nao configurada' })
        }
        let product = store.products.find(product => product.id == productID)
        let productRef = server.products.find(product => product.id == discordRef)

        
        if (!product || !productRef) {
            return res.status(200).json({ success: false, data: 'Produto nao encontrado' })
        }


        require("./createProductMessageEmbend.js")(client, {
            clean: true,
            serverID: serverID,
            channelID: productRef.channelID,
            product: product,
            discordProd: productRef
        }).then(() => {
            return res.status(200).json({ success: true, data: 'Mensagem enviada com sucesso' })
        }).catch(() => {
            return res.status(200).json({ success: false, data: 'Erro ao enviar mensagem' })
        })

        
    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, data: 'Erro ao enviar mensagem' })
    }

})

module.exports = router;