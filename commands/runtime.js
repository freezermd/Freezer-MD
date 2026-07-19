// commands/runtime.js
module.exports = {
    name: 'runtime',
    aliases: ['uptime'],
    category: 'system',
    description: 'Show bot uptime',
    usage: '.runtime',
    async execute({ sock, msg, args, from, config }) {
        try {
            const startTime = config.START_TIME || Date.now();
            const uptime = getUptime(startTime);
            await sock.sendMessage(from, { text: `⏱ Bot Uptime: *${uptime}*` });
        } catch (error) {
            console.error('Runtime error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get uptime.' });
        }
    }
};

function getUptime(startTime) {
    const diff = Date.now() - startTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
