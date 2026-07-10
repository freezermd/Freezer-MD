'use strict';

const config = require('../config');

function isOwner(jid) {
    if (!jid) return false;

    // remove @s.whatsapp.net
    const number = jid.replace('@s.whatsapp.net', '');

    const owners = String(config.OWNER_NUMBER || '')
        .split(',')
        .map(x => x.trim());

    return owners.includes(number);
}

module.exports = {
    isOwner
};
