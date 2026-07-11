'use strict';

module.exports = {
    name: 'shutdown',
    aliases: ['off', 'stop'],
    description: 'Turn off the bot',
    ownerOnly: true,

    async execute({ sock, from }) {

        await sock.sendMessage(from, {
            text: '🛑 Freezer-MD is shutting down...'
        });

        setTimeout(() => {
            process.exit(1);
        }, 2000);
    }
};
