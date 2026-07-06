'use strict';

module.exports = {
    name: 'pinterest-dl',
    aliases: ['pindl', 'pinterestdl', 'pinterestdownload'],
    description: 'Download images and videos from Pinterest',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a Pinterest URL.\nExample: .pinterest-dl https://www.pinterest.com/pin/123456789' });
            return;
        }

        const url = args[0];
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '📥 Downloading from Pinterest...' });

        try {
            // Using a Pinterest downloader API (free)
            const response = await fetch(`https://api.pinterest.com/v1/pins/${url.split('/').pop()}?access_token=${process.env.PINTEREST_TOKEN || ''}`);
            const data = await response.json();
            const ms = Date.now() - start;

            if (!data || !data.data) {
                await sock.sendMessage(from, {
                    text: `❌ Failed to download content from Pinterest. Please check the URL.`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ Failed to download from Pinterest.` });
                });
                return;
            }

            const pinData = data.data;
            const imageUrl = pinData.image?.original?.url || pinData.image?.large?.url;
            const videoUrl = pinData.video?.url || pinData.video_versions?.[0]?.url;

            let mediaMessage = `📌 Pinterest Download\n\n📝 Title: ${pinData.note || 'No title'}\n🔗 URL: ${pinData.url}\n\n`;

            if (videoUrl) {
                mediaMessage += `📹 Video found!\n`;
                await sock.sendMessage(from, {
                    text: mediaMessage,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: mediaMessage });
                });

                // Send video
                await sock.sendMessage(from, {
                    video: { url: videoUrl },
                    caption: `📹 Pinterest Video\n⏱️ Response time: ${ms}ms`
                });
            } else if (imageUrl) {
                mediaMessage += `🖼️ Image found!\n⏱️ Response time: ${ms}ms`;
                
                await sock.sendMessage(from, {
                    text: mediaMessage,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: mediaMessage });
                });

                // Send image
                await sock.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: `🖼️ Pinterest Image\n⏱️ Response time: ${ms}ms`
                });
            } else {
                await sock.sendMessage(from, {
                    text: `❌ No media found in this pin.\n⏱️ Response time: ${ms}ms`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ No media found in this pin.` });
                });
            }

        } catch (error) {
            console.error('Pinterest download error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to download from Pinterest.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to download from Pinterest.` });
            });
        }
    },
};
