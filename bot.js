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
        }
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred while executing the command.');
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