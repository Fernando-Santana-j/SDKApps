const express = require('express');
const router = express.Router();
const db = require('../../Firebase/models')
const database2 = require("../../DataBase/db")
const functions = require('../../functions');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'))
    },
    filename: function (req, file, cb) {
        const codigo = require('crypto').randomBytes(32).toString('hex');
        const originalName = file.originalname;
        const date = Date.now()
        let extension = originalName.substr(originalName.lastIndexOf('.'));

        if (!extension || !extension.includes('.')) {
            extension = file.mimetype.replace('image/', '.');
        }
        const fileName = date + '-' + codigo + extension;

        cb(null, `${fileName}`)
    }
});

const upload = multer({ storage });

















router.post('/store/create', upload.fields([{ name: 'StoreLogo', maxCount: 1 }, { name: 'StoreBackGround', maxCount: 1 }]), functions.authPostState, async (req, res) => {
    try {
        let { DisplayName, IDName, userID = req.session.uid, onboarding = null } = req.body;

        let logo = null
        if (!userID) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Não foi possivel localizar o seu usuario!' })
            }
            return
        }


        if (!req.files.StoreLogo) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Insira uma imagem de logo!' })
            }
            return
        } else {
            let compri = await functions.comprimAndRecort(req.files.StoreLogo[0].path, path.join(__dirname, '..', `../uploads/stores/logos/${'logo_' + req.files.StoreLogo[0].filename}`))
            logo = compri.success == true ? `/uploads/stores/logos/${'logo_' + req.files.StoreLogo[0].filename}` : null
        }

        if (!logo) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Insira uma imagem de logo!' })
            }
            return
        }

        if (!DisplayName || !IDName) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Nomes invalidos!' })
            }
            return
        }

        if (DisplayName.length > 30 || IDName.length > 30) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Nomes muito longos!' })
            }
            return
        }

        if (DisplayName.length < 5 || IDName.length < 5) {
            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Nomes muito curtos!' })
            }
            return
        }
        let background = null



        if (onboarding) {
            let { RName, IDCode, adress, adressNumber } = JSON.parse(onboarding)

            onboarding = JSON.parse(onboarding)


            if (!req.files.StoreBackGround) {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Insira uma imagem de fundo!' })
                }
                return
            } else {
                let compri = await functions.comprimAndRecort(req.files.StoreBackGround[0].path, path.join(__dirname, '..', `../uploads/stores/backgrounds/${'background_' + req.files.StoreBackGround[0].filename}`))
                background = compri.success == true ? `/uploads/stores/backgrounds/${'background_' + req.files.StoreBackGround[0].filename}` : null
            }
            onboarding.background = background
            if (!RName || !IDCode || !adress || !adressNumber) {
                if (!res.headersSent) {
                    res.status(200).json({ success: false, data: 'Alguns campos estao vazios!' })
                }
                return
            }
        }


        let createStore = await require('../../functions/createNewStore')(DisplayName, IDName, userID, logo, onboarding)

        if (createStore.error == true) {
            console.log(createStore);

            if (!res.headersSent) {
                res.status(200).json({ success: false, data: 'Erro ao criar a loja' })
            }
            return

        } else {
            if (!res.headersSent) {
                res.status(200).json({ success: true, data: "Loja criada com sucesso, voce sera redirecionado!", storeID: createStore.storeID })
            }
        }



    } catch (error) {
        console.log('RouteCreateStoreERROR', error);
        if (!res.headersSent) {
            res.status(200).json({ success: false, data: "Verifique os dados e tente novamente" })
        }
    }

})



router.post("/store/feedback/submit", async (req, res) => {
    try {
        let { name, email, rating, content, date, storeID } = req.body;

        console.log(name,email,rating,content,date,storeID);
        
        // Validações simples
        if (!name || !email || !rating || !content || !date || !storeID) {
            return res.json({ success: false, data: "Todos os campos são obrigatórios." });
        }

        let store = db.findOne({ colecao: 'stores', doc: storeID });

        if (!store || store.error == true) {
            return res.json({ success: false, data: "Loja não encontrada." });

        }


        let reviewJson = await database2.hasFile(`stores/${storeID}`, "reviews") || []

        reviewJson.push({
            name,
            email,
            rating: Number(rating),
            content
        });

        await database2.set(`stores/${storeID}`,"reviews", reviewJson)


        return res.json({ success: true, data: "Feedback enviado com sucesso!" });
    } catch (error) {
        console.log(error);

        return res.json({ success: false, data: "Erro ao enviar feedback.", err: error });
    }
});








module.exports = router;
