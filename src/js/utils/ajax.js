define([
    'utils/underscore',
    'utils/validator',
    'utils/parser',
    'utils/trycatch'
], function(_, validator, parser, trycatch) {
    var ajax = {};

    /** Loads an XML file into a DOM object * */
    ajax.ajax = function (xmldocpath, completecallback, errorcallback, donotparse) {
        var xmlhttp;
        var isError = false;
        // Hash tags should be removed from the URL since they can't be loaded in IE
        if (xmldocpath.indexOf('#') > 0) {
            xmldocpath = xmldocpath.replace(/#.*$/, '');
        }

        if (_isCrossdomain(xmldocpath) && validator.exists(window.XDomainRequest)) {
            // IE8 / 9
            xmlhttp = new window.XDomainRequest();
            xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse);
            xmlhttp.ontimeout = xmlhttp.onprogress = function () {
            };
            xmlhttp.timeout = 5000;
        } else if (validator.exists(window.XMLHttpRequest)) {
            // Firefox, Chrome, Opera, Safari
            xmlhttp = new window.XMLHttpRequest();
            xmlhttp.onreadystatechange =
                _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse);
        } else {
            if (errorcallback) {
                errorcallback('', xmldocpath, xmlhttp);
            }
            return xmlhttp;
        }
        if (xmlhttp.overrideMimeType) {
            xmlhttp.overrideMimeType('text/xml');
        }

        xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath, xmlhttp);
        var status = trycatch.tryCatch(function () {
            xmlhttp.open('GET', xmldocpath, true);
        });

        if (status instanceof trycatch.Error) {
            isError = true;
        }

        // make XDomainRequest asynchronous:
        setTimeout(function () {
            if (isError) {
                if (errorcallback) {
                    errorcallback(xmldocpath, xmldocpath, xmlhttp);
                }
                return;
            }
            var status = trycatch.tryCatch(function () {
                xmlhttp.send();
            });

            if (status instanceof trycatch.Error) {
                if (errorcallback) {
                    errorcallback(xmldocpath, xmldocpath, xmlhttp);
                }
            }

        }, 0);

        return xmlhttp;
    };

    function _isCrossdomain(path) {
        return (path && path.indexOf('://') >= 0) &&
            (path.split('/')[2] !== window.location.href.split('/')[2]);
    }

    function _ajaxError(errorcallback, xmldocpath, xmlhttp) {
        return function () {
            errorcallback('Error loading file', xmldocpath, xmlhttp);
        };
    }

    function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse) {
        return function () {
            if (xmlhttp.readyState === 4) {
                switch (xmlhttp.status) {
                    case 200:
                        _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse)();
                        break;
                    case 404:
                        errorcallback('File not found', xmldocpath, xmlhttp);
                }

            }
        };
    }

    function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse) {
        return function () {
            // Handle the case where an XML document was returned with an incorrect MIME type.
            var xml, firstChild;
            if (donotparse) {
                completecallback(xmlhttp);
            } else {
                try {
                    // This will throw an error on Windows Mobile 7.5.
                    // We want to trigger the error so that we can move down to the next section
                    xml = xmlhttp.responseXML;
                    if (xml) {
                        firstChild = xml.firstChild;
                        if (xml.lastChild && xml.lastChild.nodeName === 'parsererror') {
                            if (errorcallback) {
                                errorcallback('Invalid XML', xmldocpath, xmlhttp);
                            }
                            return;
                        }
                    }
                } catch (e) {
                }
                if (xml && firstChild) {
                    return completecallback(xmlhttp);
                }
                var parsedXML = parser.parseXML(xmlhttp.responseText);
                if (parsedXML && parsedXML.firstChild) {
                    xmlhttp = _.extend({}, xmlhttp, {
                        responseXML: parsedXML
                    });
                } else {
                    if (errorcallback) {
                        errorcallback(xmlhttp.responseText ? 'Invalid XML' : xmldocpath, xmldocpath, xmlhttp);
                    }
                    return;
                }
                completecallback(xmlhttp);
            }
        };
    }

    return ajax;
});