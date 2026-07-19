// commands/stats.js
const os = require('os');
const { commands } = require('../handler');

module.exports = {
    name: 'stats',
    aliases: ['dashboard'],
    category: 'system',
    description: 'Show complete bot statistics',
    usage: '.stats',
    async execute({ sock, msg, args, from, config }) {
        try {
            const startTime = config.START_TIME || Date.now();
            const uptime = getUptime(startTime);
            const memory = getMemoryUsage();
            const cpu = getCPUUsage();
            const load = os.loadavg();
            const totalCommands = commands.size;
            const users = global.stats?.users?.size || 0;
            const groups = global.stats?.groups?.size || 0;
            const ping = Date.now() - msg.messageTimestamp * 1000 || 0;

            const prefix = config.PREFIX || '.';
            const botName = config.BOT_NAME || 'Freezer-MD';
            const version = config.VERSION || '1.0.0';
            const owner = config.OWNER_NAME || 'Freezer';

            const menu = `
╔══════════════════════════════════════╗
║  📊 ${botName} STATISTICS          ║
╠══════════════════════════════════════╣
║  🤖 Bot Name  : ${botName.padEnd(26)}║
║  📌 Version   : ${version.padEnd(26)}║
║  👤 Owner     : ${owner.padEnd(26)}║
║  ⏱ Uptime    : ${uptime.padEnd(26)}║
║  📶 Ping      : ${String(ping).padEnd(26)}ms║
║  💾 RAM       : ${memory.padEnd(26)}║
║  🖥 CPU       : ${cpu.padEnd(26)}%║
║  📊 Load      : ${load.map(l => l.toFixed(2)).join(' ').padEnd(26)}║
║  👥 Users     : ${String(users).padEnd(26)}║
║  👥 Groups    : ${String(groups).padEnd(26)}║
║  📦 Commands  : ${String(totalCommands).padEnd(26)}║
╚══════════════════════════════════════╝`;

            await sock.sendMessage(from, { text: menu });
        } catch (error) {
            console.error('Stats error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to fetch statistics.' });
        }
    }
};

function getUptime(startTime) {
    const diff = Date.now() - startTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days) return `${days}d ${hours % 24}h`;
    if (hours) return `${hours}h ${minutes % 60}m`;
    if (minutes) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function getMemoryUsage() {
    const used = process.memoryUsage();
    const heapUsed = (used.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotal = (used.heapTotal / 1024 / 1024).toFixed(1);
    return `${heapUsed}MB / ${heapTotal}MB`;
}

function getCPUUsage() {
    const cpus = os.cpus();
    if (cpus.length === 0) return 'N/A';
    let totalIdle = 0, totalTick = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (idle / total) * 100;
    return usage.toFixed(1);
}
