export default function parseNetworkError(baseCode, statusCode, url = '', responseText) {
    let message;
    let code = baseCode + 1000;

    if (statusCode > 0) {
        // Restrict status code range between 400 and 600 in order to avoid conflicting codes; 10 otherwise
        message = badStatusMessage(statusCode, responseText);
        code += clampStatus(statusCode);
    } else if (url.substring(0, 5) === 'http:' && document.location.protocol === 'https:') {
        message = 'Unable to fetch HTTP resource over HTTPS';
        code += 12;
    } else if (statusCode === 0) {
        message = 'Crossdomain access denied';
        code += 11;
    }

    return { code, message };
}

function badStatusMessage(statusCode, responseText = '') {
    let message = '';
    switch (statusCode) {
        case 403:
            message = 'You do not have permission to access this content';
            break;
        case 404:
            message = '404 Not Found';
            break;
        default:
            message = `${statusCode} ${responseText}`;
    }

    return message;
}

export const clampStatus = code => (code >= 400 && code <= 600) ? code : 10;

