
'use strict';

const config = require('../config');

module.exports = {
    name: 'settings',
    aliases: ['setting', 'config'],
    description: 'Show bot settings',
    ownerOnly: true,

    async execute({ sock, from }) {

        const status = (value) => value ? '🟢 ON' : '🔴 OFF';

        const message = `⚙️ FREEZER-MD SETTINGS
━━━━━━━━━━━━━━━━━━

🤖 Bot Name
${config.BOT_NAME}

📌 Prefix
${config.PREFIX}

👑 Owner
${config.OWNER_NUMBER}

━━━━━━━━━━━━━━━━━━
FEATURES

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

━━━━━━━━━━━━━━━━━━
Use future commands to change settings.

🧊 Freezer-MD`;

        await sock.sendMessage(from, { text: message });
    }
};
