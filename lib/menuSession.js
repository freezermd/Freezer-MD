// lib/menuSession.js
const sessions = new Map();
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

class MenuSession {
    constructor(userJid, menuMessageKey) {
        this.userJid = userJid;
        this.menuMessageKey = menuMessageKey; // key of the menu message for reply detection
        this.state = 'MAIN_MENU';             // MAIN_MENU | CATEGORY_MENU | WAITING_ARGS
        this.selectedCategory = null;
        this.selectedCommand = null;           // command name (string)
        this.lastInteraction = Date.now();
    }

    update() {
        this.lastInteraction = Date.now();
    }

    isExpired() {
        return Date.now() - this.lastInteraction > SESSION_TIMEOUT;
    }
}

// Cleanup expired sessions every minute
setInterval(() => {
    for (const [jid, session] of sessions) {
        if (session.isExpired()) {
            sessions.delete(jid);
        }
    }
}, 60 * 1000);

module.exports = {
    getSession(userJid) {
        const session = sessions.get(userJid);
        if (session && session.isExpired()) {
            sessions.delete(userJid);
            return null;
        }
        return session || null;
    },
    createSession(userJid, menuMessageKey) {
        const session = new MenuSession(userJid, menuMessageKey);
        sessions.set(userJid, session);
        return session;
    },
    deleteSession(userJid) {
        sessions.delete(userJid);
    },
    updateSession(userJid) {
        const session = sessions.get(userJid);
        if (session) session.update();
    },
    setState(userJid, state, data = {}) {
        const session = sessions.get(userJid);
        if (session) {
            session.state = state;
            Object.assign(session, data);
            session.update();
        }
    },
    getSessionData(userJid) {
        return sessions.get(userJid) || null;
    }
};
