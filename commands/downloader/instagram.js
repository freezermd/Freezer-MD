// commands/downloader/instagram.js
const { downloadInstagram, sendProgress } = require('../../lib/downloader');

module.exports = {
    name: 'instagram',
    aliases: ['ig', 'igdl'],
    category: 'downloader',
    description: 'Download Instagram media (photo/video)',
    usage: '.instagram <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide an Instagram URL.' });
            }

            const url = args[0];
            await sendProgress(sock, from, 'download', 'Fetching Instagram media...');
            const filePath = await downloadInstagram(url);
            // ... similar to others
        } catch (error) {
            console.error('Instagram error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
