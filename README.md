# Discord Moderation Bot

A powerful Discord bot for server moderation, anti-raid, and utility features.

## Features

### Moderation Commands
- **/ban**: Ban a user with an optional reason. Sends a DM to the banned user.
- **/remove-ban**: Remove a ban from a user by their ID. Sends a DM to the unbanned user.
- **/timeout**: Timeout a user for a specified duration in seconds. Sends a DM to the timed-out user.
- **/remove-timeout**: Remove a timeout from a user. Sends a DM to the user.
- **/kick**: Kick a user from the server. Sends a DM to the kicked user.
- **/purge**: Delete a specified number of messages (1-100) from a channel.

### Private Voice Channel System
- **/create-vc**: Create a private voice channel with a custom name.
  - Only the creator can manage the channel.
  - The channel is automatically deleted when the creator leaves and no one else is in the channel.

### Anti-Raid & Emergency Protection
- **/anti-raid**: Instantly lock or unlock all text channels for @everyone in case of a raid or attack.
- **/emergencyoff**: Instantly unlock all text channels and disable emergency protections.

### Automated Moderation & Logging
- **Spam Detection**: Detects users sending too many messages in a short time and logs incidents.
- **Fake Link Detection**: Detects and logs suspicious or phishing links.
- **Mass Mention Detection**: Detects and logs mass mentions (e.g., @everyone, @here).
- **Incident Logging**: All incidents are logged to a channel named `mod-logs`.

### Voice Channel Transcription
- The bot listens to voice channels and transcribes everything said in real-time.
- Transcriptions are posted to a text channel named `voice-logs`.

### Slash Commands
All commands are implemented as Discord slash commands for ease of use.

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DiscordModerationBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google Cloud Speech-to-Text API (for voice transcription):
   - Enable the API in your Google Cloud project.
   - Download the service account key and set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to its path.

4. Configure the bot:
   - Replace `YOUR_BOT_TOKEN` in `bot.js` with your Discord bot token.

5. Run the bot:
   ```bash
   node bot.js
   ```

## Notes

- Ensure the bot has the necessary permissions in your Discord server:
  - Manage Channels
  - Manage Messages
  - Connect
  - Speak
  - Read Message History
- Create a text channel named `voice-logs` for voice transcription logs.
- Create a text channel named `mod-logs` for moderation and anti-raid incident logs.

## Future Improvements
- Add more customization options for private voice channels.
- Enhance transcription accuracy with additional language support.
- Add more automated moderation actions (auto-mute, auto-ban, etc.).

## License

This project is licensed under the MIT License.
