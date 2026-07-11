'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const commands = new Map();

/**
 * Load all command files from the 'commands' directory
 * @returns {Map} The commands Map
 */
function loadCommands() {
    const dir = path.join(__dirname, '..', 'commands');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
        try {
            const cmd = require(path.join(dir, file));
            if (!cmd.name || typeof cmd.execute !== 'function') {
                logger.warn(`[ ⚠️ ] Skipping ${file} — missing "name" or "execute"`);
                continue;
            }
            commands.set(cmd.name.toLowerCase(), cmd);
            (cmd.aliases || []).forEach((alias) => commands.set(alias.toLowerCase(), cmd));
        } catch (e) {
            logger.error(`[ ❌ ] Failed to load command ${file}:`, e.message);
        }
    }

    logger.info(`[ ✅ ] Loaded ${commands.size} command(s)`);
    return commands;
}

module.exports = { commands, loadCommands };
