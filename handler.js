'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const menuSession = require('./lib/menuSession');
const menuUtils = require('./lib/menuUtils');
const { commands, loadCommands } = require('./lib/commandManager');
const autoFeatures = require('./lib/autoFeatures');

// ─── GROUP MANAGEMENT DEPENDENCIES ──────────────────────────────────────────
const { getGroupSetting, getWarnings } = require('./utils/db');
const { isAdmin, isBotAdmin } = require('./utils/groupUtils');

// ─── AUTO FEATURES ──────────────────────────────────────────────────────────
const { sendTyping, sendRecording, autoReact, autoRead } = require('./lib/autoFeatures');

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // Skip if message is from the bot itself
    if (msg.key.fromMe) return;

    // ── 0. AUTO TYPING & RECORDING (non-blocking) ──
    const isCommand = text && text.startsWith(config.PREFIX);
    if (!isCommand) {
        // Fire and forget (don't await)
        sendTyping(sock, from, 600).catch(() => {});
        sendRecording(sock, from, 1000).catch(() => {});
    }

    // ---------- 1. INTERACTIVE MENU REPLY DETECTION ----------
    const session = menuSession.getSession(sender);
    if (session) {
        const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === session.menuMessageKey.id;
        if (isReply) {
            await processMenuInteraction(sock, msg, from, sender, text, session);
            // After menu interaction, auto-react/read? We'll do it after all logic.
            // But we can skip because menu interaction is a command reply.
            // We'll call auto features at the end anyway.
            // But to avoid double processing, we'll just return.
            // However, we still want auto features for these messages? Maybe not.
            // We'll skip auto features for menu interactions to avoid noise.
            // But we'll still call them after this block? Better to not call.
            // We'll add a flag to skip.
            return;
        }
    }

    // ---------- 2. GROUP MODERATION CHECKS (only for groups) ----------
    if (from.endsWith('@g.us')) {
        // ── Mute check ──
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

        // ── Anti‑link ──
        if (getGroupSetting(from, 'antilink', false)) {
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (/(https?:\/\/[^\s]+)/gi.test(messageText)) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `❌ @${sender.split('@')[0]}, links are not allowed in this group!`,
                    mentions: [sender]
                });
                return;
            }
        }

        // ── Anti‑badword ──
        if (getGroupSetting(from, 'antibadword', false)) {
            const badWords = config.BAD_WORDS || ['fuck', 'shit', 'asshole'];
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const lowerText = messageText.toLowerCase();
            if (badWords.some(word => lowerText.includes(word))) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `❌ @${sender.split('@')[0]}, inappropriate words are not allowed!`,
                    mentions: [sender]
                });
                return;
            }
        }

        // ── Anti‑spam ──
        if (getGroupSetting(from, 'antispam', false)) {
            if (!global.spamMap) global.spamMap = new Map();
            const key = `${from}_${sender}`;
            const now = Date.now();
            const last = global.spamMap.get(key) || 0;
            if (now - last < 10000) {
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `⚠️ @${sender.split('@')[0]}, please slow down! (anti‑spam)`,
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

    // ---------- 3. NORMAL COMMAND HANDLING ----------
    if (!text || !text.startsWith(config.PREFIX)) {
        // Not a command, but we still want auto features (already done)
        // Skip command processing.
        // After this, we'll call autoReact and autoRead at the end.
        // However, we need to ensure we don't react to non-command messages if autoreact is on.
        // We'll handle at the end.
        // We'll just skip to the end.
    } else {
        const body = text.slice(config.PREFIX.length).trim();
        const [cmdName, ...args] = body.split(/\s+/);
        if (cmdName) {
            const cmd = commands.get(cmdName.toLowerCase());
            if (cmd) {
                try {
                    if (cmd.ownerOnly && !isOwner(sender)) {
                        await sock.sendMessage(from, {
                            text: '⛔ This command is for the bot owner only.'
                        });
                        // Still auto features? skip to end.
                    } else {
                        // Auto features already triggered for typing/recording.
                        await cmd.execute({
                            sock,
                            msg,
                            args,
                            from,
                            config
                        });
                    }
                } catch (e) {
                    console.error(`[ ❌ ] Command "${cmdName}" failed:`, e.message);
                    await sock.sendMessage(from, {
                        text: `⚠️ Something went wrong running *${cmdName}*.`
                    });
                }
            }
        }
    }

    // ---------- 4. AUTO REACT & AUTO READ (non-blocking) ----------
    // Only do for non-command messages? Or all? We'll do for all to keep simple.
    // But we want to avoid reacting to our own messages (already skipped).
    try {
        await autoReact(sock, msg, from);
        await autoRead(sock, msg, from);
    } catch (e) {
        // Silently fail
    }
}

// ─── MENU INTERACTION PROCESSOR (unchanged) ──────────────────────────────
// ... (copy your existing menu interaction functions from previous code)

// ─── COMMAND EXECUTOR (unchanged) ──────────────────────────────────────────

// ─── GROUP EVENT LISTENERS (unchanged) ────────────────────────────────────

// ─── EXPORTS ──────────────────────────────────────────────────────────────
module.exports = {
    handleMessage,
    commands,
    loadCommands,
    setupGroupEventListeners
};
