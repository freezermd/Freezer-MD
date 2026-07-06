'use strict';

module.exports = {
    name: 'rw-tool',
    aliases: ['rw', 'readwrite', 'tools'],
    description: 'Read and write files on the server (owner only)',
    async execute({ sock, from, args, isOwner }) {
        if (!isOwner) {
            await sock.sendMessage(from, { text: '❌ This command is for bot owner only!' });
            return;
        }

        if (!args || args.length < 2) {
            await sock.sendMessage(from, { text: '❌ Usage:\n.rw-tool read [filepath]\n.rw-tool write [filepath] [content]\n.rw-tool list [directory]' });
            return;
        }

        const action = args[0].toLowerCase();
        const filepath = args[1];
        const content = args.slice(2).join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `📂 Processing ${action} on ${filepath}...` });

        try {
            const fs = require('fs').promises;
            const path = require('path');
            const ms = Date.now() - start;
            let resultMessage = '';

            switch (action) {
                case 'read':
                    if (!filepath) {
                        resultMessage = '❌ Please specify a file to read';
                        break;
                    }
                    const data = await fs.readFile(filepath, 'utf8');
                    const preview = data.length > 1000 ? data.substring(0, 1000) + '...' : data;
                    resultMessage = `📄 File: ${filepath}\n\n${preview}\n\n📊 Size: ${data.length} characters`;
                    break;

                case 'write':
                    if (!filepath || !content) {
                        resultMessage = '❌ Usage: .rw-tool write [filepath] [content]';
                        break;
                    }
                    await fs.writeFile(filepath, content, 'utf8');
                    resultMessage = `✅ File written: ${filepath}\n📝 Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
                    break;

                case 'list':
                    if (!filepath) {
                        resultMessage = '❌ Please specify a directory to list';
                        break;
                    }
                    const files = await fs.readdir(filepath);
                    const fileList = files.map(f => `📄 ${f}`).join('\n');
                    resultMessage = `📁 Directory: ${filepath}\n\n${fileList || 'Empty directory'}\n\n📊 Total: ${files.length} items`;
                    break;

                default:
                    resultMessage = `❌ Unknown action: ${action}\nAvailable: read, write, list`;
            }

            const finalMessage = `${resultMessage}\n⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: finalMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: finalMessage });
            });

        } catch (error) {
            console.error('RW Tool error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to process file operation.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to process file operation.` });
            });
        }
    },
};
