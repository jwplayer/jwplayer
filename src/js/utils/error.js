export const jwError = (category, code, severity, data) =>{
    const message = createMessage(category, code, severity, data);
    return {
        category,
        code,
        severity,
        message
    };
};

export const errorCategory = {
    PLAYER: 1,
    SETUP: 2,
    MEDIA: 3,
    NETWORK: 4,
    AD: 5
};

export const errorCode = {
    // An HTTP request returned with a status indicating failure
    BAD_HTTP_STATUS: 4001,
    // Crossdomain error
    CROSSDOMAIN_ERROR: 4002,
    // Accessing HTTP over HTTPS
    BLOCKED_MIXED_CONTENT: 4003
};

export const errorSeverity = {
    RECOVERABLE: 1,
    FATAL: 2
};

export const networkErrorData = (url, statusCode, responseText) => {
    return {
        url,
        statusCode,
        responseText
    };
};

const createMessage = (category, code, severity, data) => {
    let message = '';
    switch (category) {
        case errorCategory.NETWORK: {
            message = createNetworkErrorMessage(code, data);
            break;
        }
        default: {
            message = 'Unknown Error';
            break;
        }
    }

    return message;
};

const createNetworkErrorMessage = (code, data) => {
    let message = '';
    switch (code) {
        case errorCode.BAD_HTTP_STATUS: {
            message = createStatusCodeError(data.statusCode, data.responseText);
            break;
        }
        case errorCode.CROSSDOMAIN_ERROR: {
            message = 'Crossdomain access denied';
            break;
        }
        case errorCode.BLOCKED_MIXED_CONTENT: {
            message = 'Unable to fetch HTTP resource over HTTPS';
            break;
        }
        default: {
            message = 'Unknown Network Error';
            break;
        }
    }

    return message;
};

const createStatusCodeError = (statusCode = 0, responseText = '') => {
    let message = '';
    switch (statusCode) {
        case 403: {
            message = 'You do not have permission to access this content';
            break;
        }
        case 404: {
            message = '404 Not Found';
            break;
        }
        default: {
            message = `${statusCode} ${responseText}`;
        }
    }

    return message;
};


