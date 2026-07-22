'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const { commands, loadCommands } = require('./lib/commandManager');
const { getGroupSetting } = require('./utils/db');
const { isAdmin } = require('./utils/groupUtils');
const { sendTyping, sendRecording, autoReact, autoRead } = require('./lib/autoFeatures');

async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    if (msg.key.fromMe) return;

    // Auto typing & recording (non‑blocking)
    const isCommand = text && text.startsWith(config.PREFIX);
    if (!isCommand) {
        sendTyping(sock, from, 600).catch(() => {});
        sendRecording(sock, from, 1000).catch(() => {});
    }

    // Group moderation (keep your existing checks)
    if (from.endsWith('@g.us')) {
        const mutedList = getGroupSetting(from, 'muted', []);
        if (mutedList.includes(sender)) {
            const isSenderAdmin = await isAdmin(sock, from, sender);
            if (!isSenderAdmin) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `🔇 @${sender.split('@')[0]}, you are muted.`,
                    mentions: [sender]
                });
                return;
            }
        }
        // ... antilink, antibadword, antispam (copy from previous)
    }

    // Command handling
    if (text && text.startsWith(config.PREFIX)) {
        const body = text.slice(config.PREFIX.length).trim();
        const [cmdName, ...args] = body.split(/\s+/);
        const cmd = commands.get(cmdName?.toLowerCase());
        if (cmd) {
            try {
                if (cmd.ownerOnly && !isOwner(sender)) {
                    await sock.sendMessage(from, { text: '⛔ Owner only command.' });
                } else {
                    await cmd.execute({ sock, msg, args, from, config });
                }
            } catch (e) {
                console.error(`Command "${cmdName}" failed:`, e.message);
                await sock.sendMessage(from, { text: `⚠️ Something went wrong.` });
            }
        }
    }

    // Auto react & read
    try {
        await autoReact(sock, msg, from);
        await autoRead(sock, msg, from);
    } catch (e) {}
}

// Group event listeners (welcome, goodbye, autorole) – keep as before
function setupGroupEventListeners(sock) {
    // ... your existing implementation
}

module.exports = {
    handleMessage,
    commands,
    loadCommands,
    setupGroupEventListeners
};
