// commands/group/warn.js
const { isAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');
const { addWarning } = require('../../utils/db');

module.exports = {
    name: 'warn',
    aliases: [],
    category: 'group',
    description: 'Warn a member (stores warnings)',
    usage: '.warn @user [reason]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to warn members.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to warn.' });
            }

            const target = targets[0]; // Warn one user at a time
            const reason = args.slice(1).join(' ') || 'No reason provided';
            const date = new Date().toISOString();

            addWarning(from, target, reason, date);

            const warnings = getWarnings(from, target);
            await sock.sendMessage(from, { 
                text: `⚠️ Warned @${target.split('@')[0]}\nReason: ${reason}\nTotal warnings: ${warnings.length}`,
                mentions: [target]
            });
        } catch (error) {
            console.error('Warn error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to warn user.' });
        }
    }
};
