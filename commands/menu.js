'use strict';

const { commands } = require('../handler'); // already loaded
const menuSession = require('../lib/menuSession');

// ─── CATEGORY CONFIGURATION ────────────────────────────────────────────────
const CATEGORY_ORDER = [
    'General',
    'AI',
    'Downloader',
    'Music',
    'Group',
    'Owner',
    'Settings',
    'Tools',
    'Fun',
    'System'
];

const CATEGORY_ICONS = {
    'General': '📁',
    'AI': '🤖',
    'Downloader': '📥',
    'Music': '🎵',
    'Group': '👥',
    'Owner': '👑',
    'Settings': '⚙️',
    'Tools': '🛠️',
    'Fun': '🎮',
    'System': '📊'
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getCategories(commandsMap) {
    const catMap = new Map();
    for (const [, cmd] of commandsMap) {
        const cat = cmd.category || 'General';
        if (!catMap.has(cat)) {
            catMap.set(cat, { name: cat, commands: 0 });
        }
        catMap.get(cat).commands++;
    }

    const sorted = [];
    for (const orderCat of CATEGORY_ORDER) {
        if (catMap.has(orderCat)) {
            sorted.push(catMap.get(orderCat));
            catMap.delete(orderCat);
        }
    }
    const remaining = Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return sorted.concat(remaining);
}

function buildMainMenu(userJid) {
    const categories = getCategories(commands);
    const categoryList = categories.filter(cat => cat.commands > 0);

    let text = `╭━━━━━━━━━━━━━━━━━━━━━━╮\n`;
    text += `❄️ FREEZER-MD\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    text += `Hello @${userJid.split('@')[0]}\n\n`;
    text += `Reply with the number.\n\n`;

    let index = 1;
    for (const cat of categoryList) {
        const icon = CATEGORY_ICONS[cat.name] || '📌';
        text += `${index}. ${icon} ${cat.name}\n`;
        index++;
    }
    text += `0. All Commands\n\n`;
    text += `⚡ Powered by FREEZER CARTEL`;
    return text;
}

// ─── MENU COMMAND ──────────────────────────────────────────────────────────

module.exports = {
    name: 'menu',
    aliases: ['help'],
    category: 'System',
    description: 'Interactive menu system',
    async execute({ sock, msg, args, from, config }) {
        const userJid = msg.key.participant || from;
        menuSession.deleteSession(userJid); // fresh start

        const menuText = buildMainMenu(userJid);
        const sentMsg = await sock.sendMessage(from, { text: menuText });

        // Create session with the message key for reply detection
        menuSession.createSession(userJid, sentMsg.key);
    },
    // Expose helpers for handler.js
    _helpers: {
        getCategories,
        CATEGORY_ICONS,
        CATEGORY_ORDER,
        buildMainMenu
    }
};
