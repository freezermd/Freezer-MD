'use strict';

module.exports = {
    name: 'play2',
    aliases: ['ytdl', 'downloadmusic'],
    description: 'Download music from YouTube with quality options',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a song name or URL.\nExample: .play2 Shape of You\nOptions: .play2 [url] [quality]' });
            return;
        }

        const query = args[0];
        const quality = args[1] || 'medium';
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `🎵 Processing "${query}"...` });

        try {
            const ytdl = require('ytdl-core');
            const search = require('youtube-search-api');
            
            // Check if it's a URL or search query
            let videoUrl = query;
            let videoInfo;

            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
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
                videoUrl = `https://www.youtube.com/watch?v=${results.items[0].id}`;
                videoInfo = results.items[0];
            } else {
                videoInfo = await ytdl.getInfo(videoUrl);
            }

            const ms = Date.now() - start;
            
            const qualityMap = {
                low: 'lowestaudio',
                medium: 'mediumaudio',
                high: 'highestaudio'
            };

            const audioQuality = qualityMap[quality] || qualityMap.medium;

            const playMessage = `🎵 Downloading Music

📌 Title: ${videoInfo.title || 'Unknown'}
🎤 Channel: ${videoInfo.channelTitle || 'Unknown'}
📊 Quality: ${quality}
⏱️ Duration: ${videoInfo.lengthSeconds || 'Unknown'}s

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: playMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: playMessage });
            });

            const audioStream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: audioQuality
            });

            await sock.sendMessage(from, {
                audio: audioStream,
                mimetype: 'audio/mp4',
                fileName: `${videoInfo.title || 'audio'}.mp3`
            });

        } catch (error) {
            console.error('Play2 command error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to download music.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to download music.` });
            });
        }
    },
};
