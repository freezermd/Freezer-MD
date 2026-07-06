'use strict';

module.exports = {
    name: 'repo-search',
    aliases: ['reposearch', 'githubsearch', 'searchrepo'],
    description: 'Search for GitHub repositories',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a search query.\nExample: .repo-search discord bot\nExample: .repo-search javascript stars:>100' });
            return;
        }

        const query = args.join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `🔍 Searching GitHub for "${query}"...` });

        try {
            const response = await fetch(
                `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`
            );

            const data = await response.json();
            const ms = Date.now() - start;

            if (!data.items || data.items.length === 0) {
                await sock.sendMessage(from, {
                    text: `❌ No repositories found for "${query}"`,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: `❌ No repositories found for "${query}"` });
                });
                return;
            }

            let repoMessage = `🔍 GitHub Repositories\n🔎 Query: "${query}"\n📊 Found: ${data.total_count} results\n\n`;
            
            data.items.slice(0, 5).forEach((repo, index) => {
                repoMessage += `${index + 1}. 📦 ${repo.name}\n`;
                repoMessage += `   📝 ${repo.description || 'No description'}\n`;
                repoMessage += `   ⭐ ${repo.stargazers_count} ★ ${repo.forks_count} 🔀\n`;
                repoMessage += `   🔗 ${repo.html_url}\n`;
                repoMessage += `   🏷️ ${repo.language || 'N/A'}\n\n`;
            });
            
            repoMessage += `⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: repoMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: repoMessage });
            });

        } catch (error) {
            console.error('Repo search error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to search repositories.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to search repositories.` });
            });
        }
    },
};
