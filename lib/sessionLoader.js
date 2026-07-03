'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const chalk = require('chalk');
const logger = require('./logger');

/**
 * sessionLoader — Restores creds.json from a self-contained base64+gzip SESSION_ID.
 *
 * Format: SESSION_ID = "<PREFIX>~<base64(gzip(creds.json))>"
 * The prefix is cosmetic/branding only and is stripped before decoding.
 * Recognized prefixes (stripped, case-sensitive): "FREEZER-MD~", "SILA-MD~", "NEXUS___"
 *
 * No external network call is needed — everything required to restore the
 * session is embedded directly in the SESSION_ID string.
 */

const KNOWN_PREFIXES = ['FREEZER-MD~', 'SILA-MD~', 'NEXUS___'];

/**
 * Strips any recognized branding prefix from the raw SESSION_ID.
 */
function stripPrefix(raw) {
    let value = raw.trim();
    for (const prefix of KNOWN_PREFIXES) {
        if (value.startsWith(prefix)) {
            value = value.slice(prefix.length);
            break;
        }
    }
    return value.trim();
}

/**
 * Decodes a base64+gzip SESSION_ID into a raw creds.json buffer.
 * Returns { ok: true, data } or { ok: false, reason }.
 */
function decodeSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
        return { ok: false, reason: 'SESSION_ID is empty' };
    }

    const sessdata = stripPrefix(sessionId);
    if (!sessdata) {
        return { ok: false, reason: 'SESSION_ID is empty after stripping prefix' };
    }

    let compressedBuffer;
    try {
        compressedBuffer = Buffer.from(sessdata, 'base64');
        if (!compressedBuffer.length) throw new Error('decoded buffer is empty');
    } catch (e) {
        return { ok: false, reason: `invalid base64: ${e.message}` };
    }

    let sessionBuffer;
    try {
        sessionBuffer = zlib.gunzipSync(compressedBuffer);
    } catch (e) {
        return { ok: false, reason: `gunzip failed (corrupt or non-gzip data): ${e.message}` };
    }

    try {
        JSON.parse(sessionBuffer.toString('utf8'));
    } catch (e) {
        return { ok: false, reason: `decoded data is not valid JSON: ${e.message}` };
    }

    return { ok: true, data: sessionBuffer };
}

/**
 * Writes data to credsPath atomically: write to a temp file in the same
 * directory, then rename. This avoids ever leaving a half-written creds.json
 * behind if the process crashes mid-write.
 */
async function atomicWrite(credsPath, data) {
    const dir = path.dirname(credsPath);
    const tmpPath = path.join(dir, `.creds.${crypto.randomBytes(6).toString('hex')}.tmp`);
    await fs.promises.writeFile(tmpPath, data);
    await fs.promises.rename(tmpPath, credsPath);
}

async function loadSession(sessionId, sessionDir) {
    const credsPath = path.join(sessionDir, 'creds.json');

    if (fs.existsSync(credsPath)) {
        logger.info(chalk.green('[ ✅ ] Session already exists, skipping extraction.'));
        return true;
    }

    try {
        await fs.promises.mkdir(sessionDir, { recursive: true });
    } catch (e) {
        logger.error(chalk.red('[ ❌ ] Could not create session directory:'), e.message);
        return false;
    }

    if (!sessionId || sessionId.trim() === '') {
        logger.error(chalk.red('[ ❌ ] Please add your session to SESSION_ID in .env'));
        return false;
    }

    logger.info(chalk.cyan('[ 📥 ] Extracting session from base64 string...'));

    const result = decodeSessionId(sessionId);
    if (!result.ok) {
        logger.error(chalk.red('[ ❌ ] Failed to extract session:'), result.reason);
        logger.warn(chalk.yellow('[ ⚠️ ] Make sure you copied the FULL session string.'));
        return false;
    }

    try {
        await atomicWrite(credsPath, result.data);
        logger.info(chalk.green('[ ✅ ] Session extracted and saved successfully.'));
        logger.info(chalk.cyan(`[ 📊 ] Session size: ${result.data.length} bytes`));
        return true;
    } catch (e) {
        logger.error(chalk.red('[ ❌ ] Failed to write creds.json:'), e.message);
        return false;
    }
}

/**
 * Encodes a creds.json buffer/string into a SESSION_ID string, for generating
 * new session strings (e.g. in a "get session ID" pairing script).
 */
function encodeSessionId(credsData, prefix = 'FREEZER-MD~') {
    const buf = Buffer.isBuffer(credsData) ? credsData : Buffer.from(credsData);
    const gzipped = zlib.gzipSync(buf);
    return `${prefix}${gzipped.toString('base64')}`;
}

module.exports = { loadSession, decodeSessionId, encodeSessionId };
