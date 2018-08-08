import { MSG_PROTECTED_CONTENT, MSG_CANT_PLAY_VIDEO } from 'api/errors';

export default function parseNetworkError(baseCode, statusCode, url) {
    let code = baseCode + 1000;
    let key = MSG_CANT_PLAY_VIDEO;

    if (statusCode > 0) {
        // Restrict status code range between 400 and 599 in order to avoid conflicting codes; 6 otherwise
        if (statusCode === 403) {
            key = MSG_PROTECTED_CONTENT;
        }
        code += clampStatus(statusCode);
    } else if (('' + url).substring(0, 5) === 'http:' && document.location.protocol === 'https:') {
        code += 12;
    } else if (statusCode === 0) {
        code += 11;
    }

    return { code, key };
}

export const clampStatus = code => (code >= 400 && code < 600) ? code : 6;

