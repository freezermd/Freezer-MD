'use strict';

const os = require('os');

module.exports = {
    name: 'ping',
    aliases: ['speed', 'alive'],
    description: 'Check bot speed and system status',
    category: 'System',

    async execute({ sock, from, config }) {

        const start = Date.now();

        // Send temporary message
        const sent = await sock.sendMessage(from, {
            text: '🏓 Testing bot speed...'
        });

        const ping = Date.now() - start;

        // Memory
        const memory = process.memoryUsage();

        const ramUsed = (memory.heapUsed / 1024 / 1024).toFixed(2);
        const ramTotal = (memory.heapTotal / 1024 / 1024).toFixed(2);

        // Uptime
        const uptime = process.uptime();

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const runtime =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const message = `
╭━━━〔 🏓 FREEZER SPEED TEST 〕━━━⬣

⚡ Ping
${ping} ms

🟢 Status
Online

⏳ Runtime
${runtime}

💾 RAM
${ramUsed} MB / ${ramTotal} MB

🖥 Platform
${os.platform()}

⚙ CPU
${os.cpus()[0].model}

🧩 Node.js
${process.version}

🤖 Bot
${config.BOT_NAME}

📌 Version
${config.VERSION || "1.0.0"}

╰━━━━━━━━━━━━━━━━━━━━⬣
`;

        // Edit if supported
        await sock.sendMessage(from, {
            text: message,
            edit: sent.key
        }).catch(async () => {
            await sock.sendMessage(from, {
                text: message
            });
        });

    }
};
