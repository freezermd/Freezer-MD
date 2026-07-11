```javascript
// commands/menu.js
const { commands } = require('../handler');

module.exports = {
    name: 'menu',
    aliases: ['help', 'cmds'],
    category: 'general',
    description: 'Show the main menu or a specific submenu',
    usage: '.menu [submenu]',
    async execute({ sock, msg, args, from, config }) {
        const start = Date.now();
        try {
            const prefix = config.PREFIX || '.';
            const botName = config.BOT_NAME || 'Freezer-MD';
            const version = config.VERSION || '1.0.0';
            const ownerName = config.OWNER_NAME || 'Freezer';
            const startTime = config.START_TIME || Date.now();

            // Get the requested submenu (lowercase)
            const sub = args[0] ? args[0].toLowerCase() : 'main';

            // Build the menu
            let menuText = '';

            if (sub === 'main') {
                menuText = buildMainMenu({
                    botName,
                    version,
                    ownerName,
                    prefix,
                    startTime,
                    start
                });
            } else {
                // Check if submenu exists (has commands with that category)
                const categoryExists = Array.from(commands.values()).some(cmd => 
                    (cmd.category || '').toLowerCase() === sub
                );

                if (categoryExists) {
                    menuText = buildSubMenu(sub, prefix);
                } else {
                    menuText = buildErrorMenu(sub, prefix);
                }
            }

            // Measure ping (time taken to generate menu)
            const ping = Date.now() - start;
            // Replace placeholder {ping} if present, or we can add ping info to main menu already
            // We'll inject ping into main menu during build, but for submenus we don't display ping.
            // So we can just send the menu as is.

            await sock.sendMessage(from, { text: menuText });
        } catch (error) {
            console.error('Menu command error:', error);
            await sock.sendMessage(from, { 
                text: '❌ An error occurred while generating the menu. Please try again later.' 
            });
        }
    }
};

/**
 * Build the main menu with system info and submenu list
 */
function buildMainMenu({ botName, version, ownerName, prefix, startTime, start }) {
    const uptime = getUptime(startTime);
    const ram = getRAMUsage();
    const ping = `${Date.now() - start}ms`;
    const dateTime = getCurrentDateTime();
    const totalCommands = commands.size;

    // Gather all unique categories from commands
    const categorySet = new Set();
    for (const cmd of commands.values()) {
        if (cmd.category) {
            categorySet.add(cmd.category.toLowerCase());
        }
    }
    // Sort categories alphabetically
    const categories = Array.from(categorySet).sort();

    // Emoji mapping for known categories
    const emojiMap = {
        ai: '🤖',
        tools: '🛠',
        downloader: '📥',
        music: '🎵',
        news: '📰',
        fun: '🎮',
        group: '👥',
        owner: '👑',
        settings: '⚙',
        premium: '🚀',
        bug: '🐞',
        system: '📊'
    };

    // Build menu
    let menu = `╔══════════════════════════════════════╗\n`;
    menu += `║  🧊 ${botName.padEnd(34)}║\n`;
    menu += `╠══════════════════════════════════════╣\n`;
    menu += `║  👤 Owner    : ${ownerName.padEnd(24)}║\n`;
    menu += `║  🤖 Bot Name : ${botName.padEnd(24)}║\n`;
    menu += `║  📌 Version  : ${version.padEnd(24)}║\n`;
    menu += `║  📶 Ping     : ${ping.padEnd(24)}║\n`;
    menu += `║  ⏱ Runtime   : ${uptime.padEnd(24)}║\n`;
    menu += `║  💾 RAM      : ${ram.padEnd(24)}║\n`;
    menu += `║  📦 Commands : ${totalCommands.toString().padEnd(24)}║\n`;
    menu += `║  📅 Date     : ${dateTime.date.padEnd(24)}║\n`;
    menu += `║  ⌚ Time     : ${dateTime.time.padEnd(24)}║\n`;
    menu += `╠══════════════════════════════════════╣\n`;

    // Submenu list (only categories with commands)
    if (categories.length === 0) {
        menu += `║  No submenus available               ║\n`;
    } else {
        for (const cat of categories) {
            const emoji = emojiMap[cat] || '📁';
            menu += `║  ${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1).padEnd(30)}║\n`;
        }
    }

    menu += `╠══════════════════════════════════════╣\n`;
    menu += `║  💡 Type: ${prefix}menu <submenu>       ║\n`;
    menu += `║  📋 Example: ${prefix}menu ai            ║\n`;
    menu += `╚══════════════════════════════════════╝`;

    return menu;
}

/**
 * Build a specific submenu showing commands in that category
 */
function buildSubMenu(category, prefix) {
    // Collect commands with matching category (case-insensitive)
    const cmdList = [];
    for (const [name, cmd] of commands) {
        if ((cmd.category || '').toLowerCase() === category) {
            cmdList.push(name);
        }
    }
    cmdList.sort(); // alphabetical

    // Emoji for category
    const emojiMap = {
        ai: '🤖',
        tools: '🛠',
        downloader: '📥',
        music: '🎵',
        news: '📰',
        fun: '🎮',
        group: '👥',
        owner: '👑',
        settings: '⚙',
        premium: '🚀',
        bug: '🐞',
        system: '📊'
    };
    const emoji = emojiMap[category] || '📁';
    const catDisplay = category.charAt(0).toUpperCase() + category.slice(1);

    let menu = `╔══════════════════════════════════════╗\n`;
    menu += `║  ${emoji} ${catDisplay.padEnd(34)}║\n`;
    menu += `╠══════════════════════════════════════╣\n`;

    if (cmdList.length === 0) {
        menu += `║  No commands in this category         ║\n`;
    } else {
        // Display commands in two columns (as many as fit)
        const perLine = 2;
        for (let i = 0; i < cmdList.length; i += perLine) {
            let line = '║';
            for (let j = 0; j < perLine; j++) {
                const idx = i + j;
                if (idx < cmdList.length) {
                    const cmdName = cmdList[idx];
                    const padded = ` ${prefix}${cmdName}`.padEnd(18);
                    line += padded;
                } else {
                    line += ' '.repeat(18);
                }
            }
            line += '║\n';
            menu += line;
        }
    }

    menu += `╠══════════════════════════════════════╣\n`;
    menu += `║  💡 Type: ${prefix}menu main            ║\n`;
    menu += `║  📋 To return to main menu            ║\n`;
    menu += `╚══════════════════════════════════════╝`;

    return menu;
}

/**
 * Build error menu for invalid submenu
 */
function buildErrorMenu(invalidSub, prefix) {
    // Gather available categories
    const categorySet = new Set();
    for (const cmd of commands.values()) {
        if (cmd.category) {
            categorySet.add(cmd.category.toLowerCase());
        }
    }
    const categories = Array.from(categorySet).sort();

    let menu = `╔══════════════════════════════════════╗\n`;
    menu += `║  ❌ Invalid Menu: "${invalidSub}"     ║\n`;
    menu += `╠══════════════════════════════════════╣\n`;
    menu += `║  Available menus:                    ║\n`;

    if (categories.length === 0) {
        menu += `║  (none)                             ║\n`;
    } else {
        // list in two columns
        const perLine = 2;
        for (let i = 0; i < categories.length; i += perLine) {
            let line = '║';
            for (let j = 0; j < perLine; j++) {
                const idx = i + j;
                if (idx < categories.length) {
                    const cat = categories[idx];
                    const padded = ` ${cat}`.padEnd(18);
                    line += padded;
                } else {
                    line += ' '.repeat(18);
                }
            }
            line += '║\n';
            menu += line;
        }
    }

    menu += `╠══════════════════════════════════════╣\n`;
    menu += `║  💡 Type: ${prefix}menu <submenu>      ║\n`;
    menu += `║  📋 Example: ${prefix}menu ai           ║\n`;
    menu += `╚══════════════════════════════════════╝`;

    return menu;
}

/**
 * Helper: Get formatted uptime
 */
function getUptime(startTime) {
    const now = Date.now();
    const diff = now - startTime;
    if (diff < 0) return 'N/A';
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Helper: Get RAM usage
 */
function getRAMUsage() {
    const used = process.memoryUsage();
    const heapUsed = (used.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (used.heapTotal / 1024 / 1024).toFixed(2);
    return `${heapUsed}MB / ${heapTotal}MB`;
}

/**
 * Helper: Get current date and time as separate strings
 */
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return { date, time };
}
```
