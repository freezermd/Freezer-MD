// commands/ping.js
module.exports = {
    name: 'ping',
    aliases: ['pong'],
    category: 'system',
    description: 'Check bot response time',
    usage: '.ping',
    async execute({ sock, msg, args, from, config }) {
        const start = Date.now();
        try {
            const sent = await sock.sendMessage(from, { text: '🏓 Pinging...' });
            const latency = Date.now() - start;
            await sock.sendMessage(from, { text: `🏓 Pong! *${latency}ms*` });
        } catch (error) {
            console.error('Ping error:', error);
            await sock.sendMessage(from, { text: '❌ Ping failed.' });
        }
    }
};
