// commands/downloader/play.js
const { downloadYouTubeAudio, searchYouTube, sendProgress, validateFileSize } = require('../../lib/downloader');

module.exports = {
    name: 'play',
    aliases: ['music'],
    category: 'downloader',
    description: 'Play audio from YouTube (search or URL)',
    usage: '.play <song name or URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a song name or YouTube URL.' });
            }

            const query = args.join(' ');
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Searching...');

            // Check if it's a URL
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

            const filePath = await downloadYouTubeAudio(url);
            await sendProgress(sock, from, 'processing', 'Converting...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending audio...');

            await sock.sendMessage(from, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: `${video.videoDetails.title}.mp3`
            });

            // Clean up
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Play error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
