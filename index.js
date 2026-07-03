'use strict';
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const pino = require('pino');

const config = require('./config');
const logger = require('./lib/logger');
const { loadSession } = require('./lib/sessionLoader');
const { loadCommands, handleMessage } = require('./handler');

async function start() {
    logger.info(chalk.magenta(`[ 🧊 ] Starting ${config.BOT_NAME}...`));

    // Restore creds.json from MEGA if SESSION_ID is set, otherwise fall back to QR login
    await loadSession(config.SESSION_ID, config.SESSION_DIR);

    loadCommands();

    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: [config.BOT_NAME, 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            logger.warn(chalk.yellow(`[ ⚠️ ] Connection closed (code ${statusCode}).`));

            if (shouldReconnect) {
                logger.info(chalk.cyan('[ 🔄 ] Reconnecting...'));
                start();
            } else {
                logger.error(chalk.red('[ ❌ ] Logged out. Delete the session folder and re-authenticate.'));
            }
        } else if (connection === 'open') {
            logger.info(chalk.green(`[ ✅ ] ${config.BOT_NAME} connected successfully!`));
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

        await handleMessage(sock, msg, text);
    });

    return sock;
}

start().catch((e) => {
    logger.error(chalk.red('[ ❌ ] Fatal startup error:'), e.message);
    process.exit(1);
});

