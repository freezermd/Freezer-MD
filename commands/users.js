// commands/users.js
module.exports = {
    name: 'users',
    aliases: ['user'],
    category: 'system',
    description: 'Show number of unique users',
    usage: '.users',
    async execute({ sock, msg, args, from, config }) {
        try {
            const count = global.stats?.users?.size || 0;
            await sock.sendMessage(from, { text: `👥 Unique Users: *${count}*` });
        } catch (error) {
            console.error('Users error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get user count.' });
        }
    }
};
