// commands/group/add.js
const { isAdmin, isBotAdmin, isOwner, parsePhoneNumber } = require('../../utils/groupUtils');

module.exports = {
    name: 'add',
    aliases: ['invite'],
    category: 'group',
    description: 'Add a user to the group by phone number',
    usage: '.add 6281234567890',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to add members.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to add members.' });
            }

            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a phone number. Example: .add 6281234567890' });
            }

            const phone = parsePhoneNumber(args[0]);
            if (!phone) {
                return sock.sendMessage(from, { text: '❌ Invalid phone number. Use international format (e.g., 6281234567890).' });
            }

            try {
                await sock.groupParticipantsUpdate(from, [phone], 'add');
                await sock.sendMessage(from, { text: `✅ Added ${phone}` });
            } catch (err) {
                await sock.sendMessage(from, { text: `❌ Failed to add ${phone}: ${err.message || 'unknown error'}` });
            }
        } catch (error) {
            console.error('Add error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to add member.' });
        }
    }
};
