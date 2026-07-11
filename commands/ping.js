'use strict';

module.exports = {
    name: 'pingall',
    aliases: ['allping', 'fullping'],
    description: 'Comprehensive latency report',
    async execute({ sock, from, client }) {
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '⏳ Gathering all pings...' });

        // 1. Message round-trip
        const msgStart = Date.now();
        await sock.sendMessage(from, { text: '📨' });
        const msgLatency = Date.now() - msgStart;

        // 2. WebSocket ping
        let wsPing = 'N/A';
        if (client?.ws?.ping) {
            wsPing = client.ws.ping + 'ms';
        } else if (client?.ws?.getPing) {
            wsPing = client.ws.getPing() + 'ms';
        }

        // 3. Database ping (optional)
        let dbPing = 'N/A';
        try {
            const db = global.db;
            if (db) {
                const dbStart = Date.now();
                if (db.command) await db.command({ ping: 1 });
                else if (db.query) await db.query('SELECT 1');
                dbPing = Date.now() - dbStart + 'ms';
            }
        } catch {}

        // 4. System info
        const uptime = formatUptime(process.uptime());
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const total = Date.now() - start;

        const responseText = `📊 Full Ping Report

📨 Message round-trip: ${msgLatency}ms
🔄 WebSocket latency: ${wsPing}
🗄️  Database latency: ${dbPing}

⏳ Uptime: ${uptime}
💾 Heap used: ${mem} MB

⏱️ Total response time: ${total}ms`;

        await sock.sendMessage(from, {
            text: responseText,
            edit: sent.key
        }).catch(async () => {
            await sock.sendMessage(from, { text: responseText });
        });
    },
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}
