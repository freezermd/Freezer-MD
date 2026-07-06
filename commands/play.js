'use strict';

module.exports = {
    name: 'play',
    aliases: ['ytplay', 'musicplay'],
    description: 'Play music from YouTube',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a song name or URL.\nExample: .play Shape of You' });
            return;
        }

        const query = args.join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `🎵 Searching for "${query}"...` });

        try {
            // Using youtube-dl or ytdl-core
            const ytdl = require('ytdl-core');
            const search = require('youtube-search-api');
            
            const results = await search.GetListByKeyword(query, false, 1);
            
            if (!results.items || results.items.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No results found for "${query}"`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ No results found for "${query}"` });
                });
                return;
            }

            const video = results.items[0];
            const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
            const ms = Date.now() - start;

            const playMessage = `🎵 Now Playing

📌 Title: ${video.title}
🎤 Channel: ${video.channelTitle}
⏱️ Duration: ${video.length?.simpleText || 'Unknown'}
🔗 Link: ${videoUrl}

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: playMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: playMessage });
            });

            // Send audio
            try {
                const audioStream = ytdl(videoUrl, {
                    filter: 'audioonly',
                    quality: 'highestaudio'
                });

                await sock.sendMessage(from, {
                    audio: audioStream,
                    mimetype: 'audio/mp4',
                    fileName: `${video.title}.mp3`
                });
            } catch (audioError) {
                console.error('Audio stream error:', audioError);
                await sock.sendMessage(from, { 
                    text: `⚠️ Could not send audio file. Try downloading from: ${videoUrl}` 
                });
            }

        } catch (error) {
            console.error('Play command error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to play song.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to play song.` });
            });
        }
    },
};
