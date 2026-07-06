'use strict';

module.exports = {
    name: 'save',
    aliases: ['savemessage', 'savechat', 'archive'],
    description: 'Save messages or content for later reference',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide content to save.\nExample: .save Important message to remember' });
            return;
        }

        const content = args.join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '💾 Saving message...' });

        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const ms = Date.now() - start;
            const timestamp = new Date().toISOString();
            
            // Save to file
            const saveDir = path.join(__dirname, '../saved');
            await fs.mkdir(saveDir, { recursive: true });
            
            const saveFile = path.join(saveDir,
