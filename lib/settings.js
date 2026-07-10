
'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../database/settings.json');

let settings = {};

// Load settings from file
function loadSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            throw new Error('settings.json not found');
        }

        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        return settings;

    } catch (err) {
        console.error('[Settings] Failed to load settings:', err.message);
        settings = {};
        return settings;
    }
}

// Save settings to file
function saveSettings() {
    fs.writeFileSync(
        SETTINGS_FILE,
        JSON.stringify(settings, null, 2)
    );
}

// Get all settings
function getSettings() {
    return settings;
}

// Get one setting
function get(name) {
    return settings[name];
}

// Set a value
function set(name, value) {
    settings[name] = value;
    saveSettings();
}

// Toggle a value
function toggle(name) {
    if (typeof settings[name] !== 'boolean') {
        return null;
    }

    settings[name] = !settings[name];
    saveSettings();

    return settings[name];
}

// Load automatically when required
loadSettings();

module.exports = {
    loadSettings,
    saveSettings,
    getSettings,
    get,
    set,
    toggle
};
