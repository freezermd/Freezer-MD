// commands/group/welcome.js
const { isAdmin, isOwner } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'welcome',
    aliases: [],
    category: 'group',
    description: 'Set or toggle welcome message for new members',
    usage: '.welcome on/off or .welcome [message]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to configure welcome.' });
            }

            if (!args.length) {
                const current = getGroupSetting(from, 'welcomeEnabled', false);
                const msg = getGroupSetting(from, 'welcomeMessage', 'Welcome @user to the group!');
                return sock.sendMessage(from, { text: `Welcome: ${current ? 'ON' : 'OFF'}\nMessage: ${msg}` });
            }

            const first = args[0].toLowerCase();
            if (first === 'on' || first === 'off') {
                setGroupSetting(from, 'welcomeEnabled', first === 'on');
                return sock.sendMessage(from, { text: `✅ Welcome message turned ${first}.` });
            } else {
                // Set custom message
                const message = args.join(' ');
                setGroupSetting(from, 'welcomeMessage', message);
                setGroupSetting(from, 'welcomeEnabled', true);
                return sock.sendMessage(from, { text: `✅ Welcome message updated to:\n${message}` });
            }
        } catch (error) {
            console.error('Welcome error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to configure welcome.' });
        }
    }
};
