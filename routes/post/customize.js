const express = require('express');
const router = express.Router();
const db = require('../../Firebase/models')
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



router.post('/customize/update', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'background', maxCount: 1 }]), async (req, res) => {

    try {
        const { storeID } = req.body;

        if (!storeID) {
            return res.status(404).json({ error: 'Loja nao encontrada' });
        }

        const store = await db.findOne({ colecao: "stores", doc: storeID });

        if (store.error == true) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        let logo = req.files ? req.files.logo : null;
        let background = req.files ? req.files.background : null;

        let logoPath, backgroundPath;

        if (logo && logo[0]) {
            let logoComprimido = await functions.comprimAndRecort(logo[0].path, path.join(__dirname, '../../uploads/stores/logos/' + logo[0].filename));
            if (logoComprimido.success == true && logoComprimido.path) {
                logoPath = `/uploads/stores/logos/${logo[0].filename}`
            }
        }

        if (background && background[0]) {
            let backgroundComprimido = await functions.comprimAndRecort(background[0].path, path.join(__dirname, '../../uploads/stores/backgrounds/' + background[0].filename));
            if (backgroundComprimido.success == true && backgroundComprimido.path) {
                backgroundPath = `/uploads/stores/backgrounds/${background[0].filename}`
            }
        }
        
        const { displayName, description, mainColor, mainLightColor, mainStrongColor, accentColor, mainBG, surfaceColorBG, secundarySurfaceColorBG, mainTextColor, secundaryTextColor, grayTextColor, errorColor, mainPadding, mainRadius } = req.body;



        const styleData = {
            description: description ? description : store.style.description ? store.style.description : '',
            mainColor: mainColor ? mainColor : store.style.mainColor ? store.style.mainColor : '',
            mainLightColor: mainLightColor ? mainLightColor : store.style.mainLightColor ? store.style.mainLightColor : '',
            mainStrongColor: mainStrongColor ? mainStrongColor : store.style.mainStrongColor ? store.style.mainStrongColor : '',
            accentColor: accentColor ? accentColor : store.style.accentColor ? store.style.accentColor : '',
            mainBG: mainBG ? mainBG : store.style.mainBG ? store.style.mainBG : '',
            surfaceColorBG: surfaceColorBG ? surfaceColorBG : store.style.surfaceColorBG ? store.style.surfaceColorBG : '',
            secundarySurfaceColorBG: secundarySurfaceColorBG ? secundarySurfaceColorBG : store.style.secundarySurfaceColorBG ? store.style.secundarySurfaceColorBG : '',
            mainTextColor: mainTextColor ? mainTextColor : store.style.mainTextColor ? store.style.mainTextColor : '',
            secundaryTextColor: secundaryTextColor ? secundaryTextColor : store.style.secundaryTextColor ? store.style.secundaryTextColor : '',
            grayTextColor: grayTextColor ? grayTextColor : store.style.grayTextColor ? store.style.grayTextColor : '',
            errorColor: errorColor ? errorColor : store.style.errorColor ? store.style.errorColor : '',
            mainPadding: mainPadding ? mainPadding : store.style.mainPadding ? store.style.mainPadding : '',
            mainRadius: mainRadius ? mainRadius : store.style.mainRadius ? store.style.mainRadius : '',
            mainPadding: mainPadding ? mainPadding : store.style.mainPadding ? store.style.mainPadding : '',
            mainRadius: mainRadius ? mainRadius : store.style.mainRadius ? store.style.mainRadius : '',
            logo: logoPath ? logoPath : store.style.logo ? store.style.logo : '',
            backgroundImage: backgroundPath ? backgroundPath : store.style.backgroundImage ? store.style.backgroundImage : '',
        }

        store.style = styleData;
        store.displayName = displayName ? displayName : store.displayName;
        
        await db.update("stores", storeID, store);

        res.status(200).json({ success: true, data: 'Dados atualizados com sucesso!' });
    } catch (error) {
        console.log(error);
        res.status(200).json({ success: false, data: 'Erro ao tentar atualizar os dados!' });
    }
})

module.exports = router;
