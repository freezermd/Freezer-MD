'use strict';

const os = require('os');
const { commands } = require('../handler');

module.exports = {
    name: 'menu',
    aliases: ['help', 'h'],
    category: 'System',
    description: 'Show the main command menu with categories',
    async execute({ sock, msg, args, from, config }) {
        const start = Date.now();

        // Determine what to show: main menu or submenu
        if (args.length === 0) {
            await showMainMenu(sock, from, config, start);
        } else {
            const categoryQuery = args[0].toLowerCase();
            await showSubMenu(sock, from, config, categoryQuery, start);
        }
    },
};

// ─── MAIN MENU ───────────────────────────────────────────────────────────────
async function showMainMenu(sock, from, config, start) {
    try {
        const prefix = config.PREFIX || '.';
        const botName = config.BOT_NAME || 'FREEZER-MD';
        const version = config.VERSION || '1.0.0';
        const owner = config.OWNER_NAME || 'Freezer Cartel';

        // System stats
        const uptime = process.uptime();
        const uptimeStr = formatUptime(uptime);
        const mem = process.memoryUsage();
        const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (mem.rss / 1024 / 1024).toFixed(2);

        // Real ping
        const ping = Date.now() - start;

        // Commands count
        const totalCommands = commands.size;

        // Detect categories
        const categories = getCategories(commands);
        const totalCategories = categories.size;

        // Current date/time
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });

        // Build the menu text
        const banner = buildBanner(botName);
        const infoSection = buildInfoSection(owner, botName, version, ping);
        const systemSection = buildSystemSection(uptimeStr, heapUsed, heapTotal, rss, totalCommands, totalCategories, dateStr, timeStr);
        const categorySection = buildCategorySection(commands, categories, prefix);
        const footer = buildFooter(botName);

        const menuText = [
            banner,
            '',
            infoSection,
            '',
            systemSection,
            '',
            categorySection,
            '',
            footer,
        ].join('\n');

        await sock.sendMessage(from, { text: menuText });
    } catch (error) {
        console.error('Error showing main menu:', error);
        await sock.sendMessage(from, { text: '❌ Failed to load menu. Please try again later.' });
    }
}

// ─── SUBMENU ──────────────────────────────────────────────────────────────────
async function showSubMenu(sock, from, config, categoryQuery, start) {
    try {
        const prefix = config.PREFIX || '.';

        // Find category (case-insensitive)
        let targetCategory = null;
        let categoryIcon = '';
        const categories = getCategories(commands);
        for (const [cat, info] of categories) {
            if (cat.toLowerCase() === categoryQuery) {
                targetCategory = cat;
                categoryIcon = info.icon;
                break;
            }
        }

        if (!targetCategory) {
            // Invalid category - show available categories
            const available = Array.from(categories.keys())
                .map(c => `${categories.get(c).icon} ${c}`)
                .join('\n');
            const msg = `❌ Invalid Menu: "${categoryQuery}"\n\nAvailable categories:\n${available}\n\n━━━━━━━━━━━━━━━━━━━━━━\nType .menu to return.`;
            await sock.sendMessage(from, { text: msg });
            return;
        }

        // Gather commands in this category
        const cmds = [];
        for (const [name, cmd] of commands) {
            if ((cmd.category || 'General') === targetCategory) {
                cmds.push(name);
            }
        }
        cmds.sort((a, b) => a.localeCompare(b));

        const icon = categoryIcon;
        const title = `${icon} ${targetCategory.toUpperCase()} COMMANDS`;
        const count = cmds.length;

        let subText = `╔══════════════════════════════════════════════════╗\n`;
        subText += `║  ${title.padEnd(46)}║\n`;
        subText += `╠══════════════════════════════════════════════════╣\n`;
        if (cmds.length === 0) {
            subText += `║  No commands in this category.                    ║\n`;
        } else {
            for (const cmd of cmds) {
                subText += `║  ${prefix}${cmd.padEnd(46)}║\n`;
            }
        }
        subText += `╠══════════════════════════════════════════════════╣\n`;
        subText += `║  📊 Total: ${String(count).padStart(3)} command${count > 1 ? 's' : ''}                     ║\n`;
        subText += `╚══════════════════════════════════════════════════╝\n`;
        subText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        subText += `💡 Type .menu to return to main menu.`;

        await sock.sendMessage(from, { text: subText });
    } catch (error) {
        console.error('Error showing submenu:', error);
        await sock.sendMessage(from, { text: '❌ Failed to load submenu. Please try again.' });
    }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getCategories(commandsMap) {
    const categoryOrder = [
        'AI',
        'Downloader',
        'Music',
        'News',
        'Tools',
        'Group',
        'Fun',
        'Owner',
        'Settings',
        'Premium',
        'Bug',
        'System',
    ];
    const iconMap = {
        AI: '🤖',
        Downloader: '📥',
        Music: '🎵',
        News: '📰',
        Tools: '🛠',
        Group: '👥',
        Fun: '🎮',
        Owner: '👑',
        Settings: '⚙',
        Premium: '🚀',
        Bug: '🐞',
        System: '📊',
    };
    // Collect categories from commands
    const catSet = new Set();
    for (const [, cmd] of commandsMap) {
        const category = cmd.category || 'General';
        catSet.add(category);
    }
    // Sort by predefined order, then alphabetically for others
    const sorted = Array.from(catSet).sort((a, b) => {
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
    const result = new Map();
    for (const cat of sorted) {
        const icon = iconMap[cat] || '📌';
        result.set(cat, { icon });
    }
    return result;
}

function buildBanner(botName) {
    // A stylish Unicode banner with box-drawing and cyber theme
    const lines = [
        '╔══════════════════════════════════════════════════╗',
        '║ ███████╗██████╗ ███████╗███████╗███████╗██████╗ ║',
        '║ ██╔════╝██╔══██╗██╔════╝╚══███╔╝╚══███╔╝██╔══██╗║',
        '║ █████╗  ██████╔╝█████╗    ███╔╝   ███╔╝ ██████╔╝║',
        '║ ██╔══╝  ██╔══██╗██╔══╝   ███╔╝   ███╔╝  ██╔══██╗║',
        '║ ██║     ██║  ██║███████╗███████╗███████╗██║  ██║║',
        '║ ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝║',
        '║                                                    ║',
        `║         🧊 ${botName.padEnd(28)}🧊         ║`,
        '╚══════════════════════════════════════════════════╝',
    ];
    return lines.join('\n');
}

function buildInfoSection(owner, botName, version, ping) {
    return [
        '📋 BOT INFORMATION',
        '────────────────────',
        `👤 Owner       : ${owner}`,
        `🤖 Bot Name    : ${botName}`,
        `📌 Version     : ${version}`,
        `📶 Real Ping   : ${ping}ms`,
    ].join('\n');
}

function buildSystemSection(uptime, heapUsed, heapTotal, rss, totalCommands, totalCategories, date, time) {
    return [
        '📊 SYSTEM INFORMATION',
        '────────────────────',
        `⏱ Runtime      : ${uptime}`,
        `💾 Heap Used   : ${heapUsed} MB`,
        `💾 Heap Total  : ${heapTotal} MB`,
        `🧠 RSS Memory  : ${rss} MB`,
        `📦 Commands    : ${totalCommands}`,
        `📂 Categories  : ${totalCategories}`,
        `📅 Date        : ${date}`,
        `⌚ Time        : ${time}`,
        `🟢 Status      : Online`,
    ].join('\n');
}

function buildCategorySection(commandsMap, categories, prefix) {
    const lines = ['📂 COMMAND CATEGORIES', '────────────────────'];
    for (const [category, info] of categories) {
        // Count commands in this category
        let count = 0;
        for (const [, cmd] of commandsMap) {
            if ((cmd.category || 'General') === category) {
                count++;
            }
        }
        if (count > 0) {
            lines.push(`${info.icon} ${category.padEnd(14)} : ${count} command${count > 1 ? 's' : ''}`);
        }
    }
    lines.push(`────────────────────`);
    lines.push(`💡 Type ${prefix}menu <category> to view commands`);
    return lines.join('\n');
}

function buildFooter(botName) {
    return [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `🧊 ${botName}`,
        '⚡ Fast • Secure • Powerful',
        '💻 Powered by Node.js',
        '🚀 Built with Baileys',
        '❤️ Developed by Freezer Cartel',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
}
