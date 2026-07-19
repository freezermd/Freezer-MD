// commands/group/promote.js
const { isAdmin, isBotAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');

module.exports = {
    name: 'promote',
    aliases: ['makeadmin'],
    category: 'group',
    description: 'Promote a member to admin',
    usage: '.promote @user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to promote members.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to promote members.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to promote.' });
            }

            targets = [...new Set(targets)];
            let success = [];
            let failed = [];
            for (const target of targets) {
                try {
                    await sock.groupParticipantsUpdate(from, [target], 'promote');
                    success.push(target);
                } catch (err) {
                    failed.push(`${target} (${err.message || 'unknown'})`);
                }
            }

            let reply = '';
            if (success.length) reply += `✅ Promoted: ${success.length}\n`;
            if (failed.length) reply += `❌ Failed: ${failed.join(', ')}`;
            if (!reply) reply = '❌ No users were promoted.';
            await sock.sendMessage(from, { text: reply });
        } catch (error) {
            console.error('Promote error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to promote members.' });
        }
    }
};
