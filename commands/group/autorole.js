// commands/group/autorole.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'autorole',
    aliases: [],
    category: 'group',
    description: 'Set a role (admin) to be automatically assigned to new members',
    usage: '.autorole on/off or .autorole admin',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to configure autorole.' });
            }

            if (!args.length) {
                const current = getGroupSetting(from, 'autorole', null);
                return sock.sendMessage(from, { text: `Autorole: ${current || 'disabled'}` });
            }

            const first = args[0].toLowerCase();
            if (first === 'off') {
                setGroupSetting(from, 'autorole', null);
                return sock.sendMessage(from, { text: '✅ Autorole disabled.' });
            } else if (first === 'admin') {
                setGroupSetting(from, 'autorole', 'admin');
                return sock.sendMessage(from, { text: '✅ New members will be automatically promoted to admin.' });
            } else {
                return sock.sendMessage(from, { text: '❌ Usage: .autorole on/off or .autorole admin' });
            }
        } catch (error) {
            console.error('Autorole error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to configure autorole.' });
        }
    }
};
