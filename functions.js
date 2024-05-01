const axios = require('axios')
const sharp = require('sharp');
const fs = require('fs');
const stripe = require('stripe')(require('./config/web-config').stripe);
const db = require('./Firebase/models');
const webConfig = require('./config/web-config')

module.exports = {
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
    subscriptionStatus: async (req, res, next) => {
        if (!req.params.id || !req.session.uid) {
            res.redirect('/')
            return
        }
        let server = await db.findOne({ colecao: "servers", doc: req.params.id })
        
        if (server) {
            try {
                if ('bankData' in server) {
                    let account = await stripe.accounts.retrieve(server.bankData.accountID);
                    if (account.payouts_enabled == false || account.requirements.disabled_reason != null ) {
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
                if ("vitalicio" in server && server.vitalicio == true) {
                    next()
                    return
                }
                const assinatura = await stripe.subscriptions.retrieve(server.subscription);
                if (assinatura) {
                    const tempoUnixConvert = new Date(assinatura.current_period_end * 1000);
                    const hoje = new Date();
                    const diferencaEmMilissegundos = tempoUnixConvert - hoje;
                    const diasRestantes = Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
                    if (server.payment_status == "paused") {
                        res.redirect('/dashboard')
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
                            res.redirect('/dashboard')
                            break;
                        default:
                            next()
                            break;
                    }
                } else {
                    res.redirect('/')
                }

            } catch (error) {
                console.log(error);
                res.redirect('/')
            }
        } else {
            res.redirect('/')
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
            console.error(err)
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
        await sharp(arquivoOrigem).jpeg({ quality: 70 }).toFile(novoCaminho, (err, info) => {
            if (err) {
                console.error('Erro ao comprimir a imagem:', err);
                return { error: true, err: err }
            } else {
                return fs.unlink(arquivoOrigem, (err) => {
                    if (err) {
                        console.error('Erro ao apagar o arquivo original:', err);
                        return { error: true, err: err }
                    } else {
                        return null
                    }
                });
            }
        });
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
    }


}