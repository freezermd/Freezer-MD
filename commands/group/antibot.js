// commands/group/antibot.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'antibot',
    aliases: [],
    category: 'group',
    description: 'Toggle anti-bot protection (kicks bots that join)',
    usage: '.antibot on/off',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to toggle antibot.' });
            }

            const option = args[0]?.toLowerCase();
            if (option !== 'on' && option !== 'off') {
                return sock.sendMessage(from, { text: '❌ Usage: .antibot on/off' });
            }

            setGroupSetting(from, 'antibot', option === 'on');
            await sock.sendMessage(from, { text: `✅ Antibot has been turned ${option}.` });
        } catch (error) {
            console.error('Antibot error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to toggle antibot.' });
        }
    }
};
