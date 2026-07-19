// commands/group/delete.js
const { isAdmin, isBotAdmin, isOwner } = require('../../utils/groupUtils');

module.exports = {
    name: 'delete',
    aliases: ['del', 'purge'],
    category: 'group',
    description: 'Delete a replied message (admin only)',
    usage: '.delete (reply to message)',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to delete messages.' });
            }

            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return sock.sendMessage(from, { text: '❌ Please reply to a message you want to delete.' });
            }

            const key = {
                remoteJid: from,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
            };

            await sock.sendMessage(from, { delete: key });
            await sock.sendMessage(from, { text: '✅ Message deleted.' });
        } catch (error) {
            console.error('Delete error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to delete message.' });
        }
    }
};
