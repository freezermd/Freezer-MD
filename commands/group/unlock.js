// commands/group/unlock.js
const { isAdmin, isBotAdmin, isOwner } = require('../../utils/groupUtils');

module.exports = {
    name: 'unlock',
    aliases: ['open'],
    category: 'group',
    description: 'Unlock the group (all members can send messages)',
    usage: '.unlock',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to unlock the group.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to unlock the group.' });
            }

            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: '🔓 Group has been unlocked. All members can send messages.' });
        } catch (error) {
            console.error('Unlock error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to unlock group.' });
        }
    }
};
