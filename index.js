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
const { loadCommands, handleMessage, setupGroupEventListeners } = require('./handler');
const autoFeatures = require('./lib/autoFeatures');

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

    // Enable group event listeners (welcome, goodbye, autorole, antibot)
    setupGroupEventListeners(sock);

    // ─── Auto Status View ──────────────────────────────────────────────
    // Handle status updates separately
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg?.message) return;

        // If it's a status broadcast
        if (msg.key.remoteJid === 'status@broadcast') {
            // Auto view status if enabled
            if (autoFeatures.getGlobalFeature('autostatusview')) {
                try {
                    await sock.readMessages([msg.key]);
                } catch (e) {
                    // Silently fail
                }
            }
            return; // Do not process as normal message
        }

        // Normal message handling
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

        await handleMessage(sock, msg, text);
    });

    // ─── Auto Bio (update every 5 minutes) ──────────────────────────────
    setInterval(async () => {
        if (autoFeatures.getGlobalFeature('autobio')) {
            const bio = autoFeatures.getGlobalFeature('autobioText') || '🤖 Freezer-MD bot';
            try {
                await sock.updateProfileStatus(bio);
            } catch (e) {
                // Silently fail
            }
        }
    }, 5 * 60 * 1000);

    // ─── Always Online (refresh presence every 30 seconds) ──────────────
    setInterval(async () => {
        if (autoFeatures.getGlobalFeature('alwaysonline')) {
            try {
                await sock.sendPresenceUpdate('available');
            } catch (e) {
                // Silently fail
            }
        }
    }, 30 * 1000);

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

            // Set presence to available on connect if alwaysonline is enabled
            if (autoFeatures.getGlobalFeature('alwaysonline')) {
                sock.sendPresenceUpdate('available').catch(() => {});
            }
        }
    });

    return sock;
}

start().catch((e) => {
    logger.error(chalk.red('[ ❌ ] Fatal startup error:'), e.message);
    process.exit(1);
});
