// commands/version.js
module.exports = {
    name: 'version',
    aliases: ['ver'],
    category: 'system',
    description: 'Show bot version',
    usage: '.version',
    async execute({ sock, msg, args, from, config }) {
        try {
            const version = config.VERSION || '1.0.0';
            const botName = config.BOT_NAME || 'Freezer-MD';
            await sock.sendMessage(from, { text: `🧊 ${botName} v${version}` });
        } catch (error) {
            console.error('Version error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get version.' });
        }
    }
};
