// config.js (update your existing config.js)
module.exports = {
  BOT_NAME: 'MyBot',
  PREFIX: '.',
  SESSION_ID: 'session',
  SESSION_DIR: './sessions',
  OWNER_NUMBER: '1234567890',
  PUBLIC_MODE: true,
  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY || 'YOUR_API_KEY_HERE'
};
