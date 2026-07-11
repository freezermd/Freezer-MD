'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./lib/logger');
const config = require('./config');
const { isOwner } = require('./lib/owner');
const menuSession = require('./lib/menuSession');
const menuCommand = require('./commands/menu'); // load menu command for helpers

// Destructure helpers from the menu command
const { getCategories, CATEGORY_ICONS, buildMainMenu } = menuCommand._helpers;

const commands = new Map();

// ─── LOAD COMMANDS ──────────────────────────────────────────────────────────
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

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
async function handleMessage(sock, msg, text) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    // ---------- 1. INTERACTIVE MENU REPLY DETECTION ----------
    const session = menuSession.getSession(sender);
    if (session) {
        // Check if this message is a reply to the menu message key
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
        logger.error(`[ ❌ ] Command "${cmdName}" failed:`, e.message);
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

    const categories = getCategories(commands);
    const categoryList = categories.filter(cat => cat.commands > 0);

    if (choice === 0) {
        await showAllCommands(sock, from);
        menuSession.setState(sender, 'MAIN_MENU');
        return;
    }

    if (choice < 1 || choice > categoryList.length) {
        await sock.sendMessage(from, { text: '❌ Invalid option. Reply with a number from the menu.' });
        return;
    }

    const selectedCategory = categoryList[choice - 1].name;
    session.selectedCategory = selectedCategory;
    await showCategoryMenu(sock, from, selectedCategory);
    menuSession.setState(sender, 'CATEGORY_MENU', { selectedCategory });
}

async function handleCategoryMenuReply(sock, from, sender, text, session) {
    const choice = parseInt(text);
    if (isNaN(choice)) {
        await sock.sendMessage(from, { text: '❌ Please reply with a number.' });
        return;
    }

    const category = session.selectedCategory;
    const cmds = getCommandsInCategory(commands, category);

    if (choice === 0) {
        // Go back to main menu
        const mainMenuText = buildMainMenu(sender);
        await sock.sendMessage(from, { text: mainMenuText });
        menuSession.setState(sender, 'MAIN_MENU');
        return;
    }

    if (choice < 1 || choice > cmds.length) {
        await sock.sendMessage(from, { text: '❌ Invalid command number.' });
        return;
    }

    const selectedCmd = cmds[choice - 1];
    const cmdName = selectedCmd.name;

    // Check if command requires arguments (default: true)
    const needsArgs = selectedCmd.needsArgs !== undefined ? selectedCmd.needsArgs : true;

    if (!needsArgs) {
        await executeCommand(sock, from, cmdName, [], msg);
        menuSession.deleteSession(sender);
        return;
    }

    // Store command and ask for arguments
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

// ─── MENU HELPERS ──────────────────────────────────────────────────────────

function getCommandsInCategory(commandsMap, category) {
    const cmds = [];
    for (const [name, cmd] of commandsMap) {
        if ((cmd.category || 'General') === category) {
            cmds.push({ name, ...cmd });
        }
    }
    cmds.sort((a, b) => a.name.localeCompare(b.name));
    return cmds;
}

async function showCategoryMenu(sock, from, category) {
    const cmds = getCommandsInCategory(commands, category);
    const icon = CATEGORY_ICONS[category] || '📌';
    let text = `╭━━ ${icon} ${category.toUpperCase()} MENU ━━╮\n`;
    let index = 1;
    for (const cmd of cmds) {
        text += `${index}. ${cmd.name}\n`;
        index++;
    }
    text += `0. Back to Main Menu\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n`;
    text += `Reply with the command number.`;
    await sock.sendMessage(from, { text });
}

async function showAllCommands(sock, from) {
    let text = `📋 ALL COMMANDS\n\n`;
    const all = [];
    for (const [name, cmd] of commands) {
        all.push({ name, category: cmd.category || 'General' });
    }
    all.sort((a, b) => a.name.localeCompare(b.name));
    let currentCat = '';
    for (const cmd of all) {
        if (cmd.category !== currentCat) {
            currentCat = cmd.category;
            const icon = CATEGORY_ICONS[currentCat] || '📌';
            text += `\n${icon} ${currentCat}:\n`;
        }
        text += `  • ${cmd.name}\n`;
    }
    text += `\nType .menu to return.`;
    await sock.sendMessage(from, { text });
}

async function executeCommand(sock, from, cmdName, args, originalMsg) {
    let cmd = commands.get(cmdName);
    if (!cmd) {
        // fallback: search by name (already name)
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
        logger.error(`Error executing menu command ${cmdName}:`, err);
        await sock.sendMessage(from, { text: `❌ Failed to execute ${cmdName}.` });
    }
}

module.exports = { loadCommands, handleMessage, commands };
