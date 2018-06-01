import { MSG_PROTECTED_CONTENT, MSG_CANT_PLAY_VIDEO } from 'api/errors';

export default function parseNetworkError(baseCode, statusCode, url = '') {
    let code = baseCode + 1000;
    let key;

    if (statusCode > 0) {
        // Restrict status code range between 400 and 599 in order to avoid conflicting codes; 6 otherwise
        key = statusCode === 403 ? MSG_PROTECTED_CONTENT : MSG_CANT_PLAY_VIDEO;
        code += clampStatus(statusCode);
    } else if (url.substring(0, 5) === 'http:' && document.location.protocol === 'https:') {
        key = MSG_CANT_PLAY_VIDEO;
        code += 12;
    } else if (statusCode === 0) {
        key = MSG_CANT_PLAY_VIDEO;
        code += 11;
    }

    return { code, key };
}

export const clampStatus = code => (code >= 400 && code < 600) ? code : 6;

