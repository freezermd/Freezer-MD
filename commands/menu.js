'use strict';

const { commands } = require('../lib/commandManager');
const config = require('../config');

module.exports = {
    name: 'menu',
    aliases: ['help'],
    category: 'System',
    description: 'Show all bot commands',

    async execute({ sock, from }) {
        const categories = {};

        // Group commands by category and remove duplicates
        for (const [, cmd] of commands) {
            const category = cmd.category || 'General';

            if (!categories[category]) {
                categories[category] = [];
            }

            if (!categories[category].includes(cmd.name)) {
                categories[category].push(cmd.name);
            }
        }

        let text = `
╭━━━〔 ❄️ ${config.BOT_NAME} ❄️ 〕━━━⬣
┃ 🤖 Prefix: ${config.PREFIX}
┃ 📚 Commands: ${new Set([...commands.values()]).size}
╰━━━━━━━━━━━━━━━━⬣
`;

        for (const category of Object.keys(categories).sort()) {
            text += `\n╭─❏ ${category.toUpperCase()}\n`;

            categories[category]
                .sort()
                .forEach(cmd => {
                    text += `│ ${config.PREFIX}${cmd}\n`;
                });

            text += `╰────────────⬣\n`;
        }

        text += `
━━━━━━━━━━━━━━━━━━
⚡ Powered By FREEZER CARTEL
`;

        await sock.sendMessage(from, { text });
    }
};
