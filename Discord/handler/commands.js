const { REST, Routes, Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
let webConfig = require('../../config/web-config');
let botConfig = require('../../config/bot-config');
    // FUNCAO PARA APAGAR OS COMANDOS ANTIGOS
    // client.on("ready", async () => {
    //     client.guilds.cache.forEach(guild => {
    //          guild.commands.set([])
    //     })
    // });
module.exports = async (client) => {
    client.commands = new Collection();

    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandsFolder = fs.readdirSync(commandsPath);

    for (const file of commandsFolder) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON()); 
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    
    
    const rest = new REST({ version: '10' }).setToken(botConfig.discordToken); 

    try {
        await rest.put(
            Routes.applicationCommands(webConfig.clientId),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('ERROR reloaded application (/) commands: ',error);
    }

};