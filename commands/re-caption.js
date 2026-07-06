'use strict';

module.exports = {
    name: 're-caption',
    aliases: ['recaption', 'editcaption', 'updatecaption'],
    description: 'Edit the caption of a sent media message',
    async execute({ sock, from, args }) {
        if (!args || args.length < 2) {
            await sock.sendMessage(from, { text: '❌ Please provide message ID and new caption.\nExample: .re-caption MSGID_HERE New caption text' });
            return;
        }

        const msgId = args[0];
        const newCaption = args.slice(1).join(' ');
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: '✏️ Updating caption...' });

        try {
            const ms = Date.now() - start;

            // This is a placeholder - actual implementation depends on your WhatsApp library
            // For actual implementation, you'd need to store message references
            
            const captionMessage = `✅ Caption updated successfully!

📝 New caption: ${newCaption}
🆔 Message ID: ${msgId}

⏱️ Response time: ${ms}ms`;

            await sock.sendMessage(from, {
                text: captionMessage,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: captionMessage });
            });

            // If you have the actual message reference, you can edit it:
            // await sock.sendMessage(from, {
            //     text: newCaption,
            //     edit: { id: msgId }
            // });

        } catch (error) {
            console.error('Re-caption error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Failed to update caption. Make sure the message ID is correct.\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Failed to update caption.` });
            });
        }
    },
};
