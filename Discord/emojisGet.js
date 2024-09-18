let client = require('./discordIndex').client
let webConfig = require('../config/bot-config')
const guild = client.guilds.cache.get(webConfig.dbServer);


function getEmojiID(emojiName) {
    const emoji = guild.emojis.cache.find(emoji => emoji.name === emojiName);
    return emoji.id
}
module.exports = {
    pix: getEmojiID('SDKPixIcon'),
}