const express = require('express');
const router = express.Router();
const db = require('../../Firebase/models')
const dataBase = require('../../Firebase/db')
const functions = require('../../functions');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'))
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(32).toString('hex');
        const originalName = file.originalname;
        const date = Date.now()
        const extension = originalName.substr(originalName.lastIndexOf('.'));
        const fileName = date + '-' + codigo + extension;
        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });

require('dotenv').config()












router.post('/auth/register', async (req, res) => {
    try {
        let { senha, email } = req.body;

        if (!email || email.length < 8 || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Email invalido ou muito curto!' })
            }
            return
        }

        if (!senha || senha.length < 6) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Senha invalida ou muito curta!' })
            }
            return
        }


        let user = await db.findOne({ where: ['email', '==', email], colecao: 'users' });

        if (user && user.error == false) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Email ja cadastrado!' })
            }
            return
        }





        let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
        req.session.code = newCode

        let docRef = await dataBase.collection('users').doc()
        docRef.set({
            id: docRef.id,
            ...{
                email: email,
                username: email.replace(/@.+$/, ''),
                senha: await functions.criptografar(senha, process.env.CRIPTOKEYADMIN),
                provider: 'email',
                security: {
                    emailVerify: false,
                }
            }
        }).then(async () => {
            let htmlEmail = await functions.sendEmail(user.email, 'Verificação de email SDK!', { code: newCode, name: user.displayName })
            await functions.sendEmail(email, 'Verificação de email SDK!', htmlEmail)
            if (!res.headersSent) {
                res.status(200).json({ success: true, userID: docRef.id })
            }
        })
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: "Verifique os dados e tente novamente" })
        }
    }

})


router.post('/auth/login', async (req, res) => {
    try {
        let { senha, email } = req.body;

        if (!email || email.length < 8 || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Email invalido ou muito curto!' })
            }
            return
        }

        if (!senha || senha.length < 6) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Senha invalida ou muito curta!' })
            }
            return
        }


        let user = await db.findOne({ where: ['email', '==', email], colecao: 'users' });

        if (!user && user.error == true) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Email nao cadastrado!' })
            }
            return
        }

        let senhaDesc = await functions.descriptografar(user.senha, process.env.CRIPTOKEYADMIN)
        if (senhaDesc != senha) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Senha incorreta!' })
            }
            return
        }



        let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
        req.session.code = newCode

        let htmlEmail = await functions.sendEmail(user.email, 'Verificação de email SDK!', { code: newCode, name: user.displayName })
        await functions.sendEmail(email, 'Verificação de email SDK!', htmlEmail)
        if (!res.headersSent) {
            res.status(200).json({ success: true, userID: user.id })
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: "Verifique os dados e tente novamente" })
        }
    }

})




router.post('/auth/login/google', async (req, res) => {
    try {

        let user = req.body.user

        if (user && 'email' in user && user.email.length > 0) {
            let findUser = await db.findOne({ colecao: 'users', where: ['email', '==', user.email] })
           
            if (findUser && findUser.error == false) {
                await functions.auth(req, res, findUser.id)
                if (!res.headersSent) {
                    if (findUser.security.emailVerify == false) {
                        let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
                        req.session.code = newCode
                        let htmlEmail = await functions.sendEmail(user.email, 'Verificação de email SDK!', { code: newCode, name: user.displayName })
                        await functions.sendEmail(findUser.email, 'Verificação de email SDK!', htmlEmail)
                    }
                    db.update('users', findUser.id, {
                        email: user.email,
                        username: 'displayName' in user ? user.displayName : user.email.replace(/@.+$/, ''),
                        provider: 'google',
                        security: {
                            emailVerify: false,
                        },
                        profile_pic: user.profile_pic

                    })
                    res.status(200).json({ success: true, userID: findUser.id, emailVerify: findUser.security.emailVerify})
                }
                
            } else {
                let docRef = await dataBase.collection('users').doc()
                docRef.set({
                    id: docRef.id,
                    ...{
                        email: user.email,
                        username: 'displayName' in user ? user.displayName : user.email.replace(/@.+$/, ''),
                        provider: 'google',
                        security: {
                            emailVerify: false,
                        },
                        profilePic: user.photoURL || null

                    }
                }).then(async () => {
                    let newCode = ('' + Math.floor(Math.random() * 1e6)).slice(-6)
                    req.session.code = newCode
                    let htmlEmail = await functions.sendEmail(user.email, 'Verificação de email SDK!', { code: newCode, name: user.displayName })
                    await functions.sendEmail(user.email, 'Verificação de email SDK!', htmlEmail)

                    if (!res.headersSent) {
                        res.status(200).json({ success: true, userID: docRef.id, emailVerify: false })
                    }
                })
            }
        }else{
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Não foi possivel fazer login com o google, tente novamente!' })
            }
            return
        }
    } catch (error) {
        console.log(error);
        
        res.status(200).json({ success: false, data: 'Erro ao tentar fazer login com o google!' })
    }
})


module.exports = router;
