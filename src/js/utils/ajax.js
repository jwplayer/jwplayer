import { parseXML } from 'utils/parser';
import { PlayerError } from 'api/errors';

// XHR Request Errors
const ERROR_TIMEOUT = 1;
const ERROR_XHR_UNDEFINED = 2;
const ERROR_XHR_OPEN = 3;
const ERROR_XHR_SEND = 4;
const ERROR_XHR_FILTER = 5;
const ERROR_XHR_UNKNOWN = 6;

// Network Responses with http status 400-599
// will produce an error with the http status code

// Format Errors
const ERROR_DOM_PARSER = 601;
const ERROR_NO_XML = 602;
const ERROR_JSON_PARSE = 611;

const noop = function() {};

export function ajax(url, completeCallback, errorCallback, args) {
    if (url === Object(url)) {
        args = url;
        url = args.url;
    }
    let xhr;
    const options = Object.assign({
        xhr: null,
        url: url,
        withCredentials: false,
        retryWithoutCredentials: false,
        timeout: 60000,
        timeoutId: -1,
        oncomplete: completeCallback || noop,
        onerror: errorCallback || noop,
        mimeType: (args && !args.responseType) ? 'text/xml' : '',
        requireValidXML: false, /* Require responseXML */
        responseType: (args && args.plainText) ? 'text' : '', /* xhr.responseType ex: "json" or "text" */
        useDomParser: false,
        requestFilter: null
    }, args);
    const requestError = _requestError('Error loading file', options);

    if ('XMLHttpRequest' in window) {
        // Firefox, Chrome, Opera, Safari
        xhr = options.xhr = options.xhr || new window.XMLHttpRequest();
    } else {
        // browser cannot make xhr requests
        _error(options, '', ERROR_XHR_UNDEFINED);
        return;
    }
    if (typeof options.requestFilter === 'function') {
        let result;
        try {
            result = options.requestFilter({
                url,
                xhr
            });
        } catch (e) {
            requestError(e, ERROR_XHR_FILTER);
            return xhr;
        }
        if (result && 'open' in result && 'send' in result) {
            xhr = options.xhr = result;
        }
    }
    xhr.onreadystatechange = _readyStateChangeHandler(options);

    xhr.onerror = requestError;

    if ('overrideMimeType' in xhr) {
        if (options.mimeType) {
            xhr.overrideMimeType(options.mimeType);
        }
    } else {
        options.useDomParser = true;
    }

    try {
        // remove anchors from the URL since they can't be loaded in IE
        url = url.replace(/#.*$/, '');
        xhr.open('GET', url, true);
    } catch (e) {
        requestError(e, ERROR_XHR_OPEN);
        return xhr;
    }

    if (options.responseType) {
        try {
            xhr.responseType = options.responseType;
        } catch (e) {/* ignore */}
    }

    if (options.timeout) {
        options.timeoutId = setTimeout(function() {
            abortAjax(xhr);
            _error(options, 'Timeout', ERROR_TIMEOUT);
        }, options.timeout);
        xhr.onabort = function() {
            clearTimeout(options.timeoutId);
        };
    }

    try {
        // xhr.withCredentials must must be set after xhr.open() is called
        // otherwise older WebKit browsers will throw INVALID_STATE_ERR
        if (options.withCredentials && 'withCredentials' in xhr) {
            xhr.withCredentials = true;
        }
        xhr.send();
    } catch (e) {
        requestError(e, ERROR_XHR_SEND);
    }
    return xhr;
}

export function abortAjax(xhr) {
    xhr.onload = null;
    xhr.onprogress = null;
    xhr.onreadystatechange = null;
    xhr.onerror = null;
    if ('abort' in xhr) {
        xhr.abort();
    }
}

function _requestError(message, options) {
    return function(errorOrEvent, code) {
        const xhr = errorOrEvent.currentTarget || options.xhr;
        clearTimeout(options.timeoutId);
        // Handle Access-Control-Allow-Origin wildcard error when using withCredentials to send cookies
        if (options.retryWithoutCredentials && options.xhr.withCredentials) {
            abortAjax(xhr);
            const args = Object.assign({}, options, {
                xhr: null,
                withCredentials: false,
                retryWithoutCredentials: false
            });
            ajax(args);
            return;
        }

        if (!code && xhr.status >= 400 && xhr.status < 600) {
            code = xhr.status;
        }

        _error(options, message, code || ERROR_XHR_UNKNOWN, errorOrEvent);
    };
}

function _error(options, message, code, error) {
    options.onerror(message, options.url, options.xhr, new PlayerError(message, code, error));
}

function _readyStateChangeHandler(options) {
    return function(e) {
        const xhr = e.currentTarget || options.xhr;
        if (xhr.readyState === 4) {
            clearTimeout(options.timeoutId);
            if (xhr.status >= 400) {
                let message;
                if (xhr.status === 404) {
                    message = 'File not found';
                } else {
                    message = '' + xhr.status + '(' + xhr.statusText + ')';
                }
                _error(options, message, (xhr.status < 600) ? xhr.status : ERROR_XHR_UNKNOWN);
                return;
            }
            if (xhr.status === 200) {
                return _ajaxComplete(options)(e);
            }
        }
    };
}

function _ajaxComplete(options) {
    return function(e) {
        const xhr = e.currentTarget || options.xhr;
        clearTimeout(options.timeoutId);
        if (options.responseType) {
            if (options.responseType === 'json') {
                return _jsonResponse(xhr, options);
            }
        } else {
            // Handle the case where an XML document was returned with an incorrect MIME type.
            let xml = xhr.responseXML;
            let firstChild;
            if (xml) {
                try {
                    // This will throw an error on Windows Mobile 7.5.
                    // We want to trigger the error so that we can move down to the next section
                    firstChild = xml.firstChild;
                } catch (error) {
                    /* ignore */
                }
            }
            if (xml && firstChild) {
                return _xmlResponse(xhr, xml, options);
            }
            if (options.useDomParser && xhr.responseText && !xml) {
                xml = parseXML(xhr.responseText);
                if (xml && xml.firstChild) {
                    return _xmlResponse(xhr, xml, options);
                }
            }
            if (options.requireValidXML) {
                _error(options, 'Invalid XML', ERROR_NO_XML);
                return;
            }
        }
        options.oncomplete(xhr);
    };
}

function _jsonResponse(xhr, options) {
    // insure that xhr.response is parsed JSON
    if (!xhr.response ||
        (typeof xhr.response === 'string' && xhr.responseText.substr(1) !== '"')) {
        try {
            xhr = Object.assign({}, xhr, {
                response: JSON.parse(xhr.responseText)
            });
        } catch (err) {
            _error(options, 'Invalid JSON', ERROR_JSON_PARSE, err);
            return;
        }
    }
    return options.oncomplete(xhr);
}


function _xmlResponse(xhr, xml, options) {
    // Handle DOMParser 'parsererror'
    const doc = xml.documentElement;
    if (options.requireValidXML &&
            (doc.nodeName === 'parsererror' || doc.getElementsByTagName('parsererror').length)) {
        _error(options, 'Invalid XML', ERROR_DOM_PARSER);
        return;
    }
    if (!xhr.responseXML) {
        xhr = Object.assign({}, xhr, {
            responseXML: xml
        });
    }
    return options.oncomplete(xhr);
}
