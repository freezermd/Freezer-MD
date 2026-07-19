// commands/groups.js
module.exports = {
    name: 'groups',
    aliases: ['group'],
    category: 'system',
    description: 'Show number of groups the bot is in',
    usage: '.groups',
    async execute({ sock, msg, args, from, config }) {
        try {
            const count = global.stats?.groups?.size || 0;
            await sock.sendMessage(from, { text: `👥 Groups: *${count}*` });
        } catch (error) {
            console.error('Groups error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get group count.' });
        }
    }
};
