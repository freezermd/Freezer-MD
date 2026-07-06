'use strict';

module.exports = {
    name: 'update',
    aliases: ['updates', 'checkupdate', 'version'],
    description: 'Check for bot updates and version information',
    async execute({ sock, from, args }) {
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '🔄 Checking for updates...' });

        try {
            // Current version from package.json (adjust path as needed)
            const currentVersion = process.env.npm_package_version || '1.0.0';
            
            // Check for updates from GitHub (if you're using GitHub)
            const REPO_OWNER = 'your-username';
            const REPO_NAME = 'your-repo-name';
            const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

            let latestVersion = currentVersion;
            let releaseNotes = 'No release notes available.';
            let updateAvailable = false;

            try {
                const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
                const response = await fetch(
                    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
                    { headers }
                );

                if (response.ok) {
                    const data = await response.json();
                    latestVersion = data.tag_name.replace('v', '');
                    releaseNotes = data.body || 'No release notes available.';
                    updateAvailable = latestVersion !== currentVersion;
                }
            } catch (githubError) {
                console.warn('GitHub API error:', githubError);
                // Continue with fallback data
            }

            const ms = Date.now() - start;

            const updateMessage = `🔄 Update Check

📦 Current Version: v${currentVersion}
📦 Latest Version: v${latestVersion}
${updateAvailable ? '🟢 Update Available!' : '✅ You\'re running the latest version!'}

📝 Release Notes:
${releaseNotes.substring(0, 500)}${releaseNotes.length > 500 ? '...' : ''}

${updateAvailable ? '🔽 To update, run: git pull && npm install' : ''}

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: updateMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: updateMessage });
            });

        } catch (error) {
            console.error('Update check error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to check for updates.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to check for updates.` });
            });
        }
    },
};
