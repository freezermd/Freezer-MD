# 🧊 Freezer-MD

A lightweight multi-device WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys), with session
restore from MEGA using the `NEXUS___` session format.

## Features
- Multi-device WhatsApp connection (no browser needed)
- Session restore from MEGA — no QR scan required on redeploy
- Simple command handler — drop a file in `commands/` and it auto-loads
- Auto-reconnect on connection drops
- Built-in `ping`, `alive`, `menu` commands

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Get a `SESSION_ID`:
   - Leave `SESSION_ID` blank and run the bot once — it will print a QR code to scan.
   - After linking, upload the generated `session/creds.json` to MEGA and build a
     `NEXUS___<key>#<hash>__<fingerprint>` string to reuse on future deploys (avoids re-scanning).

4. Start the bot:
   ```bash
   npm start
   ```

## Adding commands

Create a new file in `commands/`:

```js
module.exports = {
    name: 'hello',
    aliases: ['hi'],
    description: 'Say hello',
    async execute({ sock, from }) {
        await sock.sendMessage(from, { text: 'Hello there!' });
    },
};
```

It's auto-loaded on startup — no registration needed elsewhere.

## Deploying to Render

This repo includes a `Procfile` (`worker: node index.js`). On Render:
1. Create a new **Background Worker**.
2. Set the build command to `npm install`.
3. Add your `.env` values under Environment Variables.
4. Deploy.

## Project structure

```
freezer-md/
├── index.js          # entry point — connects to WhatsApp
├── handler.js         # command loader + dispatcher
├── config.js           # env-based config
├── commands/            # one file per command
├── lib/
│   ├── sessionLoader.js # NEXUS___ MEGA session restore
│   └── logger.js
├── session/              # auth state (gitignored)
├── .env.example
├── Procfile
└── package.json
```
