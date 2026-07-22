// commands/downloader/ytmp3.js
const ytdl = require('@distube/ytdl-core');
const { downloadYouTubeAudio, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'ytmp3',
    aliases: ['ytaudio'],
    category: 'downloader',
    description: 'Download audio from YouTube link with quality (64, 128, 192, 320)',
    usage: '.ytmp3 <URL> [quality]',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a YouTube URL.' });
            }

            const url = args[0];
            if (!ytdl.validateURL(url)) {
                return sock.sendMessage(from, { text: '❌ Invalid YouTube URL.' });
            }

            const quality = args[1] || '128';
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching video info...');
            const video = await ytdl.getInfo(url);

            await sendProgress(sock, from, 'download', `Title: ${video.videoDetails.title}`);

            const filePath = await downloadYouTubeAudio(url, quality);
            await sendProgress(sock, from, 'processing', 'Encoding audio...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending audio...');

            await sock.sendMessage(from, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${video.videoDetails.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.videoDetails.title,
                        body: `Quality: ${quality}kbps`,
                        thumbnailUrl: video.videoDetails.thumbnails[0].url,
                    }
                }
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Ytmp3 error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
