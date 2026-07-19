// commands/group/goodbye.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'goodbye',
    aliases: ['leave'],
    category: 'group',
    description: 'Set or toggle goodbye message when members leave',
    usage: '.goodbye on/off or .goodbye [message]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to configure goodbye.' });
            }

            if (!args.length) {
                const current = getGroupSetting(from, 'goodbyeEnabled', false);
                const msg = getGroupSetting(from, 'goodbyeMessage', 'Goodbye @user, we\'ll miss you!');
                return sock.sendMessage(from, { text: `Goodbye: ${current ? 'ON' : 'OFF'}\nMessage: ${msg}` });
            }

            const first = args[0].toLowerCase();
            if (first === 'on' || first === 'off') {
                setGroupSetting(from, 'goodbyeEnabled', first === 'on');
                return sock.sendMessage(from, { text: `✅ Goodbye message turned ${first}.` });
            } else {
                const message = args.join(' ');
                setGroupSetting(from, 'goodbyeMessage', message);
                setGroupSetting(from, 'goodbyeEnabled', true);
                return sock.sendMessage(from, { text: `✅ Goodbye message updated to:\n${message}` });
            }
        } catch (error) {
            console.error('Goodbye error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to configure goodbye.' });
        }
    }
};
