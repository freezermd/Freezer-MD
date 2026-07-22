// commands/autoread.js
const { isFeatureEnabledForChat, setFeatureForChat } = require('../lib/autoFeatures');

module.exports = {
    name: 'autoread',
    aliases: ['autoread'],
    category: 'features',
    description: 'Toggle auto-reading messages (mark as read)',
    usage: '.autoread on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .autoread on/off'
                });
            }

            const value = option === 'on';
            setFeatureForChat(from, 'autoread', value);

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `📖 Auto-read has been ${status} for this chat.`
            });
        } catch (error) {
            console.error('AutoRead error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle auto-read.' });
        }
    }
};
