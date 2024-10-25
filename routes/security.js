const express = require('express');
const router = express.Router();
const functions = require('../functions')
const db = require('../Firebase/models')
const axios = require('axios')
const webConfig = require('../config/web-config');


const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
router.get('/security/pass', functions.authGetState, async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        let mensage = ''
        let firstSend = false

        if ('security' in user == false || ('security' in user == true && 'pass' in user.security == false)) {
            firstSend = true
            mensage = 'Foi enviada suas novas senhas no seu email, recomendamos apagar o email após salvar a senha!'
            let adminPass = await require('crypto').randomBytes(14).toString('hex') + '-ADM'
            let geralPass = await require('crypto').randomBytes(14).toString('hex') + '-GRL'

            let cryptoAdmin = await functions.criptografar(adminPass, process.env.CRIPTOKEYADMIN)
            let cryptoGeral = await functions.criptografar(geralPass, process.env.CRIPTOKEYPUBLIC)

            let htmlEmail = await functions.readTemplate('passMail.ejs', { adminPass: adminPass, geralPass: geralPass, name: user.displayName })
            await functions.sendEmail(user.email, '⚠️ | Senhas, cuidado ao exibir, apagar após salvar.', htmlEmail)
            let security = 'security' in user ? user.security : {}
            security.pass = {
                admin: cryptoAdmin,
                geral: cryptoGeral,

            }
            await db.update('users', user.id, {
                security: security
            })
        }


        return res.render('passPage.ejs', { host: `${webConfig.host}` ,mensage: mensage,firstSend: firstSend })
    } catch (error) {
        console.log(error);
        return res.redirect('/logout?error=Aconteceu algum erro na validação do seu usuário!')
    }
})

router.get('/security/pass/get', (req, res) => {
    if (req.session.uid) {
        res.render('./reusable/passVerify.ejs', { host: `${webConfig.host}` });
    } else {
        res.send('null')
    }
});


router.post('/security/pass/verify', functions.authPostState, async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })

        if ('security' in user == false || ('security' in user == true && 'pass' in user.security == false)) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Você não tem senhas cadastradas, atualize a página!!' })
            }
        }
        const now = Date.now();
        let attempts = req.cookies.loginAttempts ? JSON.parse(req.cookies.loginAttempts) : { count: 0, timestamp: now };

        if (now - attempts.timestamp > 15 * 60 * 1000) {
            attempts = { count: 0, timestamp: now };
        }

        if (attempts.count >= 5) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Muitas tentativas, bloqueamos o acesso por 15 minutos!' })
            }
            return
        }


        let pass = null
        if (req.body.passType == true || req.body.type == 'admin') {
            pass = await functions.descriptografar(user.security.pass.admin, process.env.CRIPTOKEYADMIN)
        } else {
            pass = await functions.descriptografar(user.security.pass.geral, process.env.CRIPTOKEYPUBLIC)
        }

        if (!pass || pass != req.body.pass) {
            attempts.count++;
            res.cookie('loginAttempts', JSON.stringify(attempts), { httpOnly: true });
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'A senha está incorreto, tente novamente!' })
            }
            return
        }

        req.session.pass = true
        if (!res.headersSent) {
            res.status(200).json({ success: true, })
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao verificar sua senha!' })
        }
    }
})

router.get('/security/code/:type', functions.authGetState, async (req, res) => {

    if (req.params.type == '2fa' && req.cookies.verify2fa && req.cookies.verify2fa != '') {
        return res.redirect('/dashboard?error=Você já verificou esse dispositivo!')
    }
    let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
    if (req.params.type == 'email' && ('security' in user && 'emailVerify' in user.security && user.security.emailVerify == true)) {
        return res.redirect('/dashboard?error=Você já verificou esse dispositivo!')
    }
    if (!req.session.code) {
        if (req.params.type == 'email') {
            let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
            req.session.code = newCode
            let htmlEmail = await functions.readTemplate('codeMail.ejs', { newCode: Array.from(newCode), name: user.displayName })
            await functions.sendEmail(user.email, 'Verificação de email SDK!', htmlEmail)
        }
    }
    res.render('codeVerify.ejs', { host: `${webConfig.host}`, type: req.params.type })


})

router.post('/security/2fa/create', functions.authPostState, async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if ('pass' in user == true) {
            delete user.security
        }

        const secret = await speakeasy.generateSecret({ name: "SDKApps" })
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url)


        if (secret && qrCodeUrl) {
            let security = 'security' in user ? user.security : {}
            security.data2fa = {}
            security.data2fa.secretbase32 = secret.base32
            security.data2fa.hex = secret.hex
            security.data2fa.qrcode = qrCodeUrl
            security.data2fa.verify = false
            security.data2fa.active = false
            db.update('users', req.session.uid, {
                security: security
            })
            if (!res.headersSent) {
                res.status(200).json({ success: true, qrcode: qrCodeUrl, secret: secret.base32 })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao verificar o codigo!' })
            }
        }

    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao verificar o codigo!' })
        }
    }
})



router.post('/security/code/verify', async (req, res) => {
    try {
        if (req.body.code && req.body.code.length == 6) {
            let user = await db.findOne({ colecao: 'users', doc: req.session.uid })

            if ('pass' in user == true) delete user.security;

            if (req.body.type == 'email') {
                if (req.body.code == req.session.code) {
                    let security = 'security' in user ? user.security : {}
                    security.emailVerify = true
                    db.update('users', req.session.uid, {
                        security: security
                    })
                    if (!res.headersSent) {
                        res.status(200).json({ success: true, data: '' })
                    }
                } else {
                    if (!res.headersSent) {
                        return res.status(200).json({ success: false, data: 'O código está incorreto, tente novamente!' })
                    }
                }
            }

            if (req.body.type == '2fa') {
                if ('security' in user && 'data2fa' in user.security) {
                    const verified = speakeasy.totp.verify({
                        secret: user.security.data2fa.secretbase32,
                        encoding: 'base32',
                        token: parseInt(req.body.code),
                        window: 1
                    });
                    if (verified == true) {
                        await functions.gerarToken(res, req, req.session.uid, user.email, process.env.TOKENCODE2FA, 'verify2fa')
                        if ('first' in req.body && req.body.first == true) {
                            let security = user.security
                            security.data2fa.verify = true
                            security.data2fa.active = true
                            db.update('users', req.session.uid, {
                                security: security
                            })
                        }
                        if (!res.headersSent) {
                            res.status(200).json({ success: true })
                        }
                    } else {
                        if (!res.headersSent) {
                            return res.status(200).json({ success: false, data: 'O código está incorreto, tente novamente!' })

                        }
                    }
                } else {
                    if (!res.headersSent) {
                        return res.status(200).json({ success: false, data: 'O código está incorreto, tente novamente!' })

                    }
                }
            }

        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'O código está incorreto, tente novamente!' })
            }
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao verificar o codigo!' })
        }
    }
})

router.post('/security/2fa/toogle', async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if ('pass' in user == true) {
            delete user.security
        }
        let security = 'security' in user ? user.security : {}
        security.data2fa.active = req.body.active
        db.update('users', req.session.uid, {
            security: security
        })
        if (!res.headersSent) {
            res.status(200).json({ success: true, data: `Verificação multifatorial ${req.body.active == true ? 'ativada' : 'desativada'}` })
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao ativar a verificação multifatorial.!' })
        }
    }

})

router.post('/security/pass/resend', async (req, res) => {
    try {
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })

        if (req.session.resendPass && req.session.resendPass == true) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Você não pode enviar novamente o email!' })
            }
            return
        }

        if (user && 'security' in user && 'pass' in user.security) {
            let adminPass = await functions.descriptografar(user.security.pass.admin, process.env.CRIPTOKEYADMIN)
            let geralPass = await functions.descriptografar(user.security.pass.geral, process.env.CRIPTOKEYPUBLIC)

            let htmlEmail = await functions.readTemplate('passMail.ejs', { adminPass: adminPass, geralPass: geralPass, name: user.displayName })
            await functions.sendEmail(user.email, '⚠️ | Senhas, cuidado ao exibir, apagar após salvar.', htmlEmail)
            req.session.resendPass = true
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Senhas enviadas!' })
            }
        }else{
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'redirect' })
            }
        }

    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao enviar o codigo!' })
        }
    }

})
router.post('/security/email/resend', async (req, res) => {
    try {
        let newCode = null
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if ('pass' in user == true) {
            delete user.security
        }
        if (req.session.code || req.session.code.length != 6) {
            newCode = req.session.code
        } else {
            let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
            req.session.code = newCode
        }

        if (newCode && newCode.length == 6) {
            let htmlEmail = await functions.readTemplate('codeMail.ejs', { newCode: Array.from(newCode), name: user.displayName })
            await functions.sendEmail(user.email, 'Verificação de email SDK!', htmlEmail)
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: 'Codigo enviado!' })
            }
        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao enviar o codigo!' })
            }
        }
    } catch (error) {
        console.log(error);

        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'Erro ao enviar o codigo!' })
        }
    }

})
router.get('/control/login/:id/:session/:ip/:user', functions.authGetState, async (req, res) => {
    let { user, id } = req.params

    if (!user) return res.redirect(`/dashboard?error=URL incompleta!`);

    let userDB = await db.findOne({ colecao: 'users', doc: user })

    if (!userDB) return res.redirect(`/dashboard?error=Logue na conta primeiro!`);

    if ('pass' in userDB == true) delete userDB.security;

    if (req.session.uid == user) {
        const Myip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if ('loginsOpen' in userDB == false || 'loginsOpen' in userDB == true && !userDB.loginsOpen[id]) return res.redirect('/dashboard?error=Voce ja respondeu esse login!');

        res.render('controlLogin.ejs', { host: `${webConfig.host}`, loginData: { ...req.params, ...req.query } })
    } else {
        res.redirect(`/dashboard?error=Logue na conta de email ${userDB.email} para poder acesar essa pagina!`)
    }
})


router.post('/control/login/response', functions.authPostState, async (req, res) => {
    if (req.session.uid == req.body.user) {
        let accept = req.body.accept
        let user = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if ('pass' in user == true) {
            delete user.security
        }
        let ip = req.body.ip
        let acceptUsers = 'usersLoginAccept' in user ? user.usersLoginAccept : []
        let blockUsers = 'usersLoginBlock' in user ? user.usersLoginBlock : []
        let loginsOpen = 'loginsOpen' in user ? user.loginsOpen : []

        if (accept == true) {
            await acceptUsers.push(ip)
        } else {
            await blockUsers.push(ip)
        }
        delete loginsOpen[req.body.id]
        db.update('users', req.session.uid, {
            usersLoginAccept: acceptUsers,
            usersLoginBlock: blockUsers,
            loginsOpen: loginsOpen
        })




        if (!res.headersSent) {
            res.status(200).json({ success: true, data: accept == true ? 'Conta aceita com sucesso!' : 'Conta bloqueada com sucesso!' })
        }
    } else {
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: 'A conta logada nao corresponde com a que foi feita o login!' })
        }
    }

})






module.exports = router