// commands/group/warnings.js
const { isAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');
const { getWarnings } = require('../../utils/db');

module.exports = {
    name: 'warnings',
    aliases: ['warns'],
    category: 'group',
    description: 'Show warnings for a user',
    usage: '.warnings @user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to view warnings.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                // Show own warnings? For simplicity, we'll ask for user.
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user.' });
            }

            const target = targets[0];
            const warnings = getWarnings(from, target);

            if (!warnings.length) {
                return sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} has no warnings.`, mentions: [target] });
            }

            let text = `⚠️ Warnings for @${target.split('@')[0]} (${warnings.length}):\n`;
            warnings.forEach((w, i) => {
                text += `${i+1}. ${w.reason} (${new Date(w.date).toLocaleDateString()})\n`;
            });
            await sock.sendMessage(from, { text, mentions: [target] });
        } catch (error) {
            console.error('Warnings error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get warnings.' });
        }
    }
};
