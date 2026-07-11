// handler.js
'use strict';

const config = require('./config');
const { isOwner } = require('./lib/owner');
const menuSession = require('./lib/menuSession');
const menuUtils = require('./lib/menuUtils');
const { commands, loadCommands } = require('./lib/commandManager');

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

    // ---------- 2. NORMAL COMMAND HANDLING ----------
    if (!text || !text.startsWith(config.PREFIX)) return;

    const body = text.slice(config.PREFIX.length).trim();
    const [cmdName, ...args] = body.split(/\s+/);
    if (!cmdName) return;

    const cmd = commands.get(cmdName.toLowerCase());
    if (!cmd) return;

    try {
        if (cmd.ownerOnly && !isOwner(sender)) {
            return await sock.sendMessage(from, {
                text: '⛔ This command is for the bot owner only.'
            });
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
        await sock.sendMessage(from, { text: `❌ Command "${cmdName}" not found.` });
        return;
    }

    try {
        await cmd.execute({
            sock,
            msg: originalMsg,
            args,
            from,
            config
        });
    } catch (err) {
        console.error(`Error executing menu command ${cmdName}:`, err);
        await sock.sendMessage(from, { text: `❌ Failed to execute ${cmdName}.` });
    }
}

module.exports = { handleMessage, commands, loadCommands };
