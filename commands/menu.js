'use strict';

const { commands } = require('../lib/commandManager');
const menuSession = require('../lib/menuSession');
const menuUtils = require('../lib/menuUtils');

module.exports = {
    name: 'menu',
    aliases: ['help'],
    category: 'System',
    description: 'Interactive menu system',
    async execute({ sock, msg, args, from, config }) {
        try {
            const userJid = msg.key.participant || from;
            menuSession.deleteSession(userJid); // fresh start

            const menuText = menuUtils.buildMainMenu(commands, userJid);
            const sentMsg = await sock.sendMessage(from, { text: menuText });

            // Create session with the message key for reply detection
            menuSession.createSession(userJid, sentMsg.key);
        } catch (error) {
            console.error('[menu.js] Error:', error);
            throw error; // rethrow for handler to catch
        }
    }
};
