'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { File } = require('megajs');
const logger = require('./logger');
const chalk = require('chalk');

/**
 * sessionLoader — Restores creds.json from MEGA using the NEXUS___ session format
 * Format: SESSION_ID = "NEXUS___<mega_file_key>#<mega_hash>__<fingerprint>"
 * Example: NEXUS___GoRTGbpB#f6I2da9P4RWmMCEQmzm-Gb8K1jg-7c4jTtnj-HEP2Ls__MjU0MTAwODUzMzkx
 */

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 20_000;
const RETRY_BASE_DELAY_MS = 1_500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function redact(str, visible = 4) {
    if (!str) return '';
    if (str.length <= visible * 2) return '*'.repeat(str.length);
    return `${str.slice(0, visible)}...${str.slice(-visible)}`;
}

function parseSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return null;

    const trimmed = sessionId.trim().replace(/^["']|["']$/g, '');
    if (!trimmed.startsWith('NEXUS___')) return null;

    const withoutPrefix = trimmed.slice('NEXUS___'.length);
    const parts = withoutPrefix.split('__');
    if (parts.length < 2) return null;

    const megaKeyHash = parts[0];
    const fingerprint = parts.slice(1).join('__');

    if (!megaKeyHash || !megaKeyHash.includes('#')) return null;
    if (!fingerprint) return null;

    const [key, hash] = megaKeyHash.split('#');
    if (!key || !hash) return null;

    return { megaKeyHash, fingerprint };
}

function downloadOnce(megaUrl, timeoutMs) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error(`MEGA download timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
            const filer = File.fromURL(megaUrl);

            filer.loadAttributes((attrErr) => {
                if (settled) return;
                if (attrErr) {
                    settled = true;
                    clearTimeout(timer);
                    return reject(new Error(`attribute load failed: ${attrErr.message}`));
                }

                filer.download((err, data) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    if (err) return reject(new Error(`download failed: ${err.message}`));
                    if (!data || !data.length) return reject(new Error('download returned empty data'));
                    resolve(data);
                });
            });
        } catch (e) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(e);
        }
    });
}

async function downloadWithRetry(megaUrl, retries, timeoutMs) {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            logger.info(chalk.cyan(`[ 📦 ] Downloading session (attempt ${attempt}/${retries})...`));
            return await downloadOnce(megaUrl, timeoutMs);
        } catch (e) {
            lastErr = e;
            logger.warn(chalk.yellow(`[ ⚠️ ] Attempt ${attempt} failed: ${e.message}`));
            if (attempt < retries) {
                const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
                await sleep(delay);
            }
        }
    }
    throw lastErr;
}

async function atomicWrite(credsPath, data) {
    const dir = path.dirname(credsPath);
    const tmpPath = path.join(dir, `.creds.${crypto.randomBytes(6).toString('hex')}.tmp`);
    await fs.promises.writeFile(tmpPath, data);
    await fs.promises.rename(tmpPath, credsPath);
}

async function loadSession(sessionId, sessionDir, options = {}) {
    const retries = options.retries ?? DEFAULT_RETRIES;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const credsPath = path.join(sessionDir, 'creds.json');

    if (fs.existsSync(credsPath)) {
        logger.info(chalk.green('[ ✅ ] Session already exists, skipping download.'));
        return true;
    }

    try {
        await fs.promises.mkdir(sessionDir, { recursive: true });
    } catch (e) {
        logger.error(chalk.red('[ ❌ ] Could not create session directory:'), e.message);
        return false;
    }

    const parsed = parseSessionId(sessionId);
    if (!parsed) {
        logger.warn(chalk.yellow('[ ⚠️ ] Invalid SESSION_ID — expected format NEXUS___KEY#HASH__fingerprint'));
        logger.info(chalk.cyan('[ ℹ️ ] Falling back to QR code authentication...'));
        return false;
    }

    const { megaKeyHash, fingerprint } = parsed;
    const megaUrl = `https://mega.nz/file/${megaKeyHash}`;
    logger.info(chalk.cyan(`[ 📥 ] Restoring session (fingerprint ${redact(fingerprint)})...`));

    try {
        const data = await downloadWithRetry(megaUrl, retries, timeoutMs);

        try {
            JSON.parse(data.toString('utf8'));
        } catch {
            logger.error(chalk.red('[ ❌ ] Downloaded file is not valid JSON — refusing to save.'));
            return false;
        }

        await atomicWrite(credsPath, data);
        logger.info(chalk.green('[ ✅ ] Session downloaded and saved successfully.'));
        return true;
    } catch (e) {
        logger.error(chalk.red(`[ ❌ ] MEGA session restore failed after ${retries} attempts:`), e.message);
        logger.info(chalk.cyan('[ ℹ️ ] Falling back to QR code authentication...'));
        return false;
    }
}

module.exports = { loadSession, parseSessionId };
