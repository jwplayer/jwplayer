import { parseXML } from 'utils/parser';
import _ from 'utils/underscore';

const noop = function() {};

let useDomParser = false;

// TODO: deprecate (jwplayer-ads-vast uses utils.crossdomain(url)). It's used here for IE9 compatibility
export function crossdomain(uri) {
    var a = document.createElement('a');
    var b = document.createElement('a');
    a.href = location.href;
    try {
        b.href = uri;
        b.href = b.href; /* IE fix for relative urls */
        return a.protocol + '//' + a.host !== b.protocol + '//' + b.host;
    } catch (e) {/* swallow */}
    return true;
}

export function ajax(url, completeCallback, errorCallback, args) {
    if (_.isObject(url)) {
        args = url;
        url = args.url;
    }
    var xhr;
    var options = Object.assign({
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
        responseType: (args && args.plainText) ? 'text' : '' /* xhr.responseType ex: "json" or "text" */
    }, args);

    if ('XDomainRequest' in window && crossdomain(url)) {
        // IE8 / 9
        xhr = options.xhr = new window.XDomainRequest();
        xhr.onload = _ajaxComplete(options);
        xhr.ontimeout = xhr.onprogress = noop;
        useDomParser = true;
    } else if ('XMLHttpRequest' in window) {
        // Firefox, Chrome, Opera, Safari
        xhr = options.xhr = new window.XMLHttpRequest();
        xhr.onreadystatechange = _readyStateChangeHandler(options);
    } else {
        // browser cannot make xhr requests
        options.onerror('', url);
        return;
    }
    var requestError = _requestError('Error loading file', options);
    xhr.onerror = requestError;

    if ('overrideMimeType' in xhr) {
        if (options.mimeType) {
            xhr.overrideMimeType(options.mimeType);
        }
    } else {
        useDomParser = true;
    }

    try {
        // remove anchors from the URL since they can't be loaded in IE
        url = url.replace(/#.*$/, '');
        xhr.open('GET', url, true);
    } catch (e) {
        requestError(e);
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
            options.onerror('Timeout', url, xhr);
        }, options.timeout);
        xhr.onabort = function() {
            clearTimeout(options.timeoutId);
        };
    }

    try {
        // xhr.withCredentials must must be set after xhr.open() is called
        // otherwise older WebKit browsers will throw INVALID_STATE_ERR (PhantomJS 1.x)
        if (options.withCredentials && 'withCredentials' in xhr) {
            xhr.withCredentials = true;
        }
        xhr.send();
    } catch (e) {
        requestError(e);
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
    return function(e) {
        var xhr = e.currentTarget || options.xhr;
        clearTimeout(options.timeoutId);
        // Handle Access-Control-Allow-Origin wildcard error when using withCredentials to send cookies
        if (options.retryWithoutCredentials && options.xhr.withCredentials) {
            abortAjax(xhr);
            var args = Object.assign({}, options, {
                xhr: null,
                withCredentials: false,
                retryWithoutCredentials: false
            });
            ajax(args);
            return;
        }
        options.onerror(message, options.url, xhr);
    };
}

function _readyStateChangeHandler(options) {
    return function(e) {
        var xhr = e.currentTarget || options.xhr;
        if (xhr.readyState === 4) {
            clearTimeout(options.timeoutId);
            if (xhr.status >= 400) {
                var message;
                if (xhr.status === 404) {
                    message = 'File not found';
                } else {
                    message = '' + xhr.status + '(' + xhr.statusText + ')';
                }
                return options.onerror(message, options.url, xhr);
            }
            if (xhr.status === 200) {
                return _ajaxComplete(options)(e);
            }
        }
    };
}

function _ajaxComplete(options) {
    return function(e) {
        var xhr = e.currentTarget || options.xhr;
        clearTimeout(options.timeoutId);
        if (options.responseType) {
            if (options.responseType === 'json') {
                return _jsonResponse(xhr, options);
            }
        } else {
            // Handle the case where an XML document was returned with an incorrect MIME type.
            var xml = xhr.responseXML;
            var firstChild;
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
            // IE9
            if (useDomParser && xhr.responseText && !xml) {
                xml = parseXML(xhr.responseText);
                if (xml && xml.firstChild) {
                    return _xmlResponse(xhr, xml, options);
                }
            }
            if (options.requireValidXML) {
                options.onerror('Invalid XML', options.url, xhr);
                return;
            }
        }
        options.oncomplete(xhr);
    };
}

function _jsonResponse(xhr, options) {
    // insure that xhr.response is parsed JSON
    if (!xhr.response ||
        (_.isString(xhr.response) && xhr.responseText.substr(1) !== '"')) {
        try {
            xhr = Object.assign({}, xhr, {
                response: JSON.parse(xhr.responseText)
            });
        } catch (err) {
            options.onerror('Invalid JSON', options.url, xhr);
            return;
        }
    }
    return options.oncomplete(xhr);
}


function _xmlResponse(xhr, xml, options) {
    // Handle DOMParser 'parsererror'
    var doc = xml.documentElement;
    if (options.requireValidXML &&
            (doc.nodeName === 'parsererror' || doc.getElementsByTagName('parsererror').length)) {
        options.onerror('Invalid XML', options.url, xhr);
        return;
    }
    if (!xhr.responseXML) {
        xhr = Object.assign({}, xhr, {
            responseXML: xml
        });
    }
    return options.oncomplete(xhr);
}
