// commands/group/demote.js
const { isAdmin, isBotAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');

module.exports = {
    name: 'demote',
    aliases: ['removeadmin'],
    category: 'group',
    description: 'Demote an admin to member',
    usage: '.demote @user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to demote members.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to demote members.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to demote.' });
            }

            targets = [...new Set(targets)];
            let success = [];
            let failed = [];
            for (const target of targets) {
                try {
                    await sock.groupParticipantsUpdate(from, [target], 'demote');
                    success.push(target);
                } catch (err) {
                    failed.push(`${target} (${err.message || 'unknown'})`);
                }
            }

            let reply = '';
            if (success.length) reply += `✅ Demoted: ${success.length}\n`;
            if (failed.length) reply += `❌ Failed: ${failed.join(', ')}`;
            if (!reply) reply = '❌ No users were demoted.';
            await sock.sendMessage(from, { text: reply });
        } catch (error) {
            console.error('Demote error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to demote members.' });
        }
    }
};
