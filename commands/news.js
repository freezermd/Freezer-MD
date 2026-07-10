// commands/news.js
const NewsAPI = require('../lib/newsApi');

module.exports = {
    name: 'news',
    aliases: ['headline', 'headlines'],
    description: 'Get latest news headlines and search news',

    async execute({ sock, msg, from, args, config }) {
        try {
            const api = new NewsAPI();
            const subCommand = args[0]?.toLowerCase() || '';
            const query = args.slice(1).join(' ');

            let response = '';

            if (subCommand === 'help' || (subCommand === '' && args.length === 0)) {
                response = getHelpMessage();
            } else if (subCommand === 'sports' || subCommand === 'business' || 
                       subCommand === 'technology' || subCommand === 'entertainment' ||
                       subCommand === 'health' || subCommand === 'science') {
                response = await handleCategory(api, subCommand);
            } else if (subCommand === 'search') {
                response = await handleSearch(api, query);
            } else if (subCommand === 'sources') {
                response = await handleSources(api, query);
            } else {
                response = await handleTopHeadlines(api);
            }

            if (response.length > 4096) {
                const chunks = splitMessage(response);
                for (const chunk of chunks) {
                    await sock.sendMessage(from, { text: chunk });
                }
            } else {
                await sock.sendMessage(from, { text: response });
            }
        } catch (error) {
            console.error('News command error:', error);
            await sock.sendMessage(from, {
                text: `❌ Error: ${error.message || 'Failed to fetch news'}\n\nPlease try again later or check your API key.`
            });
        }
    }
};

function splitMessage(text) {
    const chunks = [];
    let currentChunk = '';
    const lines = text.split('\n');

    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > 4096) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
        currentChunk += line + '\n';
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

function getHelpMessage() {
    return `📰 NEWS COMMANDS
━━━━━━━━━━━━━━━━━━━━━━

📋 Available Commands:

📰 Latest Headlines
.news

📂 Categories
.news sports
.news business
.news technology
.news entertainment
.news health
.news science

🔍 Search News
.news search [query]
Example: .news search Arsenal

📡 News Sources
.news sources

ℹ️ Help
.news help

🌍 Countries:
US, GB, KE, NG, ZA, CA, AU, IN, DE, FR, IT, JP, BR, MX, RU, SA, AE, EG

Examples:
.news
.news sports
.news search football
.news sources

Powered by NewsAPI.org 📰`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return date.toLocaleDateString('en-US', options);
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getCategoryEmoji(category) {
    const emojis = {
        'sports': '⚽',
        'business': '💼',
        'technology': '💻',
        'entertainment': '🎬',
        'health': '🏥',
        'science': '🔬',
        'general': '📰'
    };
    return emojis[category] || '📰';
}

function getNumberEmoji(index) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[index] || `${index + 1}.`;
}

async function handleTopHeadlines(api) {
    const articles = await api.getTopHeadlines('us', null, 10);

    if (!articles || articles.length === 0) {
        return '📰 No headlines available at the moment. Please try again later.';
    }

    let response = '📰 TOP HEADLINES\n━━━━━━━━━━━━━━━━━━━━━━\n';

    for (let i = 0; i < Math.min(articles.length, 10); i++) {
        const article = articles[i];
        const title = article.title || 'Untitled';
        const source = article.source?.name || 'Unknown Source';
        const publishedAt = article.publishedAt ? formatDate(article.publishedAt) : 'Unknown Date';
        const url = article.url || '#';
        const description = article.description ? truncateText(article.description, 150) : '';

        response += `\n${getNumberEmoji(i)} ${source}`;
        response += `\n📌 ${title}`;
        if (description) {
            response += `\n📝 ${description}`;
        }
        response += `\n📅 ${publishedAt}`;
        response += `\n🔗 ${url}`;
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }

    return response;
}

async function handleCategory(api, category) {
    const emoji = getCategoryEmoji(category);
    const articles = await api.getCategory(category, 'us', 10);

    if (!articles || articles.length === 0) {
        return `${emoji} No ${category} news available at the moment. Please try again later.`;
    }

    let response = `${emoji} ${category.toUpperCase()} NEWS\n━━━━━━━━━━━━━━━━━━━━━━\n`;

    for (let i = 0; i < Math.min(articles.length, 10); i++) {
        const article = articles[i];
        const title = article.title || 'Untitled';
        const source = article.source?.name || 'Unknown Source';
        const publishedAt = article.publishedAt ? formatDate(article.publishedAt) : 'Unknown Date';
        const url = article.url || '#';
        const description = article.description ? truncateText(article.description, 120) : '';

        response += `\n${getNumberEmoji(i)} ${source}`;
        response += `\n📌 ${title}`;
        if (description) {
            response += `\n📝 ${description}`;
        }
        response += `\n📅 ${publishedAt}`;
        response += `\n🔗 ${url}`;
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }

    return response;
}

async function handleSearch(api, query) {
    if (!query || query.trim().length === 0) {
        return '❌ Please specify a search query.\n\nUsage: .news search [query]\nExample: .news search football';
    }

    const articles = await api.searchNews(query, 10);

    if (!articles || articles.length === 0) {
        return `🔍 No news found for "${query}". Please try a different search term.`;
    }

    let response = `🔍 SEARCH RESULTS: "${query}"\n━━━━━━━━━━━━━━━━━━━━━━\n`;

    for (let i = 0; i < Math.min(articles.length, 10); i++) {
        const article = articles[i];
        const title = article.title || 'Untitled';
        const source = article.source?.name || 'Unknown Source';
        const publishedAt = article.publishedAt ? formatDate(article.publishedAt) : 'Unknown Date';
        const url = article.url || '#';
        const description = article.description ? truncateText(article.description, 120) : '';

        response += `\n${getNumberEmoji(i)} ${source}`;
        response += `\n📌 ${title}`;
        if (description) {
            response += `\n📝 ${description}`;
        }
        response += `\n📅 ${publishedAt}`;
        response += `\n🔗 ${url}`;
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }

    return response;
}

async function handleSources(api, country) {
    const sources = await api.getSources(country || null, null);

    if (!sources || sources.length === 0) {
        return '📡 No news sources available. Please try again later.';
    }

    let response = '📡 NEWS SOURCES\n━━━━━━━━━━━━━━━━━━━━━━\n';

    const sortedSources = sources.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < Math.min(sortedSources.length, 20); i++) {
        const source = sortedSources[i];
        const name = source.name || 'Unknown';
        const category = source.category || 'General';
        const countryCode = source.country ? source.country.toUpperCase() : 'US';
        const description = source.description ? truncateText(source.description, 80) : '';

        response += `\n${getNumberEmoji(i)} ${name}`;
        response += `\n   📂 ${category.toUpperCase()} | 🌍 ${countryCode}`;
        if (description) {
            response += `\n   📝 ${description}`;
        }
        response += '\n━━━━━━━━━━━━━━━━━━━━━━';
    }

    return response;
}
