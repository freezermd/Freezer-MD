'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'set',
    aliases: ['toggle'],
    description: 'Change bot settings',
    ownerOnly: true,

    async execute({ sock, from, args }) {

        if (args.length < 2) {
            return await sock.sendMessage(from, {
                text:
`⚙️ Usage

.set typing on
.set typing off

.set recording on
.set online on
.set antidelete off
.set status on`
            });
        }

        const feature = args[0].toLowerCase();
        const value = args[1].toLowerCase();

        if (!['on', 'off'].includes(value)) {
            return await sock.sendMessage(from, {
                text: '❌ Value must be ON or OFF.'
            });
        }

        const envPath = path.join(process.cwd(), '.env');

        let env = fs.readFileSync(envPath, 'utf8');

        const bool = value === 'on' ? 'true' : 'false';

        const map = {
            typing: 'AUTO_TYPING',
            recording: 'AUTO_RECORDING',
            online: 'ALWAYS_ONLINE',
            antidelete: 'ANTI_DELETE',
            status: 'AUTO_VIEW_STATUS'
        };

        if (!map[feature]) {
            return await sock.sendMessage(from, {
                text: '❌ Unknown setting.'
            });
        }

        const key = map[feature];

        const regex = new RegExp(`${key}=.*`, 'g');

        if (regex.test(env)) {
            env = env.replace(regex, `${key}=${bool}`);
        } else {
            env += `\n${key}=${bool}`;
        }

        fs.writeFileSync(envPath, env);

        await sock.sendMessage(from, {
            text: `✅ ${feature.toUpperCase()} is now ${value.toUpperCase()}.\n\n♻️ Restart the bot to apply changes.`
        });
    }
};
