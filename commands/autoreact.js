// commands/autoreact.js
const { isFeatureEnabledForChat, setFeatureForChat } = require('../lib/autoFeatures');

module.exports = {
    name: 'autoreact',
    aliases: ['autoreact'],
    category: 'features',
    description: 'Toggle auto-reacting to messages with random emojis',
    usage: '.autoreact on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .autoreact on/off'
                });
            }

            const value = option === 'on';
            setFeatureForChat(from, 'autoreact', value);

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `😊 Auto-react has been ${status} for this chat.`
            });
        } catch (error) {
            console.error('AutoReact error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle auto-react.' });
        }
    }
};
