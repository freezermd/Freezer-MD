// commands/downloader/spotify.js
const { downloadSpotify, sendProgress, validateFileSize } = require('../../lib/downloader');
const fs = require('fs');

module.exports = {
    name: 'spotify',
    aliases: ['sp'],
    category: 'downloader',
    description: 'Download track from Spotify (requires login)',
    usage: '.spotify <track URL>',
    async execute({ sock, msg, args, from, config }) {
        try {
            if (!args.length) {
                return sock.sendMessage(from, { text: '❌ Please provide a Spotify track URL.' });
            }

            const url = args[0];
            const maxSize = config.MAX_FILE_SIZE || 50;

            await sendProgress(sock, from, 'download', 'Fetching Spotify track...');
            const filePath = await downloadSpotify(url);
            await sendProgress(sock, from, 'processing', 'Encoding...');

            validateFileSize(filePath, maxSize);

            await sendProgress(sock, from, 'uploading', 'Sending audio...');

            await sock.sendMessage(from, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                fileName: 'spotify_track.mp3'
            });

            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Spotify error:', error);
            await sock.sendMessage(from, { text: `❌ ${error.message}` });
        }
    }
};
