// commands/downloader/facebook.js
const { downloadFacebook, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'fbdl'],
    category: 'downloader',
    description: 'Download Facebook video',
    usage: '.facebook <URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a Facebook URL.' });
            }

            const url = args[0];
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching Facebook video...');
            const filePath = await downloadFacebook(url);
            await sendProgress(sock, from, 'processing', 'Processing...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending video...');

            await sock.sendMessage(from, {
                video: { url: filePath },
                caption: '📘 Facebook video',
                mimetype: 'video/mp4'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Facebook error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
