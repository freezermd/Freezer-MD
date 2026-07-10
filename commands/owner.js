'use strict';

const os = require('os');
const { commands } = require('../handler');

module.exports = {
    name: 'owner',
    aliases: ['panel', 'dashboard'],
    description: 'Owner Control Panel',
    ownerOnly: true,

    async execute({ sock, from, config }) {

        const uptime = process.uptime();

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const ram = (
            process.memoryUsage().heapUsed /
            1024 /
            1024
        ).toFixed(2);

        const totalCommands = new Set(
            [...commands.values()]
        ).size;

        const text = `
⭐ *FREEZER-MD OWNER PANEL*
━━━━━━━━━━━━━━━━━━

🤖 Bot: ${config.BOT_NAME}

🟢 Status: Online

👑 Owner: ${config.OWNER_NAME}

📦 Commands: ${totalCommands}

⏱ Uptime:
${days}d ${hours}h ${minutes}m ${seconds}s

💾 RAM:
${ram} MB

🖥 Platform:
${os.platform()}

⚙ Node:
${process.version}

━━━━━━━━━━━━━━━━━━

🔒 Owner Commands

.restart
.shutdown
.broadcast
.eval
.exec
.setprefix

━━━━━━━━━━━━━━━━━━

🧊 Freezer-MD
`;

        await sock.sendMessage(from, {
            text
        });

    }
};
