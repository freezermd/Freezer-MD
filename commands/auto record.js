// commands/autorecord.js
const { isFeatureEnabledForChat, setFeatureForChat } = require('../lib/autoFeatures');

module.exports = {
    name: 'autorecord',
    aliases: ['autorec'],
    category: 'features',
    description: 'Toggle auto-recording (sends recording presence)',
    usage: '.autorecord on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .autorecord on/off'
                });
            }

            const value = option === 'on';
            setFeatureForChat(from, 'autorecord', value);

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `🎙️ Auto-recording has been ${status} for this chat.`
            });
        } catch (error) {
            console.error('AutoRecord error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle auto-recording.' });
        }
    }
};
