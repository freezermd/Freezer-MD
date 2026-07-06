'use strict';

module.exports = {
    name: 'prayertime',
    aliases: ['prayer', 'salah', 'namaz', 'times'],
    description: 'Get prayer times for a city',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a city name.\nExample: .prayertime London\nExample: .prayertime New York,US' });
            return;
        }

        const location = args.join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `🕌 Fetching prayer times for ${location}...` });

        try {
            // Using AlAdhan API (free)
            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(location)}&country=${args[1] || 'US'}&method=2`
            );

            const data = await response.json();
            const ms = Date.now() - start;

            if (!data.data || data.code !== 200) {
                await sock.sendMessage(from, {
                    text: `❌ Could not find prayer times for "${location}". Please check the city name.`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ Could not find prayer times for "${location}".` });
                });
                return;
            }

            const timings = data.data.timings;
            const date = data.data.date;
            
            const prayerMessage = `🕌 Prayer Times for ${location}

📅 Date: ${date.readable}

🌅 Fajr: ${timings.Fajr}
☀️ Sunrise: ${timings.Sunrise}
🌄 Dhuhr: ${timings.Dhuhr}
🌇 Asr: ${timings.Asr}
🌆 Maghrib: ${timings.Maghrib}
🌃 Isha: ${timings.Isha}
🕋 Imsak: ${timings.Imsak}
🌙 Midnight: ${timings.Midnight}

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: prayerMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: prayerMessage });
            });

        } catch (error) {
            console.error('Prayer time error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to fetch prayer times.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to fetch prayer times.` });
            });
        }
    },
};
