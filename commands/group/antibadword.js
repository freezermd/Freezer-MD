// commands/group/antibadword.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'antibadword',
    aliases: ['filter'],
    category: 'group',
    description: 'Toggle bad word filter (deletes messages with inappropriate words)',
    usage: '.antibadword on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to toggle antibadword.' });
            }

            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, { text: '❌ Usage: .antibadword on/off' });
            }

            setGroupSetting(from, 'antibadword', option === 'on');
            await sock.sendMessage(from, { text: `✅ Bad word filter has been turned ${option}.` });
        } catch (error) {
            console.error('Antibadword error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle antibadword.' });
        }
    }
};
