// utils/db.js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.json');
const WARNINGS_PATH = path.join(__dirname, '..', 'warnings.json');

// Ensure DB files exist
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(WARNINGS_PATH)) {
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify({}, null, 2));
    }
}
initDB();

// Group settings (antilink, antibot, etc.)
function getGroupSettings(groupId) {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return data[groupId] || {};
}

function setGroupSetting(groupId, key, value) {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (!data[groupId]) data[groupId] = {};
    data[groupId][key] = value;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getGroupSetting(groupId, key, defaultValue) {
    const settings = getGroupSettings(groupId);
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

// Warnings
function getWarnings(groupId, userId) {
    const data = JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf-8'));
    if (!data[groupId]) data[groupId] = {};
    return data[groupId][userId] || [];
}

function addWarning(groupId, userId, reason, date) {
    const data = JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf-8'));
    if (!data[groupId]) data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = [];
    data[groupId][userId].push({ reason, date: date || new Date().toISOString() });
    fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
}

function resetWarnings(groupId, userId) {
    const data = JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf-8'));
    if (data[groupId] && data[groupId][userId]) {
        delete data[groupId][userId];
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
        return true;
    }
    return false;
}

function resetAllWarnings(groupId) {
    const data = JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf-8'));
    if (data[groupId]) {
        delete data[groupId];
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
        return true;
    }
    return false;
}

module.exports = {
    getGroupSettings,
    setGroupSetting,
    getGroupSetting,
    getWarnings,
    addWarning,
    resetWarnings,
    resetAllWarnings
};
