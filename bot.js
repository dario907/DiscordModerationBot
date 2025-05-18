const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnectionStatus, AudioReceiveStream } = require('discord.js');
// const { getVoiceConnection, entersState } = require('@discordjs/voice');
// const { SpeechClient } = require('@google-cloud/speech'); // Requires Google Cloud Speech-to-Text API
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions] });

// const speechClient = new SpeechClient(); // Initialize Google Cloud Speech-to-Text client

client.once('ready', async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return console.error('No guild found.');

    if (client.user) {
        client.user.setPresence({
            activities: [{ name: 'Made by AlbaniaGuy', type: 'PLAYING' }],
            status: 'online',
        });
        console.log('Bot is online with status set.');
    } else {
        console.error('Client user is not ready.');
    }

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
        new SlashCommandBuilder().setName('create-vc').setDescription('Create a private voice channel')
            .addStringOption(option => option.setName('name').setDescription('Name of the private VC').setRequired(true)),
        // Add anti-raid command
        new SlashCommandBuilder().setName('anti-raid').setDescription('Enable or disable anti-raid emergency protection')
            .addStringOption(option =>
                option.setName('mode')
                    .setDescription('lock or unlock all text channels')
                    .setRequired(true)
                    .addChoices(
                        { name: 'lock', value: 'lock' },
                        { name: 'unlock', value: 'unlock' }
                    )
            ),
        new SlashCommandBuilder().setName('emergencyoff').setDescription('Disable all emergency protections and unlock all text channels'),
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
                    .setColor(0xff0000); // Use hexadecimal for red
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
                .setColor(0x00ff00); // Use hexadecimal for green
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
                    .setColor(0xffa500); // Use hexadecimal for orange
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
                    .setColor(0x00ff00); // Use hexadecimal for green
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
                    .setColor(0xff0000); // Use hexadecimal for red
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
                .setColor(0x0000ff); // Use hexadecimal for blue
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (commandName === 'create-vc') {
            const vcName = options.getString('name');
            const guild = interaction.guild;

            const privateVC = await guild.channels.create(vcName, {
                type: 'GUILD_VOICE',
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ManageChannels],
                    },
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle('Private Voice Channel Created')
                .setDescription(`Your private voice channel "${vcName}" has been created.`)
                .setColor('GREEN');
            await interaction.reply({ embeds: [embed] });

            const creatorId = interaction.user.id;

            client.on('voiceStateUpdate', async (oldState, newState) => {
                if (oldState.channelId === privateVC.id && oldState.member.id === creatorId && !newState.channelId) {
                    if (privateVC.members.size === 0) {
                        await privateVC.delete();
                        console.log(`Private VC "${vcName}" deleted as the creator left.`);
                    }
                }
            });
        } else if (commandName === 'anti-raid') {
            const mode = options.getString('mode');
            const guild = interaction.guild;
            const everyoneRole = guild.roles.everyone;
            let changedChannels = 0;

            for (const channel of guild.channels.cache.values()) {
                if (channel.type === 0) {
                    if (mode === 'lock') {
                        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }).catch(() => {});
                        changedChannels++;
                    } else if (mode === 'unlock') {
                        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null }).catch(() => {});
                        changedChannels++;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Anti-Raid Protection')
                .setDescription(mode === 'lock'
                    ? `🔒 All text channels have been locked for @everyone.`
                    : `🔓 All text channels have been unlocked for @everyone.`)
                .addFields({ name: 'Affected Channels', value: `${changedChannels}` })
                .setColor(mode === 'lock' ? 0xff0000 : 0x00ff00);

            await interaction.reply({ embeds: [embed] });
        } else if (commandName === 'emergencyoff') {
            const guild = interaction.guild;
            const everyoneRole = guild.roles.everyone;
            let changedChannels = 0;

            for (const channel of guild.channels.cache.values()) {
                if (channel.type === 0) {
                    await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null }).catch(() => {});
                    changedChannels++;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('Emergency Mode Disabled')
                .setDescription('🔓 All text channels have been unlocked for @everyone. Emergency protections are now off.')
                .addFields({ name: 'Affected Channels', value: `${changedChannels}` })
                .setColor(0x00ff00);

            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred while executing the command.');
    }
});

// --- Anti-spam, fake link, and attack detection ---
const SPAM_THRESHOLD = 5;
const SPAM_INTERVAL = 7000;
const spamMap = new Map();

const FAKE_LINK_REGEX = /(discord\.gift|free-nitro|airdrop|nitro.*\.com|discordapp\.net|discord-\w+\.com|bit\.ly|tinyurl\.com|grabify\.link|phishing|steamcommunnity|steamnity|steampowered|steamcommunity\.pw|steamcomminuty|steamcornmunity|steamcormmunity|steamcommunnity|steamcommunitiy|steamcommunit)/i;
const MASS_MENTION_REGEX = /@everyone|@here/;

async function logIncident(guild, description, details) {
    const logChannel = guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.type === 0);
    if (logChannel) {
        await logChannel.send({ embeds: [
            {
                title: '🚨 Moderation Alert',
                description,
                color: 0xff0000,
                fields: details ? Object.entries(details).map(([name, value]) => ({ name, value: String(value) })) : [],
                timestamp: new Date().toISOString()
            }
        ]});
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // --- Spam detection ---
    const now = Date.now();
    const userId = message.author.id;
    if (!spamMap.has(userId)) {
        spamMap.set(userId, []);
    }
    const timestamps = spamMap.get(userId);
    timestamps.push(now);
    // Remove old timestamps
    while (timestamps.length && now - timestamps[0] > SPAM_INTERVAL) {
        timestamps.shift();
    }
    if (timestamps.length >= SPAM_THRESHOLD) {
        await logIncident(message.guild, `Spam detected from ${message.author.tag}`, {
            'User': `<@${userId}>`,
            'Channel': `<#${message.channel.id}>`,
            'Content': message.content
        });
        // Optionally, take action (mute, kick, etc.)
        // await message.member.timeout(60_000, 'Spam detected');
        // Optionally, delete spam messages
        // await message.delete();
    }

    // --- Fake link detection ---
    if (FAKE_LINK_REGEX.test(message.content)) {
        await logIncident(message.guild, `Suspicious link detected from ${message.author.tag}`, {
            'User': `<@${userId}>`,
            'Channel': `<#${message.channel.id}>`,
            'Content': message.content
        });
        // Optionally, delete the message
        // await message.delete();
    }

    // --- Mass mention detection ---
    if (MASS_MENTION_REGEX.test(message.content)) {
        await logIncident(message.guild, `Mass mention detected from ${message.author.tag}`, {
            'User': `<@${userId}>`,
            'Channel': `<#${message.channel.id}>`,
            'Content': message.content
        });
        // Optionally, take action
    }
});

// Listen to voice channel events and transcribe (Optional if you want it)
/*
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.channelId && !oldState.channelId) {
        const connection = joinVoiceChannel({
            channelId: newState.channelId,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, async () => {
            console.log(`Connected to voice channel: ${newState.channel.name}`);
            const receiver = connection.receiver;

            receiver.speaking.on('start', async (userId) => {
                const user = await client.users.fetch(userId);
                console.log(`Listening to ${user.tag}`);

                const audioStream = receiver.subscribe(userId, { end: 'silence' });
                const filePath = path.join(__dirname, `audio_${userId}.pcm`);
                const writeStream = fs.createWriteStream(filePath);

                audioStream.pipe(writeStream);

                audioStream.on('end', async () => {
                    console.log(`Finished listening to ${user.tag}`);
                    writeStream.close();

                    const audioBytes = fs.readFileSync(filePath).toString('base64');
                    const audio = { content: audioBytes };
                    const config = {
                        encoding: 'LINEAR16',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US',
                    };
                    const request = { audio, config };

                    try {
                        const [response] = await speechClient.recognize(request);
                        const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
                        console.log(`Transcription for ${user.tag}: ${transcription}`);

                        const logChannel = newState.guild.channels.cache.find(channel => channel.name === 'voice-logs');
                        if (logChannel) {
                            logChannel.send(`[${user.tag}]: ${transcription}`);
                        }
                    } catch (error) {
                        console.error('Error during transcription:', error);
                    }

                    fs.unlinkSync(filePath); // Clean up temporary audio file
                });
            });
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log(`Disconnected from voice channel: ${newState.channel.name}`);
            connection.destroy();
        });
    }
});
*/

client.login('YOUR_BOT_TOKEN');