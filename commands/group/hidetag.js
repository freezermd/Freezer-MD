// commands/group/hidetag.js
const { isAdmin, isBotAdmin, isOwner } = require('../../utils/groupUtils');

module.exports = {
    name: 'hidetag',
    aliases: ['ht'],
    category: 'group',
    description: 'Send a message that tags all members without showing the mentions visibly',
    usage: '.hidetag [message]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to use hidetag.' });
            }

            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const text = args.length ? args.join(' ') : '🔇 Hidden tag all';

            await sock.sendMessage(from, { text, mentions: participants });
        } catch (error) {
            console.error('Hidetag error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to send hidetag.' });
        }
    }
};
