// commands/group/resetwarn.js
const { isAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');
const { resetWarnings, resetAllWarnings } = require('../../utils/db');

module.exports = {
    name: 'resetwarn',
    aliases: ['clearwarns'],
    category: 'group',
    description: 'Reset warnings for a user or all users',
    usage: '.resetwarn @user or .resetwarn all',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to reset warnings.' });
            }

            if (args[0] && args[0].toLowerCase() === 'all') {
                const success = resetAllWarnings(from);
                return sock.sendMessage(from, { text: success ? '✅ All warnings reset.' : '❌ No warnings found.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user, or use "all".' });
            }

            const target = targets[0];
            const success = resetWarnings(from, target);
            await sock.sendMessage(from, { 
                text: success ? `✅ Warnings reset for @${target.split('@')[0]}` : `❌ No warnings found for that user.`,
                mentions: [target]
            });
        } catch (error) {
            console.error('Resetwarn error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to reset warnings.' });
        }
    }
};
