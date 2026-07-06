
'use strict';

module.exports = {
    name: 'weather',
    aliases: ['w', 'forecast'],
    description: 'Get current weather information for a city',
    async execute({ sock, from, args }) {
        // Check if city is provided
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a city name.\nExample: .weather London' });
            return;
        }

        const city = args.join(' ');
        const start = Date.now();

        // Send initial loading message
        const sent = await sock.sendMessage(from, { text: `🌤️ Fetching weather for ${city}...` });

        try {
            // Using wttr.in for free weather API (no API key required)
            const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C|%t|%w|%h|%p|%u`);
            const data = await response.text();
            
            if (data.includes('Unknown location')) {
                await sock.sendMessage(from, { 
                    text: `❌ City "${city}" not found. Please check the spelling and try again.`,
                    edit: sent.key 
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ City "${city}" not found. Please check the spelling and try again.` });
                });
                return;
            }

            const [condition, temp, wind, humidity, pressure, uv] = data.split('|').map(item => item.trim());
            
            const ms = Date.now() - start;
            const weatherMessage = `🌤️ Weather in ${city}

🌡️ Temperature: ${temp}
☁️ Condition: ${condition}
💨 Wind: ${wind}
💧 Humidity: ${humidity}
📊 Pressure: ${pressure}
☀️ UV Index: ${uv}

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, { 
                text: weatherMessage,
                edit: sent.key 
            }).catch(async () => {
                await sock.sendMessage(from, { text: weatherMessage });
            });

        } catch (error) {
            console.error('Weather API error:', error);
            const ms = Date.now() - start;
            
            await sock.sendMessage(from, { 
                text: `❌ Failed to fetch weather data for "${city}". Please try again later.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key 
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to fetch weather data for "${city}". Please try again later.` });
            });
        }
    },
};
