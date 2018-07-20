export const FEED_SHOWN_ID_LENGTH = 12;

// Taken from the Analytics repo (src/js/utils/general_utils.ts)
function randomAlphaNumericString() {
    try {
        const crypto = window.crypto || window.msCrypto;
        if (crypto && crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        }
    } catch (e) {/* ignore */}
    return Math.random().toString(36).slice(2, 9);
}

export function genId(length) {
    let str = '';
    while (str.length < length) {
        str += randomAlphaNumericString();
    }
    return str.slice(0, length);
}
