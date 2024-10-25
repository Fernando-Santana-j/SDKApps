let client = require('./discordIndex').client
let webConfig = require('../config/bot-config')
const guild = client.guilds.cache.get(webConfig.dbServer);


function getEmojiID(emojiName) {
    
    const emoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
    return emoji.id
}

module.exports = {
    // cupom: getEmojiID('SDKCupomIcon'),
    // comprar:  getEmojiID('SDKComprarIcon'),
    // editar:  getEmojiID('SDKEditarIcon'),
    // voltar:  getEmojiID('SDKVoltarIcon'),
    // cancelar:  getEmojiID('SDKCancelarIcon'),
    // apagar: getEmojiID('SDKTrashIcon'),
    // aviso: getEmojiID('SDKWarningIcon'),
    // boleto: getEmojiID('SDKBoletoIcon'),
    // pix: getEmojiID('SDKPixIcons'),
    // card: getEmojiID('SDKCardIcon'),
    // redirect: getEmojiID('SDKRedirectIcon'),
    // copy: getEmojiID('SDKCopyIcon'),
    comprar: '1289094712598204449',
    editar: '1289095086923190303',
    voltar: '1289095645138911256',
    cancelar: '1289095083756490884',
    apagar: '1289095089045508187',
    aviso: '1285320746922672190',
    boleto: '1289101749675753515',
    pix: '1289101748056887307',
    card: '1289101746551132171',
    redirect: '1289524665743835197',
    copy: '1289524663956803675',
    ticket: '1289855120955408406',
    star: '1289855119499985029',
    stock: '1289858397407285319',
    notice: '1289858981929549834',
    cart:'1289859316911837185',
    notify:'1289860581972774966',
    phone:'1289861012048052246'
}