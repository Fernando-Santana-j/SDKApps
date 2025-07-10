const db = require('../Firebase/models')
const dataBase = require('../Firebase/db')
const { create } = require('qrcode')
const functions = require('../functions')
module.exports = {
    storeVerify: async (store) => {
        if (!store || store.error == true) {
            return {
                error: true,
                message: 'Loja nao encontrada!'
            }
            return
        }
    
        if (store.status == 'inativo' || store.status == 'pendente') {
            return {
                error: true,
                message: 'Loja indisponivel!'
            }
        }
        
    
        if ('functions' in store && 'onView' in store && store.functions.onView == false) {
            return {
                error: true,
                message: 'Loja indisponivel!'
            }
        }
    
        return {
            error: false,
            message: ''
        }
    }
}