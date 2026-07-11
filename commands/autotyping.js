'use strict';

const autoFeatures = require('../lib/autofeatures');

module.exports = {
    name: 'autotyping',
    aliases: ['typing'],
    description: 'Toggle auto typing',
    category: 'Owner',
    ownerOnly: true,

    async execute({ sock, from, args }) {

        if (!args[0]) {
            return sock.sendMessage(from, {
                text:
`⌨️ Auto Typing

Current:
${autoFeatures.autoTyping ? "✅ ON" : "❌ OFF"}

Usage

.autotyping on
.autotyping off`
            });
        }

        const state = args[0].toLowerCase();

        if (state === "on") {
            autoFeatures.autoTyping = true;
        }

        if (state === "off") {
            autoFeatures.autoTyping = false;
        }

        await sock.sendMessage(from, {
            text:
`✅ Auto Typing is now ${autoFeatures.autoTyping ? "ON" : "OFF"}`
        });

    }
};
