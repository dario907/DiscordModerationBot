const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Register slash commands
client.once('ready', async () => {
    const guild = client.guilds.cache.first(); // Adjust this to target a specific guild if needed
    if (!guild) return console.error('No guild found.');

    const commands = [
        new SlashCommandBuilder().setName('ban').setDescription('Ban a user').addUserOption(option => 
            option.setName('user').setDescription('The user to ban').setRequired(true)),
        new SlashCommandBuilder().setName('remove-ban').setDescription('Remove a ban from a user').addStringOption(option => 
            option.setName('userid').setDescription('The ID of the user to unban').setRequired(true)),
        new SlashCommandBuilder().setName('timeout').setDescription('Timeout a user').addUserOption(option => 
            option.setName('user').setDescription('The user to timeout').setRequired(true)).addIntegerOption(option => 
            option.setName('duration').setDescription('Timeout duration in seconds').setRequired(true)),
        new SlashCommandBuilder().setName('remove-timeout').setDescription('Remove timeout from a user').addUserOption(option => 
            option.setName('user').setDescription('The user to remove timeout from').setRequired(true)),
        new SlashCommandBuilder().setName('kick').setDescription('Kick a user').addUserOption(option => 
            option.setName('user').setDescription('The user to kick').setRequired(true)),
    ];

    await guild.commands.set(commands);
    console.log('Slash commands registered.');
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        if (commandName === 'ban') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.ban();
                await interaction.reply(`${user.tag} has been banned.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'remove-ban') {
            const userId = options.getString('userid');
            await interaction.guild.bans.remove(userId);
            await interaction.reply(`Ban removed for user ID ${userId}.`);
        } else if (commandName === 'timeout') {
            const user = options.getUser('user');
            const duration = options.getInteger('duration');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.timeout(duration * 1000);
                await interaction.reply(`${user.tag} has been timed out for ${duration} seconds.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'remove-timeout') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.timeout(null);
                await interaction.reply(`Timeout removed for ${user.tag}.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'kick') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.kick();
                await interaction.reply(`${user.tag} has been kicked.`);
            } else {
                await interaction.reply('User not found.');
            }
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred while executing the command.');
    }
});

// Login to Discord
client.login('YOUR_BOT_TOKEN');