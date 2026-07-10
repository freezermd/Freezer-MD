'use strict';

module.exports = {
    name: 'owner',
    aliases: ['creator', 'admin', 'dev'],
    description: 'Information about bot owner',
    async execute({ sock, from }) {
        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: '👤 Fetching owner info...' });

        try {
            const ms = Date.now() - start;
            
            const ownerMessage = `👤 Bot Owner Information

📱 Name: Your Name Here
🆔 Owner ID: 1234567890
📧 Email: owner@example.com
🌐 Website: https://example.com
📅 Joined: January 2024

💬 Contact Info:
• WhatsApp: wa.me/1234567890
• Telegram: @username
• Instagram: @username

🤖 Bot Info:
• Bot Name: ${process.env.BOT_NAME || 'WhatsApp Bot'}
• Version: ${process.env.npm_package_version || '1.0.0'}
• Language: JavaScript (Node.js)

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: ownerMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: ownerMessage });
            });

        } catch (error) {
            console.error('Owner error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to fetch owner info.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to fetch owner info.` });
            });
        }
    },
};
