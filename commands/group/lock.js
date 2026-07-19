// commands/group/lock.js
const { isAdmin, isBotAdmin, isOwner } = require('../../utils/groupUtils');

module.exports = {
    name: 'lock',
    aliases: ['close'],
    category: 'group',
    description: 'Lock the group (only admins can send messages)',
    usage: '.lock',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to lock the group.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to lock the group.' });
            }

            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 Group has been locked. Only admins can send messages.' });
        } catch (error) {
            console.error('Lock error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to lock group.' });
        }
    }
}; commands/
