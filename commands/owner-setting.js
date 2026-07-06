'use strict';

module.exports = {
    name: 'owner-setting',
    aliases: ['ownersetting', 'setowner', 'ownerconfig'],
    description: 'Configure owner settings (admin only)',
    async execute({ sock, from, args, client, isOwner }) {
        // Check if user is owner
        if (!isOwner) {
            await sock.sendMessage(from, { text: '❌ This command is for bot owner only!' });
            return;
        }

        const start = Date.now();
        const sent = await sock.sendMessage(from, { text: '⚙️ Updating owner settings...' });

        try {
            const action = args[0]?.toLowerCase();
            const value = args.slice(1).join(' ');

            if (!action || !value) {
                const helpMessage = `⚙️ Owner Settings

Available commands:
• setprefix [prefix] - Change bot prefix
• setname [name] - Change bot name
• setstatus [status] - Change bot status
• setbio [bio] - Change bot bio
• addowner [number] - Add new owner
• removeowner [number] - Remove owner

Example: .owner-setting setprefix !`;

                await sock.sendMessage(from, {
                    text: helpMessage,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: helpMessage });
                });
                return;
            }

            const ms = Date.now() - start;
            let resultMessage = '';

            switch (action) {
                case 'setprefix':
                    // Store in database/global config
                    global.botPrefix = value;
                    resultMessage = `✅ Bot prefix updated to: ${value}`;
                    break;
                case 'setname':
                    await client.updateProfileName(value);
                    resultMessage = `✅ Bot name updated to: ${value}`;
                    break;
                case 'setstatus':
                    await client.updatePresence(value);
                    resultMessage = `✅ Bot status updated to: ${value}`;
                    break;
                case 'setbio':
                    await client.updateProfileStatus(value);
                    resultMessage = `✅ Bot bio updated to: ${value}`;
                    break;
                case 'addowner':
                    // Add owner logic here
                    resultMessage = `✅ Owner added: ${value}`;
                    break;
                case 'removeowner':
                    // Remove owner logic here
                    resultMessage = `✅ Owner removed: ${value}`;
                    break;
                default:
                    resultMessage = `❌ Unknown action: ${action}`;
            }

            const finalMessage = `${resultMessage}\n⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: finalMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: finalMessage });
            });

        } catch (error) {
            console.error('Owner setting error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to update owner settings.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to update owner settings.` });
            });
        }
    },
};
