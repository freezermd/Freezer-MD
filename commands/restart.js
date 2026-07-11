'use strict';

module.exports = {
    name: 'restart',
    aliases: ['reboot'],
    description: 'Restart the bot',
    ownerOnly: true,

    async execute({ sock, from }) {

        await sock.sendMessage(from, {
            text: '♻️ Restarting Freezer-MD...\n\nPlease wait a few seconds.'
        });

        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
};
