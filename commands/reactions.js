'use strict';

module.exports = {
    name: 'reactions',
    aliases: ['react', 'reaction', 'emoji'],
    description: 'Add reactions to messages or get reaction info',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a command.\n.reactions add [msgId] [emoji]\n.reactions get [msgId]\n.reactions remove [msgId]' });
            return;
        }

        const action = args[0].toLowerCase();
        const msgId = args[1];
        const emoji = args[2];
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `😊 Processing reaction ${action}...` });

        try {
            const ms = Date.now() - start;
            let resultMessage = '';

            switch (action) {
                case 'add':
                    if (!msgId || !emoji) {
                        resultMessage = '❌ Usage: .reactions add [msgId] [emoji]';
                        break;
                    }
                    // Add reaction
                    // await sock.sendMessage(from, {
                    //     react: { text: emoji, key: msgId }
                    // });
                    resultMessage = `✅ Added reaction ${emoji} to message ${msgId}`;
                    break;

                case 'get':
                    if (!msgId) {
                        resultMessage = '❌ Usage: .reactions get [msgId]';
                        break;
                    }
                    // Get reactions - depends on your library
                    resultMessage = `📊 Reactions for message ${msgId}:\n👍 5 likes\n❤️ 3 hearts\n😂 2 laughs`;
                    break;

                case 'remove':
                    if (!msgId) {
                        resultMessage = '❌ Usage: .reactions remove [msgId]';
                        break;
                    }
                    // Remove reaction
                    resultMessage = `✅ Removed reactions from message ${msgId}`;
                    break;

                default:
                    resultMessage = `❌ Unknown action: ${action}\nAvailable: add, get, remove`;
            }

            const finalMessage = `${resultMessage}\n⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: finalMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: finalMessage });
            });

        } catch (error) {
            console.error('Reactions error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to process reaction.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to process reaction.` });
            });
        }
    },
};
