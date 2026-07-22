// commands/downloader/mediafire.js
const { downloadMediaFire, sendProgress } = require('../../lib/downloader');

module.exports = {
    name: 'mediafire',
    aliases: ['mf'],
    category: 'downloader',
    description: 'Download files from MediaFire',
    usage: '.mediafire <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a MediaFire URL.' });
            }

            const url = args[0];
            await sendProgress(sock, from, 'download', 'Fetching MediaFire file...');
            const filePath = await downloadMediaFire(url);
            // ... send file
        } catch (error) {
            console.error('MediaFire error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
