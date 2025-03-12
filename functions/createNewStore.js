const db = require('../Firebase/models')
const dataBase = require('../Firebase/db')
const { create } = require('qrcode')
const functions = require('../functions')
module.exports = async (displayName, IDName, userID,logo, onboarding = null)=>{
    return new Promise(async (resolve, reject)=>{
        try {
            let isOnboarding = onboarding ? true : false
            let newStoreModel = {
                displayName: displayName,
                IDName: IDName,
                style:{
                    backgroundImage: isOnboarding && onboarding.background ? onboarding.background : null,
                    primaryColor:null,
                    secondaryColor:null,
                    logo: logo,
                    favicon:null,
                    font:null,
                },
                
                products: [],
                status: isOnboarding ? 'active' : 'pending',
                functions:{
                    onSale: false,
                    onView: true,
                },
                integrations: {
                    discord:{
                        enabled: false,
                    }
                },
                storeData:{
                    createdAt: new Date(),
                    owner: userID,
                    adress: isOnboarding && onboarding.adress ? onboarding.adress : null,
                    adressNumber: isOnboarding && onboarding.adressNumber ? onboarding.adressNumber : null,
                    RName: isOnboarding && onboarding.RName ? onboarding.RName : null,
                    IDCode: isOnboarding && onboarding.IDCode ? onboarding.IDCode : null,
                    bankData:{}
                }
            }
        
        
        
        
            let docRef = await dataBase.collection('stores').doc()
            docRef.set({
                id: docRef.id,
                ...newStoreModel
            })

            let user = await db.findOne({colecao: 'users', doc: userID})
            if (user) {
                let stores = 'stores' in user ? user.stores : []
                stores.push(docRef)
                await db.update('users',userID, {stores: stores})
            }else{
                db.delete('stores', docRef.id)
            }

            resolve({error:false, storeID: docRef.id})
        } catch (error) {
            resolve({error:true, err:error})
        }
    })
}