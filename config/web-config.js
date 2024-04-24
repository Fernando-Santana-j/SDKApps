require('dotenv').config()

module.exports = {
    session:{
        secret: process.env.SECRET || "290jnid9awnd981924y12989032hbt30ng093bg209gn9320gh092ng302hg29bg30",
        resave: false, 
        saveUninitialized: false,
    },
    port: process.env.PORT || 3000,
    // serviceAccount: JSON.parse(process.env.SERVICEACCOUNT),
    serviceAccount: require('./fireabse.json'),
    secret:process.env.CLIENTSECRET,
    clientId:process.env.CLIENTID,
    redirect:process.env.REDIRECTURL,
    stripe:process.env.STRIPE,
    iban:process.env.IBAN,
    stripeAccount:process.env.STRIPEACCOUNT,
    host:process.env.HOST,
    discordGuildUrl: "https://discord.com/oauth2/authorize?client_id=1210894508028338197&permissions=8&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2Fauth%2Fcallback%2Fguild&scope=bot+applications.commands+guilds.members.read+applications.commands.permissions.update"
}