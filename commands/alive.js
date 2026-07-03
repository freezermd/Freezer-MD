'use strict';

function uptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

module.exports = {
    name: 'alive',
    aliases: ['status'],
    description: 'Check if the bot is running',
    async execute({ sock, from, config }) {
        await sock.sendMessage(from, {
            text: `✅ *${config.BOT_NAME}* is alive!\n⏱️ Uptime: ${uptime(process.uptime())}\n🔧 Prefix: ${config.PREFIX}`,
        });
    },
};
