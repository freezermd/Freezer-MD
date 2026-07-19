// commands/group/mute.js
const { isAdmin, isBotAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');
const { setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'mute',
    aliases: [],
    category: 'group',
    description: 'Mute a member (prevents them from sending messages)',
    usage: '.mute @user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to mute members.' });
            }

            const isBotAdmin = await isBotAdmin(sock, from);
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: '❌ I need to be an admin to mute members.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to mute.' });
            }

            const target = targets[0];
            // Store muted users in group settings
            const muted = getGroupSetting(from, 'muted', []);
            if (muted.includes(target)) {
                return sock.sendMessage(from, { text: `@${target.split('@')[0]} is already muted.`, mentions: [target] });
            }
            muted.push(target);
            setGroupSetting(from, 'muted', muted);

            await sock.sendMessage(from, { 
                text: `🔇 @${target.split('@')[0]} has been muted.`,
                mentions: [target]
            });
        } catch (error) {
            console.error('Mute error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to mute user.' });
        }
    }
};
