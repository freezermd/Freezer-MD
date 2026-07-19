// commands/group/unmute.js
const { isAdmin, isBotAdmin, isOwner, getMentions, getRepliedUser } = require('../../utils/groupUtils');
const { getGroupSetting, setGroupSetting } = require('../../utils/db');

module.exports = {
    name: 'unmute',
    aliases: [],
    category: 'group',
    description: 'Unmute a member',
    usage: '.unmute @user',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command is only for groups.' });

            const sender = msg.key.participant || msg.key.remoteJid;
            const isSenderAdmin = await isAdmin(sock, from, sender);
            const isSenderOwner = isOwner(sender, config);

            if (!isSenderAdmin && !isSenderOwner) {
                return sock.sendMessage(from, { text: '❌ You need admin permissions to unmute members.' });
            }

            let targets = getMentions(msg);
            const replied = getRepliedUser(msg);
            if (replied && !targets.includes(replied)) targets.push(replied);

            if (!targets.length) {
                return sock.sendMessage(from, { text: '❌ Please mention or reply to the user you want to unmute.' });
            }

            const target = targets[0];
            let muted = getGroupSetting(from, 'muted', []);
            if (!muted.includes(target)) {
                return sock.sendMessage(from, { text: `@${target.split('@')[0]} is not muted.`, mentions: [target] });
            }
            muted = muted.filter(id => id !== target);
            setGroupSetting(from, 'muted', muted);

            await sock.sendMessage(from, { 
                text: `🔊 @${target.split('@')[0]} has been unmuted.`,
                mentions: [target]
            });
        } catch (error) {
            console.error('Unmute error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to unmute user.' });
        }
    }
};
