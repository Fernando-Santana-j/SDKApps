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
        if (!req.query.code) {
            res.redirect('/?error=Codigo invalido')
        } else {
            let param = new URLSearchParams({
                client_id: webConfig.clientId,
                client_secret: webConfig.secret,
                grant_type: 'authorization_code',
                code: req.query.code,
                redirect_uri: process.env.DISCORDURI
            })
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/x-www-form-urlencoded'
            };
            const response = await axios.post('https://discord.com/api/oauth2/token', param, { headers }).then((res) => { return res }).catch((err) => {
                console.error(err)
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
            

        }
    } catch (error) {
        res.redirect('/logout')
        console.log(error);

    }
})

router.get('/auth/callback', async (req, res) => {
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
                req.session.uid = userResponse.id;

                let user = await db.findOne({ colecao: 'users', doc: userResponse.id })
                if ('pass' in user == true) {
                    delete user.security
                }
                let loginsOpen = 'loginsOpen' in user ? user.loginsOpen : {}
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                let userLoginAccept = 'usersLoginAccept' in user ? true : false
                let findLogin = Object.values(loginsOpen).find(element => element.ip == ip)
                if ('usersLoginAccept' in user && user.usersLoginBlock.includes(ip)) {
                    res.redirect('/logout?error=Seu acesso a essa conta foi bloqueado!')
                    return
                }
                if (user && user.error == false) {
                    if (userLoginAccept == false && !findLogin || userLoginAccept == true && !user.usersLoginAccept.includes(ip) && !findLogin) {
                        let loginID = await require('crypto').randomBytes(16).toString('hex')
                        const userAgent = req.headers['user-agent'];
                        const os = /Windows|Mac|Linux|Android|iPhone|iPad/.exec(userAgent)?.[0] || 'Desconhecido';
                        const browser = /Vivaldi|Edge|Chrome|Firefox|Safari|Opera/.exec(userAgent)?.[0] || 'Desconhecido';
                        let dataAtual = new Date();
                        let meses = [
                            "Janeiro", "Fevereiro", "Março", "Abril",
                            "Maio", "Junho", "Julho", "Agosto",
                            "Setembro", "Outubro", "Novembro", "Dezembro"
                        ];
                        let dataFormatada = `${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()} às ${dataAtual.getHours()}:${dataAtual.getMinutes()}`;

                        try {
                            const response = await axios.get(`https://ipinfo.io/${ip}?token=38a482893a93f0`);
                            let data = await response.data;
                            await functions.sendEmail(user.email, 'Novo acesso a SDK!', `
                                <html>
                                    <head>
                                        <style>
                                            body {
                                                font-family: 'Poppins', sans-serif;
                                                margin: 0;
                                                padding: 0;
                                                color: #fff;
                                            }
                                            .container {
                                                width: 100%;
                                                display: table;
    
                                                padding: 1em;
                                            }
                                            .content {
                                                display: table-cell;
                                                vertical-align: middle;
                                                text-align: center;
                                            }
                                            .email-content {
                                                width: 100%;
                                                max-width: 600px;
                                                background-color: #1E1E1E;
                                                padding: 1em;
                                                border-radius: 10px;
                                                margin: 0 auto;
                                                box-sizing: border-box;
                                            }
                                            .email-content img {
                                                width: 100%;
                                                border-radius: 10px;
                                            }
                                            h1 {
                                                font-weight: bold;
                                                color: #fff;
                                                font-size: 1.5em;
                                                margin-top: 1.5em;
                                            }
                                            p {
                                                font-weight: normal;
                                                color: #fff;
                                                text-align: start;
                                                font-size: 1em;
                                                margin: 1em 0;
                                            }
                                            .button {
                                                display: inline-block;
                                                font-size: 1.2em;
                                                font-weight: 400;
                                                color: #fff !important;
                                                text-decoration: none;
                                                background-color: #654BCB;
                                                border-radius: 20px;
                                                padding: 1em 2em;
                                                cursor: pointer;
                                                margin: 1em;
                                                            
                                                background-color: #4c3ba7;
                                            }
                                            .details{
                                                margin-top: 1.5em;
                                                margin-bottom: 1em;
                                            }
                                            .details ul {
                                                list-style: none;
                                                padding: 0;
                                                margin: 1.5em 0;
                                                text-align: left;
                                            }
                                            .details li {
                                                margin-top: 0.5em;
                                                font-size: 1em;
                                            }
                                            .footer {
                                                margin-top: 1em;
                                            }
                                            .footer p {
                                                font-size: 1em;
                                                color: #d6d6d6;
                                                margin: 0;
                                            }
                                            .footer .signature {
                                                font-size: 1.2em;
                                                font-family: 'Great Vibes', cursive;
                                                color: #fff;
                                                margin: 0;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="container">
                                            <div class="content">
                                                <div class="email-content">
                                                    <img src="https://res.cloudinary.com/dmfgy0ccd/image/upload/v1726657603/CAPA-PIXEL_ftgohk.gif" alt="Banner">
                                                    <h1>Novo acesso à sua conta SDK!</h1>
                                                    <p style="margin-top: 1.5em;">Olá, Fernando</p>
                                                    <p>Detectamos um novo acesso à sua conta na plataforma da SDK. Caso não reconheça ou não tenha certeza do acesso, peço que aperte o botão abaixo para ser redirecionado para a plataforma.<br><br>Lá você irá receber mais informações sobre o acesso e poderá recusar o acesso e trocar sua senha root!</p>
                                                    <div class="details">
                                                        <ul>
                                                            <li><b>IP:</b> ${data.ip}</li>
                                                            <li><b>Pais:</b> ${data.country}</li>
                                                            <li><b>Estado:</b> ${data.region}</li>
                                                            <li><b>Cidade:</b> ${data.city}</li>
                                                        </ul>
                                                    </div>
                                                    <a href='${webConfig.host}/control/login/${loginID}/${req.session.id}/${data.ip}/${userResponse.id}?os=${os}&postal=${data.postal}&city=${data.city}&estado=${data.region}&pais=${data.country}&loc=${data.loc}&navegador=${browser}&date=${dataFormatada}&token=${req.cookies.token}' class="button" title="Clique para ver mais detalhes sobre o acesso!">Acessar a plataforma</a>
                                                    <div class="footer">
                                                        <p>Cumprimentos,</p>
                                                        <p class="signature">SDKApps</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </body>
                                    </html>
                            `)
                            loginsOpen[loginID] = {
                                id: loginID,
                                ip: ip ? ip : null,
                                sessao: req.session.id ? req.session.id : null,
                                pais: data.country ? data.country : null,
                                estado: data.region ? data.region : null,
                                cidade: data.city ? data.city : null,
                                os: os,
                                postal: data.postal ? data.postal : null,
                                navegador: browser,
                                date: dataFormatada,
                                token: req.cookies.token ? req.cookies.token : null,
                                user: userResponse.id
                            }
                        } catch (error) {
                            console.error('Erro ao obter localização:', error);
                        }
                    }
                    await db.update('users', userResponse.id, {
                        username: userResponse.username,
                        profile_pic: userResponse.avatar ? `https://cdn.discordapp.com/avatars/${userResponse.id}/${userResponse.avatar}.png` : 'https://res.cloudinary.com/dgcnfudya/image/upload/v1709143898/gs7ylxx370phif3usyuf.png',
                        displayName: userResponse.global_name,
                        access_token: response.data.access_token,
                        loginsOpen: loginsOpen
                    })
                } else {
                    let customer = await functions.createCustomer(userResponse.username, userResponse.email)
                    await db.create('users', userResponse.id, {
                        id: userResponse.id,
                        customer: customer,
                        username: userResponse.username,
                        profile_pic: userResponse.avatar ? `https://cdn.discordapp.com/avatars/${userResponse.id}/${userResponse.avatar}.png` : 'https://res.cloudinary.com/dgcnfudya/image/upload/v1709143898/gs7ylxx370phif3usyuf.png',
                        displayName: userResponse.global_name,
                        email: userResponse.email,
                        access_token: response.data.access_token,
                        usersLoginAccept: [ip],
                        usersLoginBlock: []
                    })
                }

                res.redirect('/dashboard')
            }
        }
    } catch (error) {
        res.redirect('/logout')
        console.log(error);

    }
})




router.get('/addbot/:serverID', functions.authGetState, (req, res) => {
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



module.exports = router;