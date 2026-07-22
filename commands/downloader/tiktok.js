// commands/downloader/tiktok.js
const { downloadTikTok, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'tiktok',
    aliases: ['tt'],
    category: 'downloader',
    description: 'Download TikTok video (no watermark)',
    usage: '.tiktok <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a TikTok URL.' });
            }

            const url = args[0];
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching TikTok video...');
            const filePath = await downloadTikTok(url);
            await sendProgress(sock, from, 'processing', 'Processing...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending video...');

            await sock.sendMessage(from, {
                video: { url: filePath },
                caption: '🎵 TikTok video (no watermark)',
                mimetype: 'video/mp4'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('TikTok error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
