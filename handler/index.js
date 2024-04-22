const fs = require("fs")
const path = require('path')

module.exports = async (client) => {
    const foldersPath = path.join(__dirname, 'commands/util');
    let SlashsArray = []

    fs.readdir(foldersPath, (error, files) => {
        files.forEach(files => {
            if (!files.endsWith('.js')) return;

            files = require(`${foldersPath}/${files}`);
            if (!files.name || files.return == true) return;
            client.slashCommands.set(files.name, files);
            SlashsArray.push(files)
        });
    });

    client.on("ready", async () => {
        client.guilds.cache.forEach(guild => guild.commands.set(SlashsArray))
    });
}