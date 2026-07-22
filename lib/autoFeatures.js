// lib/autoFeatures.js
const fs = require('fs');
const path = require('path');
const { getGroupSetting, setGroupSetting } = require('../utils/db');

// ─── Database path for global features ────────────────────────────────
const FEATURES_PATH = path.join(__dirname, '..', 'features.json');

function loadFeatures() {
    if (!fs.existsSync(FEATURES_PATH)) {
        fs.writeFileSync(FEATURES_PATH, JSON.stringify({
            autobio: false,
            autobioText: '🤖 Bot is alive!',
            alwaysonline: false,
        }, null, 2));
    }
    return JSON.parse(fs.readFileSync(FEATURES_PATH, 'utf-8'));
}

function saveFeatures(data) {
    fs.writeFileSync(FEATURES_PATH, JSON.stringify(data, null, 2));
}

function getGlobalFeature(key) {
    const data = loadFeatures();
    return data[key];
}

function setGlobalFeature(key, value) {
    const data = loadFeatures();
    data[key] = value;
    saveFeatures(data);
}

// ─── Per-chat feature state ────────────────────────────────────────────
function isFeatureEnabled(chatId, feature) {
    // For groups, check group setting; for DMs, check global?
    // We'll treat DMs as global settings.
    if (chatId.endsWith('@g.us')) {
        return getGroupSetting(chatId, feature, false);
    } else {
        // For private chats, use a separate store? For simplicity, we'll use global.
        // But we can store in a private DB if needed. We'll use global for now.
        return getGlobalFeature(feature) || false;
    }
}

function setFeatureForChat(chatId, feature, value) {
    if (chatId.endsWith('@g.us')) {
        setGroupSetting(chatId, feature, value);
    } else {
        // For private chats, we store globally (or per user?)
        // We'll store per user in a separate map or use global.
        // To keep it simple, we'll use a global switch for DMs.
        // But we can use user-specific keys if we want.
        // We'll create a user-specific feature store.
        setUserFeature(chatId, feature, value);
    }
}

// ─── Private chat feature store ────────────────────────────────────────
const USER_FEATURES_PATH = path.join(__dirname, '..', 'user_features.json');

function loadUserFeatures() {
    if (!fs.existsSync(USER_FEATURES_PATH)) {
        fs.writeFileSync(USER_FEATURES_PATH, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(USER_FEATURES_PATH, 'utf-8'));
}

function saveUserFeatures(data) {
    fs.writeFileSync(USER_FEATURES_PATH, JSON.stringify(data, null, 2));
}

function getUserFeature(userId, feature) {
    const data = loadUserFeatures();
    if (!data[userId]) return false;
    return data[userId][feature] || false;
}

function setUserFeature(userId, feature, value) {
    const data = loadUserFeatures();
    if (!data[userId]) data[userId] = {};
    data[userId][feature] = value;
    saveUserFeatures(data);
}

function isFeatureEnabledForChat(chatId, feature) {
    if (chatId.endsWith('@g.us')) {
        return getGroupSetting(chatId, feature, false);
    } else {
        return getUserFeature(chatId, feature) || false;
    }
}

function setFeatureForChat(chatId, feature, value) {
    if (chatId.endsWith('@g.us')) {
        setGroupSetting(chatId, feature, value);
    } else {
        setUserFeature(chatId, feature, value);
    }
}

// ─── Auto actions ──────────────────────────────────────────────────────

async function sendTyping(sock, chatId, duration = 1000) {
    if (!isFeatureEnabledForChat(chatId, 'autotyping')) return;
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, duration));
    } catch (e) {
        console.error('AutoTyping error:', e);
    }
}

async function sendRecording(sock, chatId, duration = 1500) {
    if (!isFeatureEnabledForChat(chatId, 'autorecord')) return;
    try {
        await sock.sendPresenceUpdate('recording', chatId);
        await new Promise(resolve => setTimeout(resolve, duration));
    } catch (e) {
        console.error('AutoRecord error:', e);
    }
}

async function autoReact(sock, msg, chatId) {
    if (!isFeatureEnabledForChat(chatId, 'autoreact')) return;
    // React with a random emoji
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '💯', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    try {
        await sock.sendMessage(chatId, {
            react: { text: randomEmoji, key: msg.key }
        });
    } catch (e) {
        console.error('AutoReact error:', e);
    }
}

async function autoRead(sock, msg, chatId) {
    if (!isFeatureEnabledForChat(chatId, 'autoread')) return;
    try {
        await sock.readMessages([msg.key]);
    } catch (e) {
        console.error('AutoRead error:', e);
    }
}

// ─── Always Online (presence) ─────────────────────────────────────────
async function setAlwaysOnline(sock) {
    if (getGlobalFeature('alwaysonline')) {
        try {
            await sock.sendPresenceUpdate('available');
        } catch (e) {
            console.error('AlwaysOnline error:', e);
        }
    }
}

// ─── Auto Bio ─────────────────────────────────────────────────────────
async function updateBio(sock) {
    if (!getGlobalFeature('autobio')) return;
    const bio = getGlobalFeature('autobioText') || '🤖 Freezer-MD bot | Always online';
    try {
        await sock.updateProfileStatus(bio);
    } catch (e) {
        console.error('AutoBio error:', e);
    }
}

// ─── Auto Status View ──────────────────────────────────────────────────
async function autoStatusView(sock, statusUpdate) {
    // statusUpdate contains the status message
    // We need to mark it as viewed.
    // This requires listening to status updates.
    // We'll implement via event listener.
    // For now, we'll export a handler.
}

module.exports = {
    loadFeatures,
    saveFeatures,
    getGlobalFeature,
    setGlobalFeature,
    isFeatureEnabledForChat,
    setFeatureForChat,
    sendTyping,
    sendRecording,
    autoReact,
    autoRead,
    setAlwaysOnline,
    updateBio,
    autoStatusView,
};
