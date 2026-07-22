// commands/downloader/pinterest.js
const { downloadPinterest, sendProgress } = require('../../lib/downloader');

module.exports = {
    name: 'pinterest',
    aliases: ['pin'],
    category: 'downloader',
    description: 'Download image/video from Pinterest',
    usage: '.pinterest <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a Pinterest URL.' });
            }

            const url = args[0];
            await sendProgress(sock, from, 'download', 'Fetching Pinterest media...');
            const filePath = await downloadPinterest(url);
            // ... send media
        } catch (error) {
            console.error('Pinterest error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
