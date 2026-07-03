'use strict';
const fs = require('fs');
const path = require('path');
const logger = require('./lib/logger');
const config = require('./config');

const commands = new Map();

function loadCommands() {
    const dir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
        try {
            const cmd = require(path.join(dir, file));
            if (!cmd.name || typeof cmd.execute !== 'function') {
                logger.warn(`[ ⚠️ ] Skipping ${file} — missing "name" or "execute"`);
                continue;
            }
            commands.set(cmd.name.toLowerCase(), cmd);
            (cmd.aliases || []).forEach((alias) => commands.set(alias.toLowerCase(), cmd));
        } catch (e) {
            logger.error(`[ ❌ ] Failed to load command ${file}:`, e.message);
        }
    }

    logger.info(`[ ✅ ] Loaded ${commands.size} command(s)`);
    return commands;
}

async function handleMessage(sock, msg, text) {
    if (!text || !text.startsWith(config.PREFIX)) return;

    const body = text.slice(config.PREFIX.length).trim();
    const [cmdName, ...args] = body.split(/\s+/);
    if (!cmdName) return;

    const cmd = commands.get(cmdName.toLowerCase());
    if (!cmd) return;

    const from = msg.key.remoteJid;
    try {
        await cmd.execute({ sock, msg, args, from, config });
    } catch (e) {
        logger.error(`[ ❌ ] Command "${cmdName}" failed:`, e.message);
        await sock.sendMessage(from, { text: `⚠️ Something went wrong running *${cmdName}*.` });
    }
}

module.exports = { loadCommands, handleMessage, commands };
