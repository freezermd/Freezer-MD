'use strict';

const CATEGORY_ORDER = [
    'General', 'AI', 'Downloader', 'Music', 'Group',
    'Owner', 'Settings', 'Tools', 'Fun', 'System'
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
    const remaining = Array.from(catMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));
    return sorted.concat(remaining);
}

function buildMainMenu(commandsMap, userJid) {
    const categories = getCategories(commandsMap);
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

function buildCategoryMenu(commandsMap, category) {
    const cmds = getCommandsInCategory(commandsMap, category);
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
    return text;
}

function buildAllCommands(commandsMap) {
    let text = `📋 ALL COMMANDS\n\n`;
    const all = [];
    for (const [name, cmd] of commandsMap) {
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
    return text;
}

module.exports = {
    CATEGORY_ORDER,
    CATEGORY_ICONS,
    getCategories,
    buildMainMenu,
    getCommandsInCategory,
    buildCategoryMenu,
    buildAllCommands
};
