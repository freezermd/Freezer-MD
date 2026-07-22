// commands/downloader/ytmp4.js
const ytdl = require('@distube/ytdl-core');
const { downloadYouTubeVideo, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'ytmp4',
    aliases: ['ytvideo'],
    category: 'downloader',
    description: 'Download video from YouTube link with quality (360, 480, 720, 1080)',
    usage: '.ytmp4 <URL> [quality]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a YouTube URL.' });
            }

            const url = args[0];
            if (!ytdl.validateURL(url)) {
                return sock.sendMessage(from, { text: '❌ Invalid YouTube URL.' });
            }

            const quality = args[1] || '720';
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching video info...');
            const video = await ytdl.getInfo(url);

            await sendProgress(sock, from, 'download', `Title: ${video.videoDetails.title}`);

            const filePath = await downloadYouTubeVideo(url, quality);
            await sendProgress(sock, from, 'processing', 'Processing video...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending video...');

            await sock.sendMessage(from, {
                video: { url: filePath },
                caption: `📹 ${video.videoDetails.title}\nQuality: ${quality}p`,
                mimetype: 'video/mp4'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Ytmp4 error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
