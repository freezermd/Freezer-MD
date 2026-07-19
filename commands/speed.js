// commands/speed.js
const os = require('os');

module.exports = {
    name: 'speed',
    aliases: ['load'],
    category: 'system',
    description: 'Show system load and processing speed',
    usage: '.speed',
    async execute({ sock, msg, args, from, config }) {
        try {
            const load = os.loadavg();
            const cpuCores = os.cpus().length;
            const memory = process.memoryUsage();
            const heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(1);
            const heapTotal = (memory.heapTotal / 1024 / 1024).toFixed(1);

            const text = `
⚡ *Speed & Load*
- CPU Cores: ${cpuCores}
- Load (1m,5m,15m): ${load.map(l => l.toFixed(2)).join(', ')}
- Heap Memory: ${heapUsed}MB / ${heapTotal}MB
- Process Memory: ${(memory.rss / 1024 / 1024).toFixed(1)}MB
            `;
            await sock.sendMessage(from, { text });
        } catch (error) {
            console.error('Speed error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get speed info.' });
        }
    }
};
