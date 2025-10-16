const express = require('express');
const router = express.Router();
const functions = require('../functions')
const db = require('../Firebase/models')
let database2 = require("../DataBase/db")

const axios = require('axios')

let client = require('../Discord/discordIndex').client
const webConfig = require('../config/web-config');
let storeFunctions = require('../functions/storeFunctions');
const { database } = require('firebase-admin');




router.get('/store/:idn', async (req, res) => { 
    let storeID = req.params.idn
    let store = await db.findOne({ colecao: 'stores', where: ['IDName', '==', storeID] })
    let user = null

   
    if (!store || store.error == true) {
        store = await db.findOne({ colecao: 'stores', doc: storeID })
    }

    
    let result = await storeFunctions.storeVerify(store)

    if (result && result.error == true) {
        res.redirect(`/?error=${result.message}`)
        return

    }


    if (req.session.uid) {
        let userf = await db.findOne({ colecao: 'users', doc: req.session.uid })
        if (userf && userf.error == false ) {
            user = userf
            user.isOwner = await functions.includesStorageRef(user.stores, storeID)
            
        }
    }


    delete store.storeData
    delete store.integrations
    delete store.functions
    
    
    res.render('./store/products', { store: store, user: user })

})

router.get('/store/about/:idn', async (req, res) => {
    let storeID = req.params.idn
    let store = await db.findOne({ colecao: 'stores', doc: storeID })
    if (!store || store.error == true) {
        store = await db.findOne({ colecao: 'stores', where: ['IDName', '==', storeID] })
    }

    let result = await storeFunctions.storeVerify(store)

    if (result && result.error == true) {
        res.redirect(`/?error=${result.message}`)
        return

    }

    res.render('./store/about', { store: store })
})



router.get('/store/feedback/:idn', async (req, res) => {
    let storeID = req.params.idn
    let store = await db.findOne({ colecao: 'stores', doc: storeID })
    if (!store || store.error == true) {
        store = await db.findOne({ colecao: 'stores', where: ['IDName', '==', storeID] })
    }

    let result = await storeFunctions.storeVerify(store)

    if (result && result.error == true) {
        res.redirect(`/?error=${result.message}`)
        return

    }

    let reviews = await new Promise((resolve, reject) => {
        database2.get(`stores/${store.id}`, `reviews`)
            .then(data => resolve(data))
            .catch(err => console.log(err));
    });

    res.render('./store/feedback', { store: store, reviews: reviews })
})


router.get('/store/:idn/checkout', async (req, res) => {
    let storeID = req.params.idn
    let store = await db.findOne({ colecao: 'stores', doc: storeID })
    if (!store || store.error == true) {
        store = await db.findOne({ colecao: 'stores', where: ['IDName', '==', storeID] })
    }


    let result = await storeFunctions.storeVerify(store)

    if (result && result.error == true) {
        res.redirect(`/?error=${result.message}`)
        return
    }
    

    res.render('./store/checkout', { store: store })
})

module.exports = router;