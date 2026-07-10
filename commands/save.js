'use strict';

const fs = require('fs').promises;
const path = require('path');

module.exports = {
    name: 'save',
    aliases: ['savemessage', 'savechat', 'archive'],
    description: 'Save messages or content for later reference',
    
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { 
                text: '❌ Please provide content to save.\n\nExample: .save Important message to remember' 
            });
            return;
        }

        const content = args.join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '💾 Saving message...' });

        try {
            const timestamp = new Date().toISOString();
            const date = new Date().toLocaleDateString('en-US', { 
                timeZone: 'Africa/Nairobi',
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            const time = new Date().toLocaleTimeString('en-US', { 
                timeZone: 'Africa/Nairobi',
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });
            
            // Save to file
            const saveDir = path.join(__dirname, '../saved');
            await fs.mkdir(saveDir, { recursive: true });
            
            const dateStr = new Date().toISOString().split('T')[0];
            const saveFile = path.join(saveDir, `saved-${dateStr}.txt`);
            
            const entry = `\n[${timestamp}] [${date} ${time}]\n${content}\n${'='.repeat(50)}\n`;
            
            await fs.appendFile(saveFile, entry, 'utf8');
            
            const ms = Date.now() - start;
            
            // Get total saved count
            let savedCount = 0;
            try {
                const files = await fs.readdir(saveDir);
                for (const file of files) {
                    if (file.startsWith('saved-')) {
                        const stats = await fs.stat(path.join(saveDir, file));
                        if (stats.isFile()) {
                            const data = await fs.readFile(path.join(saveDir, file), 'utf8');
                            const matches = data.match(/\[/g);
                            if (matches) {
                                savedCount += matches.length;
                            }
                        }
                    }
                }
            } catch (err) {
                // Ignore counting errors
            }
            
            await sock.sendMessage(from, { 
                text: `✅ Message saved successfully!\n\n📝 Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n📅 Date: ${date}\n⏱ Time: ${time}\n📂 File: saved-${dateStr}.txt\n📊 Total saved: ${savedCount} messages\n⏱️ Response time: ${ms}ms` 
            });
            
        } catch (error) {
            console.error('Save command error:', error);
            await sock.sendMessage(from, { 
                text: `❌ Error saving message: ${error.message}` 
            });
        }
    }
};
