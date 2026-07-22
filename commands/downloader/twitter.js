// commands/downloader/twitter.js
const { downloadTwitter, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'twitter',
    aliases: ['tw', 'x'],
    category: 'downloader',
    description: 'Download Twitter video',
    usage: '.twitter <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a Twitter URL.' });
            }

            const url = args[0];
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching Twitter video...');
            const filePath = await downloadTwitter(url);
            await sendProgress(sock, from, 'processing', 'Processing...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending video...');

            await sock.sendMessage(from, {
                video: { url: filePath },
                caption: '🐦 Twitter video',
                mimetype: 'video/mp4'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Twitter error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
