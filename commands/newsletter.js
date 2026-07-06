'use strict';

module.exports = {
    name: 'newsletter',
    aliases: ['news', 'latestnews'],
    description: 'Get latest news headlines',
    async execute({ sock, from, args }) {
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '📰 Fetching latest news...' });

        try {
            // Using NewsAPI (free tier available)
            const API_KEY = process.env.NEWS_API_KEY || 'YOUR_API_KEY_HERE';
            const category = args[0] || 'general';
            const country = 'us';
            
            const response = await fetch(
                `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${API_KEY}&pageSize=5`
            );

            const data = await response.json();
            const ms = Date.now() - start;

            if (!data.articles || data.articles.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No news found for category "${category}". Try: general, business, entertainment, health, science, sports, technology`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ No news found for category "${category}".` });
                });
                return;
            }

            let newsMessage = `📰 Latest News (${category.toUpperCase()})\n\n`;
            data.articles.slice(0, 5).forEach((article, index) => {
                newsMessage += `${index + 1}. 📌 ${article.title}\n`;
                newsMessage += `   📝 ${article.description || 'No description'}\n`;
                newsMessage += `   🔗 ${article.url}\n`;
                newsMessage += `   🏷️ ${article.source.name}\n\n`;
            });
            newsMessage += `⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: newsMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: newsMessage });
            });

        } catch (error) {
            console.error('News API error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to fetch news. Please try again later.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to fetch news. Please try again later.` });
            });
        }
    },
};
