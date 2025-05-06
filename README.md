# Moderation Discord Bot

A Discord bot designed to help with server moderation tasks such as banning, kicking, and timing out users using slash commands.

## Features

- **/ban**: Ban a user from the server.
- **/remove-ban**: Remove a ban from a user by their ID.
- **/timeout**: Temporarily timeout a user for a specified duration.
- **/remove-timeout**: Remove a timeout from a user.
- **/kick**: Kick a user from the server.

## Prerequisites

- Node.js installed on your system.
- A Discord bot token.
- The bot must have the following permissions in your server:
  - `BAN_MEMBERS`
  - `KICK_MEMBERS`
  - `MODERATE_MEMBERS`

## Setup

1. Clone this repository or download the files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Replace `YOUR_BOT_TOKEN` in `bot.js` with your Discord bot token.
4. Run the bot:
   ```bash
   node bot.js
   ```

## Usage

1. Invite the bot to your server with the appropriate permissions.
2. Use the slash commands in your server:
   - `/ban @user`
   - `/remove-ban user_id`
   - `/timeout @user duration_in_seconds`
   - `/remove-timeout @user`
   - `/kick @user`

## Troubleshooting

- **Missing Permissions Error**: Ensure the bot has the required permissions and its role is higher than the target user's role.
- **Commands Not Working**: Ensure the bot is online and slash commands are registered in your server.

## License

This project is licensed under the MIT License.
