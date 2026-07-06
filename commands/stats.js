'use strict';

module.exports = {
    name: 'stats',
    aliases: ['status', 'info', 'botinfo'],
    description: 'Display bot statistics and system information',
    async execute({ sock, from, client }) {
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '📊 Fetching bot statistics...' });

        try {
            // Get bot info
            const botNumber = client.user?.id || 'Unknown';
            const botName = client.user?.name || 'Unknown';
            
            // Get group/chat info
            const chat = await client.groupMetadata?.(from) || null;
            const chatName = chat?.subject || 'Private Chat';
            const participants = chat?.participants?.length || 'N/A';
            
            // System info
            const memoryUsage = process.memoryUsage();
            const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
            
            // Uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            // Response time
            const ms = Date.now() - start;

            const statsMessage = `📊 Bot Statistics

🤖 Bot Name: ${botName}
📱 Bot Number: ${botNumber}
💬 Chat: ${chatName}
👥 Participants: ${participants}

💾 Memory Used: ${memoryUsed} MB
💾 Memory Total: ${memoryTotal} MB
⏱️ Uptime: ${uptimeStr}

⚡ Ping: ${ms}ms
🟢 Status: Online

📅 Date: ${new Date().toLocaleString()}`;

            await sock.sendMessage(from, {
                text: statsMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: statsMessage });
            });

        } catch (error) {
            console.error('Stats error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to fetch statistics.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to fetch statistics.` });
            });
        }
    },
};
