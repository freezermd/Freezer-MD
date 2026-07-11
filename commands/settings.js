'use strict';

const config = require('../config');

module.exports = {
    name: 'settings',
    aliases: ['setting', 'panel'],
    description: 'View current bot settings',
    ownerOnly: true,

    async execute({ sock, from }) {

        const status = (value) =>
            value === true || value === 'true'
                ? '🟢 ON'
                : '🔴 OFF';

        const text = `
⚙️ *FREEZER-MD OWNER PANEL*
━━━━━━━━━━━━━━━━━━

🤖 Bot Name
${config.BOT_NAME}

👑 Owner
${config.OWNER_NUMBER}

⌨️ Auto Typing
${status(config.AUTO_TYPING)}

🎤 Auto Recording
${status(config.AUTO_RECORDING)}

🟢 Always Online
${status(config.ALWAYS_ONLINE)}

👀 Auto View Status
${status(config.AUTO_VIEW_STATUS)}

🛡️ Anti Delete
${status(config.ANTI_DELETE)}

📌 Prefix
${config.PREFIX}

━━━━━━━━━━━━━━━━━━
Freezer-MD Control Panel
`;

        await sock.sendMessage(from, {
            text
        });

    }
};
