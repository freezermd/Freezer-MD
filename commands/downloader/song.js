// commands/downloader/song.js
module.exports = {
    name: 'song',
    aliases: ['audio'],
    category: 'downloader',
    description: 'Download audio from YouTube (search or URL)',
    usage: '.song <song name or URL>',
    // Re-use play logic or import
    async execute({ sock, msg, args, from, config }) {
        // We'll just redirect to play command
        const playCmd = require('./play');
        await playCmd.execute({ sock, msg, args, from, config });
    }
};
