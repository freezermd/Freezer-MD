// commands/autobio.js
const { getGlobalFeature, setGlobalFeature } = require('../lib/autoFeatures');

module.exports = {
    name: 'autobio',
    aliases: ['autobio'],
    category: 'features',
    description: 'Toggle auto-updating bot bio or set custom bio text',
    usage: '.autobio on/off or .autobio set <text>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                const enabled = getGlobalFeature('autobio');
                const text = getGlobalFeature('autobioText') || 'Not set';
                return sock.sendMessage(from, {
                    text: `🤖 Auto-bio: ${enabled ? 'ON ✅' : 'OFF ❌'}\nBio text: ${text}`
                });
            }

            const option = args[0].toLowerCase();

            if (option === 'on' || option === 'off') {
                const value = option === 'on';
                setGlobalFeature('autobio', value);
                const status = value ? 'enabled ✅' : 'disabled ❌';
                return sock.sendMessage(from, {
                    text: `🤖 Auto-bio has been ${status} globally.`
                });
            }

            if (option === 'set') {
                const text = args.slice(1).join(' ') || '🤖 Freezer-MD bot | Always online';
                setGlobalFeature('autobioText', text);
                // Optionally update bio immediately
                await sock.updateProfileStatus(text);
                return sock.sendMessage(from, {
                    text: `✅ Bio updated to:\n${text}\nAuto-bio is now enabled if it wasn't.`
                });
            }

            return sock.sendMessage(from, {
                text: '❌ Usage: .autobio on/off or .autobio set <text>'
            });
        } catch (error) {
            console.error('AutoBio error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to configure auto-bio.' });
        }
    }
};
