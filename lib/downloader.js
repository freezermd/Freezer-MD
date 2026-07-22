// lib/downloader.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');
const Spotify = require('spotifydl').default;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Validate file size
 */
function validateFileSize(filePath, maxMB) {
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB > maxMB) {
        fs.unlinkSync(filePath);
        throw new Error(`File too large (${sizeMB.toFixed(1)}MB). Max: ${maxMB}MB`);
    }
    return true;
}

/**
 * Progress message helper
 */
async function sendProgress(sock, from, step, detail = '') {
    const emojis = {
        download: '📥',
        processing: '⚙️',
        uploading: '📤',
        done: '✅'
    };
    const emoji = emojis[step] || '⏳';
    const msg = `${emoji} ${step.charAt(0).toUpperCase() + step.slice(1)}... ${detail}`.trim();
    await sock.sendMessage(from, { text: msg });
}

/**
 * YouTube Audio Download (best audio)
 */
async function downloadYouTubeAudio(url, quality = '128') {
    const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25,
    });
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writeStream = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        audioStream.pipe(writeStream);
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
        audioStream.on('error', reject);
    });
}

/**
 * YouTube Video Download (audio + video)
 */
async function downloadYouTubeVideo(url, quality = '720') {
    const videoStream = ytdl(url, {
        quality: `highestvideo`,
        filter: 'audioandvideo',
        highWaterMark: 1 << 25,
    });
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writeStream = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        videoStream.pipe(writeStream);
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
        videoStream.on('error', reject);
    });
}

/**
 * YouTube Search and get first result
 */
async function searchYouTube(query) {
    const result = await ytSearch(query);
    return result.videos.length ? result.videos[0] : null;
}

/**
 * TikTok Download
 */
async function downloadTikTok(url) {
    // Using public API (replace with your preferred service)
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    if (response.data.code !== 0) throw new Error('TikTok download failed');
    const data = response.data.data;
    const videoUrl = data.play || data.wmplay || data.hdplay;
    if (!videoUrl) throw new Error('No video URL found');
    const fileName = `tiktok_${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writer = fs.createWriteStream(filePath);
    const videoResponse = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
    videoResponse.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

/**
 * Facebook Download
 */
async function downloadFacebook(url) {
    // Using public API (example: fbdown.net)
    const apiUrl = `https://fbdl.tiremods.xyz/api?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    if (!response.data.success) throw new Error('Facebook download failed');
    const videoUrl = response.data.downloadLink || response.data.hd;
    if (!videoUrl) throw new Error('No video URL');
    const fileName = `facebook_${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writer = fs.createWriteStream(filePath);
    const videoResponse = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
    videoResponse.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

/**
 * Instagram Download
 */
async function downloadInstagram(url) {
    // Using public API (example: instagram-downloader)
    const apiUrl = `https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`;
    // Note: You'll need to sign up for RapidAPI or use another free API.
    // For demonstration, we'll use a simple scraper (not reliable).
    // We'll provide a placeholder that throws an error.
    throw new Error('Instagram download not implemented. Please provide your own API key.');
}

/**
 * Twitter Download
 */
async function downloadTwitter(url) {
    // Using public API (example: twdown.net)
    const apiUrl = `https://twdownload.vercel.app/api/download?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    if (!response.data.success) throw new Error('Twitter download failed');
    const videoUrl = response.data.media[0]?.url;
    if (!videoUrl) throw new Error('No video URL');
    const fileName = `twitter_${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writer = fs.createWriteStream(filePath);
    const videoResponse = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
    videoResponse.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

/**
 * MediaFire Download
 */
async function downloadMediaFire(url) {
    // Using public API (example: mediafire-downloader)
    const apiUrl = `https://api.mediafire.com/v1/quick/key?url=${encodeURIComponent(url)}`;
    // Note: MediaFire API requires a developer key.
    // We'll use a simple scraper with axios and cheerio.
    // This is a placeholder.
    throw new Error('MediaFire download requires API key. Please implement your own.');
}

/**
 * Spotify Download (audio)
 */
async function downloadSpotify(url) {
    // Using spotifydl library
    const spotify = new Spotify();
    const audioStream = await spotify.downloadTrack(url);
    const fileName = `spotify_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writer = fs.createWriteStream(filePath);
    audioStream.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

/**
 * Pinterest Download (image or video)
 */
async function downloadPinterest(url) {
    // Using public API (example: pinterest-downloader)
    const apiUrl = `https://pinterest-downloader.herokuapp.com/api?url=${encodeURIComponent(url)}`;
    // Placeholder
    throw new Error('Pinterest download not implemented.');
}

module.exports = {
    downloadYouTubeAudio,
    downloadYouTubeVideo,
    searchYouTube,
    downloadTikTok,
    downloadFacebook,
    downloadInstagram,
    downloadTwitter,
    downloadMediaFire,
    downloadSpotify,
    downloadPinterest,
    validateFileSize,
    sendProgress,
    TEMP_DIR
};
