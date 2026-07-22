'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const menuSession = require('./lib/menuSession');
const menuUtils = require('./lib/menuUtils');
const { commands, loadCommands } = require('./lib/commandManager');
const { getGroupSetting } = require('./utils/db');
const { isAdmin, isBotAdmin } = require('./utils/groupUtils');
const { sendTyping, sendRecording, autoReact, autoRead } = require('./lib/autoFeatures');

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Skip bot's own messages
    if (msg.key.fromMe) return;

    // ── Auto typing & recording (non‑blocking) ──
    const isCommand = text && text.startsWith(config.PREFIX);
    if (!isCommand) {
        sendTyping(sock, from, 600).catch(() => {});
        sendRecording(sock, from, 1000).catch(() => {});
    }

    // ── Interactive menu detection ──
    const session = menuSession.getSession(sender);
    if (session) {
        const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === session.menuMessageKey.id;
        if (isReply) {
            await processMenuInteraction(sock, msg, from, sender, text, session);
            return;
        }
    }

    // ── Group moderation ──
    if (from.endsWith('@g.us')) {
        // Mute check
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

        // Anti‑link
        if (getGroupSetting(from, 'antilink', false)) {
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (/(https?:\/\/[^\s]+)/gi.test(messageText)) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `❌ @${sender.split('@')[0]}, links are not allowed!`,
                    mentions: [sender]
                });
                return;
            }
        }

        // Anti‑badword
        if (getGroupSetting(from, 'antibadword', false)) {
            const badWords = config.BAD_WORDS || ['fuck', 'shit', 'asshole'];
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const lowerText = messageText.toLowerCase();
            if (badWords.some(word => lowerText.includes(word))) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `❌ @${sender.split('@')[0]}, bad words are not allowed!`,
                    mentions: [sender]
                });
                return;
            }
        }

        // Anti‑spam
        if (getGroupSetting(from, 'antispam', false)) {
            if (!global.spamMap) global.spamMap = new Map();
            const key = `${from}_${sender}`;
            const now = Date.now();
            const last = global.spamMap.get(key) || 0;
            if (now - last < 10000) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `⚠️ @${sender.split('@')[0]}, please slow down!`,
                    mentions: [sender]
                });
                return;
            }
            global.spamMap.set(key, now);
            if (global.spamMap.size > 1000) {
                for (const [k, t] of global.spamMap) {
                    if (Date.now() - t > 60000) global.spamMap.delete(k);
                }
            }
        }
    }

    // ── Normal command handling ──
    if (!text || !text.startsWith(config.PREFIX)) {
        // Not a command – auto react & read will happen at the end
    } else {
        const body = text.slice(config.PREFIX.length).trim();
        const [cmdName, ...args] = body.split(/\s+/);
        if (cmdName) {
            const cmd = commands.get(cmdName.toLowerCase());
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
    }

    // ── Auto react & auto read (non‑blocking) ──
    try {
        await autoReact(sock, msg, from);
        await autoRead(sock, msg, from);
    } catch (e) {}
}

// ─── MENU INTERACTION PROCESSOR ────────────────────────────────────────────
async function processMenuInteraction(sock, msg, from, sender, text, session) {
    // ... (keep your existing menu interaction code)
    // If you don't have it, I can provide a full version, but you likely have it.
    // I'll include a minimal stub to avoid breaking.
}

// ─── GROUP EVENT LISTENERS ──────────────────────────────────────────────────
function setupGroupEventListeners(sock) {
    sock.ev.on('groups-participants.update', async (update) => {
        const { id, participants, action } = update;
        if (!participants || participants.length === 0) return;

        if (action === 'add' && getGroupSetting(id, 'welcomeEnabled', false)) {
            const msg = getGroupSetting(id, 'welcomeMessage', 'Welcome @user!');
            for (const user of participants) {
                const text = msg.replace('@user', `@${user.split('@')[0]}`);
                await sock.sendMessage(id, { text, mentions: [user] });
            }
        }

        if (action === 'remove' && getGroupSetting(id, 'goodbyeEnabled', false)) {
            const msg = getGroupSetting(id, 'goodbyeMessage', 'Goodbye @user!');
            for (const user of participants) {
                const text = msg.replace('@user', `@${user.split('@')[0]}`);
                await sock.sendMessage(id, { text, mentions: [user] });
            }
        }

        if (action === 'add') {
            const role = getGroupSetting(id, 'autorole', null);
            if (role === 'admin') {
                const botIsAdmin = await isBotAdmin(sock, id);
                if (botIsAdmin) {
                    for (const user of participants) {
                        try {
                            await sock.groupParticipantsUpdate(id, [user], 'promote');
                        } catch (err) {
                            console.error('Autorole promote error:', err);
                        }
                    }
                }
            }
        }
    });
}

module.exports = {
    handleMessage,
    commands,
    loadCommands,
    setupGroupEventListeners
};
