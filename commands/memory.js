// commands/memory.js
module.exports = {
    name: 'memory',
    aliases: ['mem'],
    category: 'system',
    description: 'Show memory usage',
    usage: '.memory',
    async execute({ sock, msg, args, from, config }) {
        try {
            const used = process.memoryUsage();
            const heapUsed = (used.heapUsed / 1024 / 1024).toFixed(2);
            const heapTotal = (used.heapTotal / 1024 / 1024).toFixed(2);
            const rss = (used.rss / 1024 / 1024).toFixed(2);
            const external = (used.external / 1024 / 1024).toFixed(2);

            const text = `
💾 *Memory Usage*
- Heap Used: ${heapUsed} MB
- Heap Total: ${heapTotal} MB
- RSS: ${rss} MB
- External: ${external} MB
            `;
            await sock.sendMessage(from, { text });
        } catch (error) {
            console.error('Memory error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get memory info.' });
        }
    }
};
