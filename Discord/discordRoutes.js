const express = require('express');
const router = express.Router();

const stripe = require('stripe')(require('../config/web-config').stripe);

const db = require('../Firebase/models')
const fs = require('fs');
const functions = require('../functions');
const webConfig = require('../config/web-config');
const sharp = require('sharp');

const { default: axios } = require("axios");

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




router.get('/addbot/:serverID', (req, res) => {
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