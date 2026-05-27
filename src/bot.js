const { Client, GateawayIntentBits, Collection, Rest, Routes, Interaction } = require('discord.js');
const fs = require('fs');
const { register } = require('module');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [GateawayIntentBits.Guilds, GateawayIntentBits.GuildMembers, GateawayIntentBits.MessageContent],
});

client.commands = new Collection();
const commands = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

// Load Commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.warn(`Command ${file} is missing required "data" or "execute" properties`);
    }
}

// When bot is ready
client.once('ready', () => {
    console.log(`Bot Logged in as ${client.user.tag}`);
    registerCommands();
});

// Handle Interactions
client.on('interactionCreate', async (Interaction) => {
    if (!Interaction.isChatInputCommand()) return;

    const command = client.commands.get(Interaction.commandName);
    if (!command) {
        console.warn(`Command ${Interaction.commandName} not found`);
        return;
    }

    try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

async function registerCommands() {
    const rest = new Rest({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = client.commands.map(cmd => cmd.data.toJSON);

    try {
        console.log(`Registering ${commands.length} command(s)...`);
        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), {
            body: commands,
        });
        console.log('Commands registered successfully');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

client.login(process.env.DISCORD_TOKEN);