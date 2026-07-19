// commands/group/kick.js
const { isAdmin, isBotAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');

module.exports = {
    name: 'kick',
    aliases: ['remove'],
    category: 'group',
    description: 'Kick a member from the group',
    usage: '.kick @user or reply to user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            // Check sender permission
            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to kick members.' });
            }

            // Check bot admin
            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to kick members.' });
            }

            // Get target user(s)
            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (args.length > 0 && !targets.length) {
                // Try to parse a phone number from args
                const phone = args[0].replace(/[^0-9]/g, '');
                if (phone.length >= 10) {
                    targets.push(phone + '@s.whatsapp.net');
                }
            }

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to kick.' });
            }

            // Remove duplicates
            targets = [...new Set(targets)];

            // Prevent kicking admins (except owner override)
            let failed = [];
            let kicked = [];
            for (const target of targets) {
                const isTargetAdmin = await isAdmin(sock, from, target);
                if (isTargetAdmin && !isSenderOwner) {
                    failed.push(`${target} (is admin)`);
                    continue;
                }
                if (target === sock.user.id.split(':')[0] + '@s.whatsapp.net') {
                    failed.push(`${target} (I cannot kick myself)`);
                    continue;
                }
                try {
                    await sock.groupParticipantsUpdate(from, [target], 'remove');
                    kicked.push(target);
                } catch (err) {
                    failed.push(`${target} (${err.message || 'unknown error'})`);
                }
            }

            let reply = '';
            if (kicked.length) reply += `✅ Kicked: ${kicked.length} user(s)\n`;
            if (failed.length) reply += `❌ Failed: ${failed.join(', ')}`;
            if (!reply) reply = '❌ No users were kicked.';
            await sock.sendMessage(from, { text: reply });
        } catch (error) {
            console.error('Kick error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to kick members.' });
        }
    }
};
