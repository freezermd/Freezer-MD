// handler.js
'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const menuSession = require('./lib/menuSession');
const menuUtils = require('./lib/menuUtils');
const { commands, loadCommands } = require('./lib/commandManager');
const autoFeatures = require('./lib/autofeatures');

// ─── GROUP MANAGEMENT DEPENDENCIES ──────────────────────────────────────────
const { getGroupSetting, getWarnings } = require('./utils/db');
const { isAdmin, isBotAdmin } = require('./utils/groupUtils');

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // ---------- 1. INTERACTIVE MENU REPLY DETECTION ----------
    const session = menuSession.getSession(sender);
    if (session) {
        const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === session.menuMessageKey.id;
        if (isReply) {
            await processMenuInteraction(sock, msg, from, sender, text, session);
            return; // consume message, do NOT process as normal command
        }
    }

    // ---------- 2. GROUP MODERATION CHECKS (only for groups) ----------
    if (from.endsWith('@g.us')) {
        // ── Mute check ──
        const mutedList = getGroupSetting(from, 'muted', []);
        if (mutedList.includes(sender)) {
            // Only admins can bypass mute
            const isSenderAdmin = await isAdmin(sock, from, sender);
            if (!isSenderAdmin) {
                // Delete the message and notify
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `🔇 @${sender.split('@')[0]}, you are muted.`,
                    mentions: [sender]
                });
                return; // Stop processing
            }
        }

        // ── Anti‑link ──
        if (getGroupSetting(from, 'antilink', false)) {
            const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (/(https?:\/\/[^\s]+)/gi.test(messageText)) {
                // Delete the message
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `❌ @${sender.split('@')[0]}, links are not allowed in this group!`,
                    mentions: [sender]
                });
                return; // Stop processing
            }
        }

        // ── Anti‑badword ──
        if (getGroupSetting(from, 'antibadword', false)) {
            const badWords = config.BAD_WORDS || ['fuck', 'shit', 'asshole']; // load from config
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

        // ── Anti‑spam (simple rate limit per user per 10 seconds) ──
        if (getGroupSetting(from, 'antispam', false)) {
            // Use in-memory store or reuse a global map
            if (!global.spamMap) global.spamMap = new Map();
            const key = `${from}_${sender}`;
            const now = Date.now();
            const last = global.spamMap.get(key) || 0;
            if (now - last < 10000) { // 10 seconds
                // Delete spam message and warn
                await sock.sendMessage(from, { delete: msg.key });
                await sock.sendMessage(from, {
                    text: `⚠️ @${sender.split('@')[0]}, please slow down! (anti‑spam)`,
                    mentions: [sender]
                });
                return;
            }
            global.spamMap.set(key, now);
            // Clean up old entries periodically
            if (global.spamMap.size > 1000) {
                for (const [k, t] of global.spamMap) {
                    if (Date.now() - t > 60000) global.spamMap.delete(k);
                }
            }
        }
    }

    // ---------- 3. NORMAL COMMAND HANDLING ----------
    if (!text || !text.startsWith(config.PREFIX)) return;

    const body = text.slice(config.PREFIX.length).trim();
    const [cmdName, ...args] = body.split(/\s+/);
    if (!cmdName) return;

    const cmd = commands.get(cmdName.toLowerCase());
    if (!cmd) return;

    // ---------- 4. EXECUTE COMMAND (with error handling) ----------
    try {
        if (cmd.ownerOnly && !isOwner(sender)) {
            return await sock.sendMessage(from, {
                text: '⛔ This command is for the bot owner only.'
            });
        }

        // ───── AUTO FEATURES ─────
        if (autoFeatures.autoTyping) {
            await sock.sendPresenceUpdate('composing', from);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        if (autoFeatures.autoRecording) {
            await sock.sendPresenceUpdate('recording', from);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await cmd.execute({
            sock,
            msg,
            args,
            from,
            config
        });

    } catch (e) {
        console.error(`[ ❌ ] Command "${cmdName}" failed:`, e.message);
        await sock.sendMessage(from, {
            text: `⚠️ Something went wrong running *${cmdName}*.`
        });
    }
}

// ─── MENU INTERACTION PROCESSOR ────────────────────────────────────────────

async function processMenuInteraction(sock, msg, from, sender, text, session) {
    menuSession.updateSession(sender);

    const state = session.state;

    if (state === 'MAIN_MENU') {
        await handleMainMenuReply(sock, from, sender, text, session);
    } else if (state === 'CATEGORY_MENU') {
        await handleCategoryMenuReply(sock, from, sender, text, session);
    } else if (state === 'WAITING_ARGS') {
        await handleWaitingArgsReply(sock, from, sender, text, session);
    } else {
        menuSession.deleteSession(sender);
        await sock.sendMessage(from, { text: '❌ Session expired. Type .menu to start again.' });
    }
}

async function handleMainMenuReply(sock, from, sender, text, session) {
    const choice = parseInt(text);
    if (isNaN(choice)) {
        await sock.sendMessage(from, { text: '❌ Please reply with a number.' });
        return;
    }

    const categories = menuUtils.getCategories(commands);
    const categoryList = categories.filter(cat => cat.commands > 0);

    if (choice === 0) {
        const allText = menuUtils.buildAllCommands(commands);
        await sock.sendMessage(from, { text: allText });
        menuSession.setState(sender, 'MAIN_MENU');
        return;
    }

    if (choice < 1 || choice > categoryList.length) {
        await sock.sendMessage(from, { text: '❌ Invalid option. Reply with a number from the menu.' });
        return;
    }

    const selectedCategory = categoryList[choice - 1].name;
    session.selectedCategory = selectedCategory;
    const catMenuText = menuUtils.buildCategoryMenu(commands, selectedCategory);
    await sock.sendMessage(from, { text: catMenuText });
    menuSession.setState(sender, 'CATEGORY_MENU', { selectedCategory });
}

async function handleCategoryMenuReply(sock, from, sender, text, session) {
    const choice = parseInt(text);
    if (isNaN(choice)) {
        await sock.sendMessage(from, { text: '❌ Please reply with a number.' });
        return;
    }

    const category = session.selectedCategory;
    const cmds = menuUtils.getCommandsInCategory(commands, category);

    if (choice === 0) {
        const mainText = menuUtils.buildMainMenu(commands, sender);
        await sock.sendMessage(from, { text: mainText });
        menuSession.setState(sender, 'MAIN_MENU');
        return;
    }

    if (choice < 1 || choice > cmds.length) {
        await sock.sendMessage(from, { text: '❌ Invalid command number.' });
        return;
    }

    const selectedCmd = cmds[choice - 1];
    const cmdName = selectedCmd.name;

    const needsArgs = selectedCmd.needsArgs !== undefined ? selectedCmd.needsArgs : true;

    if (!needsArgs) {
        await executeCommand(sock, from, cmdName, [], msg);
        menuSession.deleteSession(sender);
        return;
    }

    session.selectedCommand = cmdName;
    menuSession.setState(sender, 'WAITING_ARGS', { selectedCommand: cmdName });
    await sock.sendMessage(from, {
        text: `📝 Please send the required arguments for: *${cmdName}*\n(Reply with details or type *0* to cancel)`
    });
}

async function handleWaitingArgsReply(sock, from, sender, text, session) {
    const cmdName = session.selectedCommand;
    if (!cmdName) {
        menuSession.deleteSession(sender);
        await sock.sendMessage(from, { text: '❌ Session error. Type .menu to start again.' });
        return;
    }

    if (text === '0' || text.toLowerCase() === 'cancel') {
        menuSession.deleteSession(sender);
        await sock.sendMessage(from, { text: '✅ Cancelled. Type .menu to start again.' });
        return;
    }

    const args = text.trim().split(/\s+/);
    await executeCommand(sock, from, cmdName, args, msg);
    menuSession.deleteSession(sender);
}

// ─── COMMAND EXECUTOR ──────────────────────────────────────────────────────

async function executeCommand(sock, from, cmdName, args, originalMsg) {

    let cmd = commands.get(cmdName);

    if (!cmd) {
        for (const [, c] of commands) {
            if (c.name === cmdName) {
                cmd = c;
                break;
            }
        }
    }

    if (!cmd) {
        return await sock.sendMessage(from, {
            text: `❌ Command "${cmdName}" not found.`
        });
    }

    try {
        // Auto Typing
        if (autoFeatures.autoTyping) {
            await sock.sendPresenceUpdate('composing', from);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Auto Recording
        if (autoFeatures.autoRecording) {
            await sock.sendPresenceUpdate('recording', from);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await cmd.execute({
            sock,
            msg: originalMsg,
            args,
            from,
            config
        });

    } catch (err) {
        console.error(`[ ❌ ] Error executing ${cmdName}:`, err);
        await sock.sendMessage(from, {
            text: `❌ Failed to execute *${cmdName}*.`
        });
    }
}

// ─── GROUP EVENT LISTENERS (welcome, goodbye, antibot, autorole) ──────────

/**
 * Call this function once after the socket is ready to enable group event handling.
 * It listens for group participant updates and applies welcome, goodbye, antibot, and autorole.
 */
function setupGroupEventListeners(sock) {
    sock.ev.on('groups-participants.update', async (update) => {
        const { id, participants, action } = update;

        // Only process if there are participants
        if (!participants || participants.length === 0) return;

        // ── Welcome message ──
        if (action === 'add' && getGroupSetting(id, 'welcomeEnabled', false)) {
            const welcomeMsg = getGroupSetting(id, 'welcomeMessage', 'Welcome @user to the group!');
            for (const user of participants) {
                const text = welcomeMsg.replace('@user', `@${user.split('@')[0]}`);
                await sock.sendMessage(id, { text, mentions: [user] });
            }
        }

        // ── Goodbye message ──
        if (action === 'remove' && getGroupSetting(id, 'goodbyeEnabled', false)) {
            const goodbyeMsg = getGroupSetting(id, 'goodbyeMessage', 'Goodbye @user, we\'ll miss you!');
            for (const user of participants) {
                const text = goodbyeMsg.replace('@user', `@${user.split('@')[0]}`);
                await sock.sendMessage(id, { text, mentions: [user] });
            }
        }

        // ── Autorole (promote new members to admin) ──
        if (action === 'add') {
            const role = getGroupSetting(id, 'autorole', null);
            if (role === 'admin') {
                const botIsAdmin = await isBotAdmin(sock, id);
                if (botIsAdmin) {
                    for (const user of participants) {
                        try {
                            await sock.groupParticipantsUpdate(id, [user], 'promote');
                        } catch (err) {
                            console.error(`Failed to autorole promote ${user}:`, err);
                        }
                    }
                }
            }
        }

        // ── Antibot (kick if participant is a bot) ──
        if (action === 'add' && getGroupSetting(id, 'antibot', false)) {
            const botIsAdmin = await isBotAdmin(sock, id);
            if (botIsAdmin) {
                // You may want to maintain a list of known bots or detect by name.
                // For demonstration, we skip actual detection; you can implement logic here.
                // Example: if (user.includes('bot') || user.startsWith('+')) ...
                // We'll just skip for now, as detection is non-trivial.
                // Placeholder: kick if user's name contains "bot" (optional)
                // We recommend using a separate command to manage bot list.
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
