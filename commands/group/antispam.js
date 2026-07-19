// commands/group/antispam.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'antispam',
    aliases: [],
    category: 'group',
    description: 'Toggle anti-spam protection (limits messages per user)',
    usage: '.antispam on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to toggle antispam.' });
            }

            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, { text: '❌ Usage: .antispam on/off' });
            }

            setGroupSetting(from, 'antispam', option === 'on');
            await sock.sendMessage(from, { text: `✅ Antispam has been turned ${option}.` });
        } catch (error) {
            console.error('Antispam error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle antispam.' });
        }
    }
};
