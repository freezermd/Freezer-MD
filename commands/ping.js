'use strict';

module.exports = {
    name: 'ping',
    aliases: ['speed'],
    description: 'Check bot response time',
    async execute({ sock, from }) {
        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: '🏓 Pinging...' });
        const ms = Date.now() - start;
        await sock.sendMessage(from, { text: `🏓 Pong! ${ms}ms`, edit: sent.key }).catch(async () => {
            await sock.sendMessage(from, { text: `🏓 Pong! ${ms}ms` });
        });
    },
};
