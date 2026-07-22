// commands/alwaysonline.js
const { getGlobalFeature, setGlobalFeature } = require('../lib/autoFeatures');

module.exports = {
    name: 'alwaysonline',
    aliases: ['online'],
    category: 'features',
    description: 'Toggle always-online status (presence available)',
    usage: '.alwaysonline on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .alwaysonline on/off'
                });
            }

            const value = option === 'on';
            setGlobalFeature('alwaysonline', value);

            // Apply immediately
            if (value) {
                await sock.sendPresenceUpdate('available');
            } else {
                await sock.sendPresenceUpdate('unavailable'); // or keep as is
            }

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `🟢 Always-online has been ${status} globally.`
            });
        } catch (error) {
            console.error('AlwaysOnline error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle always-online.' });
        }
    }
};
