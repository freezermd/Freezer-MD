'use strict';
require('dotenv').config();

module.exports = {
    BOT_NAME: process.env.BOT_NAME || 'Freezer-MD',
    PREFIX: process.env.PREFIX || '.',
    SESSION_ID: process.env.SESSION_ID || '',
    SESSION_DIR: process.env.SESSION_DIR || './session',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '',
    PUBLIC_MODE: (process.env.PUBLIC_MODE || 'true') === 'true',
};
