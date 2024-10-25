require('dotenv').config()

module.exports = {
    session:{
        secret: process.env.SECRET || "290jnid9awnd981924y12989032hbt30ng093bg209gn9320gh092ng302hg29bg30",
        resave: false, 
        saveUninitialized: false,
        cookie: { secure: (process.env.SECURE === "true") }
    },
    port: process.env.PORT || 3000,
    // serviceAccount: JSON.parse(process.env.SERVICEACCOUNT),
    serviceAccount: require('./firebase.json'),
    secret: process.env.CLIENTSECRET,
    clientId: process.env.CLIENTID,
    redirect: process.env.REDIRECTURL,
    stripe: process.env.STRIPE,
    iban: process.env.IBAN,
    stripeAccount: process.env.STRIPEACCOUNT,
    host: process.env.HOST,
    planos: require('./product.json'),
    loginURL: `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENTID}&response_type=code&redirect_uri=${process.env.REDIRECTURI}&scope=identify+email+guilds+guilds.join`,
    mercadoPagoToken:process.env.MERCADOPAGOTOKEN,
    cookieConfig:{ 
        httpOnly: true, 
        secure: (process.env.SECURE === "true"), 
        maxAge:60 * 60 * 24 * 180 * 1000
    }
}
