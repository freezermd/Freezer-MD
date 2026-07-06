'use strict';

module.exports = {
    name: 'prank-fun',
    aliases: ['prank', 'funprank', 'joke'],
    description: 'Send fun prank messages to friends',
    async execute({ sock, from, args }) {
        if (!args || args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Please provide a phone number or @mention.\nExample: .prank-fun @username' });
            return;
        }

        const target = args[0];
        const prankType = args[1]?.toLowerCase() || 'random';
        const start = Date.now();

        const sent = await sock.sendMessage(from, { text: `🎭 Preparing prank for ${target}...` });

        try {
            const ms = Date.now() - start;

            const pranks = {
                'ghost': {
                    message: `👻 BOO! I'm a ghost! But seriously, just kidding! 😂 
You should've seen your face (if I could see it)! 🎭`,
                    reaction: '👻'
                },
                'win': {
                    message: `🎉 CONGRATULATIONS! You just won 10,000,000 dollars! 💰
Just kidding! But imagine if that was real, right? 😂`,
                    reaction: '🎉'
                },
                'wrong': {
                    message: `📱 WRONG NUMBER! 
Wait... actually it's the right number. Just wanted to mess with you! 🤡
Hope you're having a good day! 🌟`,
                    reaction: '🤡'
                },
                'virus': {
                    message: `⚠️ VIRUS DETECTED! 
Your phone has 999,999,999 viruses! 
...Just kidding! April Fools came early! 😂
Stay safe though! 🛡️`,
                    reaction: '🛡️'
                }
            };

            let prank;
            if (prankType === 'random') {
                const keys = Object.keys(pranks);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                prank = pranks[randomKey];
            } else {
                prank = pranks[prankType] || pranks['random'];
            }

            // Try to send prank
            if (target.startsWith('@')) {
                // Mention prank
                const prankMessage = `${target} ${prank.message}\n\n⏱️ Response time: ${ms}ms`;
                await sock.sendMessage(from, {
                    text: prankMessage,
                    mentions: [target.replace('@', '')]
                });
            } else if (target.startsWith('0') || target.startsWith('+')) {
                // Send to specific number
                const prankMessage = `${prank.message}\n\n⏱️ Response time: ${ms}ms`;
                await sock.sendMessage(from, {
                    text: prankMessage,
                    edit: sent.key
                }).catch(async () => {
                    // Also send to target if possible
                    try {
                        await sock.sendMessage(target, { text: prank.message });
                    } catch (e) {
                        // Silent fail
                    }
                    await sock.sendMessage(from, { text: prankMessage });
                });
            } else {
                // Just send in chat
                const prankMessage = `${prank.message}\n\n⏱️ Response time: ${ms}ms`;
                await sock.sendMessage(from, {
                    text: prankMessage,
                    edit: sent.key
                }).catch(async () => {
                    await sock.sendMessage(from, { text: prankMessage });
                });
            }

        } catch (error) {
            console.error('Prank error:', error);
            const ms = Date.now() - start;

            await sock.sendMessage(from, {
                text: `❌ Prank failed. Are you sure the target exists?\n⏱️ Response time: ${ms}ms`,
                edit: sent.key
            }).catch(async () => {
                await sock.sendMessage(from, { text: `❌ Prank failed. Please try again.` });
            });
        }
    },
};
