'use strict';

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands'],
    description: 'List all available commands',
    async execute({ sock, from, config }) {
        // eslint-disable-next-line global-require
        const { commands } = require('../handler');
        const seen = new Set();
        let list = '';

        for (const cmd of commands.values()) {
            if (seen.has(cmd.name)) continue;
            seen.add(cmd.name);
            list += `\n• ${config.PREFIX}${cmd.name} — ${cmd.description || ''}`;
        }

        await sock.sendMessage(from, {
            text: `📋 *${config.BOT_NAME} Menu*\n${list}\n\nPrefix: ${config.PREFIX}`,
        });
    },
};
