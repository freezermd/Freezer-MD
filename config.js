// config.js (update your existing config.js)
module.exports = {
  BOT_NAME: 'Freezer-MD',
  PREFIX: '.',
  SESSION_ID: 'session',
  SESSION_DIR: './sessions',
  OWNER_NUMBER: '1234567890',
  PUBLIC_MODE: true,
NEWS_API_KEY: process.env.NEWS_API_KEY || '3cf44e2172724ffa912c56df48c93adc',
  
  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY || 'bb30864e187c4791a01c29db90a02b6d'
};
