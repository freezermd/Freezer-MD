// config.js
module.exports = {
  BOT_NAME: 'Freezer-MD',
  PREFIX: '.',
  SESSION_ID: 'session',
  SESSION_DIR: './sessions',
  OWNER_NUMBER: '254791553079',
  PUBLIC_MODE: true,
  
  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY || 'bb30864e187c4791a01c29db90a02b6d',
  BAD_WORDS: ['fuck', 'shit', 'asshole', 'bitch', 'cunt']  // add your list
};
