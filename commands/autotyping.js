// commands/autotyping.js
const { isFeatureEnabledForChat, setFeatureForChat } = require('../lib/autoFeatures');

module.exports = {
    name: 'autotyping',
    aliases: ['autotype'],
    category: 'features',
    description: 'Toggle auto-typing (sends typing presence)',
    usage: '.autotyping on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .autotyping on/off'
                });
            }

            const value = option === 'on';
            setFeatureForChat(from, 'autotyping', value);

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `📝 Auto-typing has been ${status} for this chat.`
            });
        } catch (error) {
            console.error('AutoTyping error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle auto-typing.' });
        }
    }
};
