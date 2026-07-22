'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const { commands, loadCommands } = require('./lib/commandManager');
const { getGroupSetting } = require('./utils/db');
const { isAdmin } = require('./utils/groupUtils');
const {
    sendTyping,
    sendRecording,
    autoReact,
    autoRead
} = require('./lib/autoFeatures');

async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    if (msg.key.fromMe) return;
    if (!text) return;

    // ==========================
    // Auto Typing & Recording
    // ==========================
    const isCommand = text.startsWith(config.PREFIX);

    if (!isCommand) {
        sendTyping(sock, from, 600).catch(() => {});
        sendRecording(sock, from, 1000).catch(() => {});
    }

    // ==========================
    // Group Moderation
    // ==========================
    if (from.endsWith('@g.us')) {
        const mutedList = getGroupSetting(from, 'muted', []);

        if (mutedList.includes(sender)) {
            const isSenderAdmin = await isAdmin(sock, from, sender);

            if (!isSenderAdmin) {
                await sock.sendMessage(from, {
                    delete: msg.key
                });

                await sock.sendMessage(from, {
                    text: `🔇 @${sender.split('@')[0]}, you are muted.`,
                    mentions: [sender]
                });

                return;
            }
        }

        // Keep your existing:
        // Anti-Link
        // Anti-BadWord
        // Anti-Spam
        // Anti-Bot
        // Welcome/Goodbye
    }

    // ==========================
    // Command Handling
    // ==========================
    if (isCommand) {
        const body = text.slice(config.PREFIX.length).trim();

        if (!body) return;

        const args = body.split(/\s+/);
        const cmdName = args.shift().toLowerCase();

        const cmd = commands.get(cmdName);

        if (!cmd) {
            return await sock.sendMessage(from, {
                text: `❌ Unknown command.\nType *${config.PREFIX}menu* to view all commands.`
            });
        }

        try {
            if (cmd.ownerOnly && !isOwner(sender)) {
                return await sock.sendMessage(from, {
                    text: '⛔ Owner only command.'
                });
            }

            await cmd.execute({
                sock,
                msg,
                args,
                from,
                sender,
                config
            });

        } catch (err) {
            console.error(`❌ Command "${cmdName}" failed:`);
            console.error(err);

            await sock.sendMessage(from, {
                text: '⚠️ An error occurred while executing that command.'
            });
        }
    }

    // ==========================
    // Auto Features
    // ==========================
    try {
        await autoReact(sock, msg, from);
        await autoRead(sock, msg, from);
    } catch (err) {
        // Ignore auto-feature errors
    }
}

// ==========================
// Group Event Listeners
// ==========================
function setupGroupEventListeners(sock) {
    // Keep your existing implementation
}

module.exports = {
    handleMessage,
    commands,
    loadCommands,
    setupGroupEventListeners
};
