// utils/groupUtils.js
/**
 * Check if a user is admin in the group
 */
async function isAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        console.error('isAdmin error:', error);
        return false;
    }
}

/**
 * Check if bot is admin
 */
async function isBotAdmin(sock, groupId) {
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    return isAdmin(sock, groupId, botId);
}

/**
 * Get all admins of a group
 */
async function getAdmins(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
    } catch (error) {
        console.error('getAdmins error:', error);
        return [];
    }
}

/**
 * Check if sender is owner (from config)
 */
function isOwner(sender, config) {
    const owners = config.OWNER_NUMBER || [];
    // Owners may be in format '1234567890' or '1234567890@s.whatsapp.net'
    const normalizedSender = sender.replace('@s.whatsapp.net', '');
    return owners.some(owner => owner.replace('@s.whatsapp.net', '') === normalizedSender);
}

/**
 * Extract mentioned users from message
 */
function getMentions(msg) {
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        return msg.message.extendedTextMessage.contextInfo.mentionedJid;
    }
    return [];
}

/**
 * Extract replied-to user
 */
function getRepliedUser(msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) {
        const key = msg.message.extendedTextMessage.contextInfo.participant || 
                    msg.message.extendedTextMessage.contextInfo.remoteJid;
        return key;
    }
    return null;
}

/**
 * Extract phone number from string (for .add)
 */
function parsePhoneNumber(text) {
    // Remove spaces, '+', and non-digits
    const cleaned = text.replace(/[^0-9]/g, '');
    // Ensure country code: if starts with 0, replace with country code? We'll assume full international format.
    if (cleaned.length >= 10) {
        return cleaned + '@s.whatsapp.net';
    }
    return null;
}

module.exports = {
    isAdmin,
    isBotAdmin,
    getAdmins,
    isOwner,
    getMentions,
    getRepliedUser,
    parsePhoneNumber
};
