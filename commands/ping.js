'use strict';

const os = require('os');

module.exports = {
    name: 'ping',
    aliases: ['speed', 'alive'],
    description: 'Check bot speed and system status',
    category: 'System',

    async execute({ sock, from, config }) {

        const start = process.hrtime.bigint();

        const sent = await sock.sendMessage(from, {
            text: '⚡ Measuring Freezer-MD performance...'
        });

        const end = process.hrtime.bigint();
        const ping = (Number(end - start) / 1000000).toFixed(2);

        // RAM
        const memory = process.memoryUsage();
        const ramUsed = memory.heapUsed / 1024 / 1024;
        const ramTotal = memory.heapTotal / 1024 / 1024;

        const ramPercent = Math.min(
            Math.round((ramUsed / ramTotal) * 100),
            100
        );

        const ramBar =
            "█".repeat(Math.floor(ramPercent / 10)) +
            "░".repeat(10 - Math.floor(ramPercent / 10));

        // Runtime
        const uptime = process.uptime();

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const runtime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // CPU
        const cpu = os.cpus()[0];

        // System
        const hostname = os.hostname();
        const arch = os.arch();
        const platform = os.platform();

        const message = `
╭━━━━━━━━━━━━━━━━━━━━━━⬣
┃ ❄️ *FREEZER-MD SYSTEM*
┣━━━━━━━━━━━━━━━━━━━━━━⬣

⚡ *Speed*
> ${ping} ms

🟢 *Status*
> Online

⏳ *Runtime*
> ${runtime}

💾 *Memory*
> ${ramBar} ${ramPercent}%
> ${ramUsed.toFixed(2)} MB / ${ramTotal.toFixed(2)} MB

🧠 *CPU*
> ${cpu.model}

🖥 *Platform*
> ${platform} (${arch})

🌐 *Host*
> ${hostname}

🟩 *Node.js*
> ${process.version}

🤖 *Bot*
> ${config.BOT_NAME}

📌 *Version*
> ${config.VERSION || "2.0.0"}

━━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by *FREEZER CARTEL*
╰━━━━━━━━━━━━━━━━━━━━━━⬣`;

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
