// commands/group/tagall.js
const { isAdmin, isBotAdmin, isOwner } = require('../../utils/groupUtils');

module.exports = {
    name: 'tagall',
    aliases: ['everyone'],
    category: 'group',
    description: 'Mention all members in the group',
    usage: '.tagall [message]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to tag all members.' });
            }

            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const mentions = participants;

            let text = args.length ? args.join(' ') : '📢 Attention everyone!';
            text += '\n' + participants.map(p => `@${p.split('@')[0]}`).join(' ');

            await sock.sendMessage(from, { text, mentions });
        } catch (error) {
            console.error('Tagall error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to tag all members.' });
        }
    }
};
