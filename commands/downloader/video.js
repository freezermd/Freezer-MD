// commands/downloader/video.js
const ytdl = require('@distube/ytdl-core');
const { downloadYouTubeVideo, searchYouTube, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'video',
    aliases: ['ytvideo'],
    category: 'downloader',
    description: 'Download video from YouTube (search or URL)',
    usage: '.video <query or URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a video name or YouTube URL.' });
            }

            const query = args.join(' ');
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Searching...');

            let url = query;
            let video;
            if (ytdl.validateURL(query)) {
                video = await ytdl.getInfo(query);
            } else {
                const searchResult = await searchYouTube(query);
                if (!searchResult) {
                    return sock.sendMessage(from, { text: '❌ No results found.' });
                }
                url = searchResult.url;
                video = await ytdl.getInfo(url);
            }

            await sendProgress(sock, from, 'download', `Found: ${video.videoDetails.title}`);

            const filePath = await downloadYouTubeVideo(url);
            await sendProgress(sock, from, 'processing', 'Processing video...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending video...');

            await sock.sendMessage(from, {
                video: { url: filePath },
                caption: `📹 ${video.videoDetails.title}`,
                mimetype: 'video/mp4'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Video error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
