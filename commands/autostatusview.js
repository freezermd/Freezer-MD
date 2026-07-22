// commands/autostatusview.js
const { getGlobalFeature, setGlobalFeature } = require('../lib/autoFeatures');

module.exports = {
    name: 'autostatusview',
    aliases: ['autoview'],
    category: 'features',
    description: 'Toggle auto-viewing of status updates',
    usage: '.autostatusview on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, {
                    text: '❌ Usage: .autostatusview on/off'
                });
            }

            const value = option === 'on';
            setGlobalFeature('autostatusview', value);

            const status = value ? 'enabled ✅' : 'disabled ❌';
            await sock.sendMessage(from, {
                text: `👁️ Auto-status-view has been ${status} globally.`
            });
        } catch (error) {
            console.error('AutoStatusView error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle auto-status-view.' });
        }
    }
};
