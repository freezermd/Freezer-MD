// commands/storage.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'storage',
    aliases: ['disk'],
    category: 'system',
    description: 'Show disk storage usage',
    usage: '.storage',
    async execute({ sock, msg, args, from, config }) {
        try {
            // Get size of bot directory (simplified)
            const botDir = path.join(__dirname, '..');
            const size = await getDirectorySize(botDir);
            const sizeStr = formatBytes(size);

            // Try to get disk usage via df (Linux/Mac)
            const diskInfo = await getDiskUsage();

            let text = `💿 *Storage Usage*\n- Bot Directory: ${sizeStr}\n`;
            if (diskInfo) {
                text += `- Disk Usage: ${diskInfo}`;
            } else {
                text += `- Disk info not available (run on Linux).`;
            }
            await sock.sendMessage(from, { text });
        } catch (error) {
            console.error('Storage error:', error);
            await sock.sendMessage(from, { text: '❌ Failed to get storage info.' });
        }
    }
};

function getDirectorySize(dir) {
    return new Promise((resolve, reject) => {
        let totalSize = 0;
        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    walk(filePath);
                } else {
                    totalSize += stat.size;
                }
            }
        };
        try {
            walk(dir);
            resolve(totalSize);
        } catch (err) {
            reject(err);
        }
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function getDiskUsage() {
    return new Promise((resolve) => {
        exec('df -h /', (error, stdout) => {
            if (error) {
                resolve(null);
            } else {
                const lines = stdout.trim().split('\n');
                if (lines.length >= 2) {
                    const parts = lines[1].split(/\s+/);
                    if (parts.length >= 5) {
                        resolve(`Used ${parts[2]} of ${parts[1]} (${parts[4]})`);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            }
        });
    });
}
