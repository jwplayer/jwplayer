import { MSG_PROTECTED_CONTENT, MSG_CANT_PLAY_VIDEO } from 'api/errors';
import type { ErrorCode, ErrorKey } from 'api/errors';

type NetworkError = {
    code: ErrorCode;
    key: ErrorKey;
}

export default function parseNetworkError(baseCode: ErrorCode, statusCode: number, url?: string): NetworkError {
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

export const clampStatus = (code: number): number => (code >= 400 && code < 600) ? code : 6;

