const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return console.error('No guild found.');

    const commands = [
        new SlashCommandBuilder().setName('ban').setDescription('Ban a user')
            .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false)),
        new SlashCommandBuilder().setName('remove-ban').setDescription('Remove a ban from a user')
            .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true)),
        new SlashCommandBuilder().setName('timeout').setDescription('Timeout a user')
            .addUserOption(option => option.setName('user').setDescription('The user to timeout').setRequired(true))
            .addIntegerOption(option => option.setName('duration').setDescription('Timeout duration in seconds').setRequired(true)),
        new SlashCommandBuilder().setName('remove-timeout').setDescription('Remove timeout from a user')
            .addUserOption(option => option.setName('user').setDescription('The user to remove timeout from').setRequired(true)),
        new SlashCommandBuilder().setName('kick').setDescription('Kick a user')
            .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true)),
        new SlashCommandBuilder().setName('purge').setDescription('Delete a number of messages')
            .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
    ];

    await guild.commands.set(commands);
    console.log('Slash commands registered.');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        if (commandName === 'ban') {
            const user = options.getUser('user');
            const reason = options.getString('reason') || 'No reason provided';
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.ban({ reason });
                const embed = new EmbedBuilder()
                    .setTitle('User Banned')
                    .setDescription(`${user.tag} has been banned.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor('RED');
                await interaction.reply({ embeds: [embed] });

                await user.send(`You have been banned from ${interaction.guild.name}. Reason: ${reason}`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'remove-ban') {
            const userId = options.getString('userid');
            await interaction.guild.bans.remove(userId);
            const embed = new EmbedBuilder()
                .setTitle('Ban Removed')
                .setDescription(`Ban removed for user ID ${userId}.`)
                .setColor('GREEN');
            await interaction.reply({ embeds: [embed] });

            const user = await client.users.fetch(userId);
            await user.send(`Your ban has been removed from ${interaction.guild.name}.`);
        } else if (commandName === 'timeout') {
            const user = options.getUser('user');
            const duration = options.getInteger('duration');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.timeout(duration * 1000);
                const embed = new EmbedBuilder()
                    .setTitle('User Timed Out')
                    .setDescription(`${user.tag} has been timed out for ${duration} seconds.`)
                    .setColor('ORANGE');
                await interaction.reply({ embeds: [embed] });

                await user.send(`You have been timed out in ${interaction.guild.name} for ${duration} seconds.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'remove-timeout') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.timeout(null);
                const embed = new EmbedBuilder()
                    .setTitle('Timeout Removed')
                    .setDescription(`Timeout removed for ${user.tag}.`)
                    .setColor('GREEN');
                await interaction.reply({ embeds: [embed] });

                await user.send(`Your timeout has been removed in ${interaction.guild.name}.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'kick') {
            const user = options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                await member.kick();
                const embed = new EmbedBuilder()
                    .setTitle('User Kicked')
                    .setDescription(`${user.tag} has been kicked.`)
                    .setColor('RED');
                await interaction.reply({ embeds: [embed] });

                await user.send(`You have been kicked from ${interaction.guild.name}.`);
            } else {
                await interaction.reply('User not found.');
            }
        } else if (commandName === 'purge') {
            const amount = options.getInteger('amount');
            if (amount < 1 || amount > 100) {
                return interaction.reply('Please provide a number between 1 and 100.');
            }
            const messages = await interaction.channel.bulkDelete(amount, true);
            const embed = new EmbedBuilder()
                .setTitle('Messages Purged')
                .setDescription(`${messages.size} messages have been deleted.`)
                .setColor('BLUE');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred while executing the command.');
    }
});

client.login('YOUR_BOT_TOKEN');