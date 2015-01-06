(function(jwplayer) {
    /*jshint maxparams:5*/

    var utils = jwplayer.utils = {};
    var _ = jwplayer._;

    /**
     * Returns true if the value of the object is null, undefined or the empty
     * string
     *
     * @param a The variable to inspect
     */
    utils.exists = function(item) {
        switch (typeof(item)) {
            case 'string':
                return (item.length > 0);
            case 'object':
                return (item !== null);
            case 'undefined':
                return false;
        }
        return true;
    };

    /** Used for styling dimensions in CSS --
     * return the string unchanged if it's a percentage width; add 'px' otherwise **/
    utils.styleDimension = function(dimension) {
        return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
    };

    /** Gets an absolute file path based on a relative filepath * */
    utils.getAbsolutePath = function(path, base) {
        if (!utils.exists(base)) {
            base = document.location.href;
        }
        if (!utils.exists(path)) {
            return;
        }
        if (isAbsolutePath(path)) {
            return path;
        }
        var protocol = base.substring(0, base.indexOf('://') + 3);
        var domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
        var patharray;
        if (path.indexOf('/') === 0) {
            patharray = path.split('/');
        } else {
            var basepath = base.split('?')[0];
            basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
            patharray = basepath.split('/').concat(path.split('/'));
        }
        var result = [];
        for (var i = 0; i < patharray.length; i++) {
            if (!patharray[i] || !utils.exists(patharray[i]) || patharray[i] === '.') {
                continue;
            } else if (patharray[i] === '..') {
                result.pop();
            } else {
                result.push(patharray[i]);
            }
        }
        return protocol + domain + '/' + result.join('/');
    };

    function isAbsolutePath(path) {
        if (!utils.exists(path)) {
            return;
        }
        var protocol = path.indexOf('://');
        var queryparams = path.indexOf('?');
        return (protocol > 0 && (queryparams < 0 || (queryparams > protocol)));
    }

    /** Merges a list of objects **/
    utils.extend = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length > 1) {
            var objectToExtend = args[0],
                extendEach = function(element, arg) {
                    if (arg !== undefined && arg !== null) {
                        objectToExtend[element] = arg;
                    }
                };
            for (var i = 1; i < args.length; i++) {
                utils.foreach(args[i], extendEach);
            }
            return objectToExtend;
        }
        return null;
    };

    /** Logger */
    var console = window.console = window.console || {
        log: function() {}
    };
    utils.log = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof console.log === 'object') {
            console.log(args);
        } else {
            console.log.apply(console, args);
        }
    };

    var _userAgentMatch = _.memoize(function(regex) {
        var agent = navigator.userAgent.toLowerCase();
        return (agent.match(regex) !== null);
    });

    function _browserCheck(regex) {
        return function() {
            return _userAgentMatch(regex);
        };
    }

    utils.isFF = _browserCheck(/firefox/i);
    utils.isChrome = _browserCheck(/chrome/i);
    utils.isIPod = _browserCheck(/iP(hone|od)/i);
    utils.isIPad = _browserCheck(/iPad/i);
    utils.isSafari602 = _browserCheck(/Macintosh.*Mac OS X 10_8.*6\.0\.\d* Safari/i);

    utils.isIETrident = function(version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            return _userAgentMatch(new RegExp('trident/.+rv:\\s*' + version, 'i'));
        }
        return _userAgentMatch(/trident/i);
    };


    utils.isMSIE = function(version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            return _userAgentMatch(new RegExp('msie\\s*' + version, 'i'));
        }
        return _userAgentMatch(/msie/i);
    };
    utils.isIE = function(version) {
        if (version) {
            version = parseFloat(version).toFixed(1);
            if (version >= 11) {
                return utils.isIETrident(version);
            } else {
                return utils.isMSIE(version);
            }
        }
        return utils.isMSIE() || utils.isIETrident();
    };

    utils.isSafari = function() {
        return (_userAgentMatch(/safari/i) && !_userAgentMatch(/chrome/i) &&
            !_userAgentMatch(/chromium/i) && !_userAgentMatch(/android/i));
    };

    /** Matches iOS devices **/
    utils.isIOS = function(version) {
        if (version) {
            return _userAgentMatch(new RegExp('iP(hone|ad|od).+\\sOS\\s' + version, 'i'));
        }
        return _userAgentMatch(/iP(hone|ad|od)/i);
    };

    /** Matches Android devices **/
    utils.isAndroidNative = function(version) {
        return utils.isAndroid(version, true);
    };

    utils.isAndroid = function(version, excludeChrome) {
        //Android Browser appears to include a user-agent string for Chrome/18
        if (excludeChrome && _userAgentMatch(/chrome\/[123456789]/i) && !_userAgentMatch(/chrome\/18/)) {
            return false;
        }
        if (version) {
            // make sure whole number version check ends with point '.'
            if (utils.isInt(version) && !/\./.test(version)) {
                version = '' + version + '.';
            }
            return _userAgentMatch(new RegExp('Android\\s*' + version, 'i'));
        }
        return _userAgentMatch(/Android/i);
    };

    /** Matches iOS and Android devices **/
    utils.isMobile = function() {
        return utils.isIOS() || utils.isAndroid();
    };

    utils.isIframe = function() {
        return (window.frameElement && (window.frameElement.nodeName === 'IFRAME'));
    };

    /** Save a setting **/
    utils.saveCookie = function(name, value) {
        document.cookie = 'jwplayer.' + name + '=' + value + '; path=/';
    };

    /** Retrieve saved  player settings **/
    utils.getCookies = function() {
        var jwCookies = {};
        var cookies = document.cookie.split('; ');
        for (var i = 0; i < cookies.length; i++) {
            var split = cookies[i].split('=');
            if (split[0].indexOf('jwplayer.') === 0) {
                jwCookies[split[0].substring(9, split[0].length)] = split[1];
            }
        }
        return jwCookies;
    };

    utils.isInt = function(value) {
        return parseFloat(value) % 1 === 0;
    };

    /** Returns the true type of an object * */
    utils.typeOf = function(value) {
        if (value === null) {
            return 'null';
        }
        var typeofString = typeof value;
        if (typeofString === 'object') {
            if (_.isArray(value)) {
                return 'array';
            }
        }
        return typeofString;
    };

    /* Normalizes differences between Flash and HTML5 internal players' event responses. */
    utils.translateEventResponse = function(type, eventProperties) {
        var translated = utils.extend({}, eventProperties);
        if (type === jwplayer.events.JWPLAYER_FULLSCREEN && !translated.fullscreen) {
            translated.fullscreen = (translated.message === 'true');
            delete translated.message;
        } else if (typeof translated.data === 'object') {
            // Takes ViewEvent 'data' block and moves it up a level
            var data = translated.data;
            delete translated.data;
            translated = utils.extend(translated, data);

        } else if (typeof translated.metadata === 'object') {
            utils.deepReplaceKeyName(translated.metadata,
                ['__dot__', '__spc__', '__dsh__', '__default__'], ['.', ' ', '-', 'default']);
        }

        var rounders = ['position', 'duration', 'offset'];
        utils.foreach(rounders, function(rounder, val) {
            if (translated[val]) {
                translated[val] = Math.round(translated[val] * 1000) / 1000;
            }
        });

        return translated;
    };

    /**
     * If the browser has flash capabilities, return the flash version
     */
    utils.flashVersion = function() {
        if (utils.isAndroid()) {
            return 0;
        }

        var plugins = navigator.plugins,
            flash;

        try {
            if (plugins !== 'undefined') {
                flash = plugins['Shockwave Flash'];
                if (flash) {
                    return parseInt(flash.description.replace(/\D+(\d+)\..*/, '$1'), 10);
                }
            }
        } catch (e) {
            // The above evaluation (plugins != undefined) messes up IE7
        }

        if (typeof window.ActiveXObject !== 'undefined') {
            try {
                flash = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                if (flash) {
                    return parseInt(flash.GetVariable('$version').split(' ')[1].split(',')[0], 10);
                }
            } catch (err) {}
        }
        return 0;
    };


    /** Finds the location of jwplayer.js and returns the path **/
    utils.getScriptPath = function(scriptName) {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src && src.indexOf(scriptName) >= 0) {
                return src.substr(0, src.indexOf(scriptName));
            }
        }
        return '';
    };

    /**
     * Recursively traverses nested object, replacing key names containing a
     * search string with a replacement string.
     *
     * @param searchString
     *            The string to search for in the object's key names
     * @param replaceString
     *            The string to replace in the object's key names
     * @returns The modified object.
     */
    utils.deepReplaceKeyName = function(obj, searchString, replaceString) {
        switch (jwplayer.utils.typeOf(obj)) {
            case 'array':
                for (var i = 0; i < obj.length; i++) {
                    obj[i] = jwplayer.utils.deepReplaceKeyName(obj[i],
                        searchString, replaceString);
                }
                break;
            case 'object':
                utils.foreach(obj, function(key, val) {
                    var searches;
                    if (searchString instanceof Array && replaceString instanceof Array) {
                        if (searchString.length !== replaceString.length) {
                            return;
                        } else {
                            searches = searchString;
                        }
                    } else {
                        searches = [searchString];
                    }
                    var newkey = key;
                    for (var i = 0; i < searches.length; i++) {
                        newkey = newkey.replace(new RegExp(searchString[i], 'g'), replaceString[i]);
                    }
                    obj[newkey] = jwplayer.utils.deepReplaceKeyName(val, searchString, replaceString);
                    if (key !== newkey) {
                        delete obj[key];
                    }
                });
                break;
        }
        return obj;
    };


    /**
     * Types of plugin paths
     */
    var _pluginPathType = utils.pluginPathType = {
        ABSOLUTE: 0,
        RELATIVE: 1,
        CDN: 2
    };

    utils.getPluginPathType = function(path) {
        if (typeof path !== 'string') {
            return;
        }
        path = path.split('?')[0];
        var protocol = path.indexOf('://');
        if (protocol > 0) {
            return _pluginPathType.ABSOLUTE;
        }
        var folder = path.indexOf('/');
        var extension = utils.extension(path);
        if (protocol < 0 && folder < 0 && (!extension || !isNaN(extension))) {
            return _pluginPathType.CDN;
        }
        return _pluginPathType.RELATIVE;
    };


    /**
     * Extracts a plugin name from a string
     */
    utils.getPluginName = function(pluginName) {
        /** Regex locates the characters after the last slash, until it encounters a dash. **/
        return pluginName.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/, '$2');
    };

    /**
     * Extracts a plugin version from a string
     */
    utils.getPluginVersion = function(pluginName) {
        return pluginName.replace(/[^-]*-?([^\.]*).*$/, '$1');
    };

    /**
     * Determines if a URL is a YouTube link
     */
    utils.isYouTube = function(path, type) {
        return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
    };

    /** 
     * Returns a YouTube ID from a number of YouTube URL formats:
     *
     * Matches the following YouTube URL types:
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4&extra_param=123
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://www.youtube.com/v/YE7VzlLtp-4
     *  - http://www.youtube.com/v/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://youtu.be/YE7VzlLtp-4
     *  - http://youtu.be/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - YE7VzlLtp-4
     **/
    utils.youTubeID = function(path) {
        try {
            // Left as a dense regular expression for brevity.  
            return (/v[=\/]([^?&]*)|youtu\.be\/([^?]*)|^([\w-]*)$/i).exec(path).slice(1).join('').replace('?', '');
        } catch (e) {
            return '';
        }
    };

    /**
     * Determines if a URL is an RTMP link
     */
    utils.isRtmp = function(file, type) {
        return (file.indexOf('rtmp') === 0 || type === 'rtmp');
    };

    /**
     * Iterates over an object and executes a callback function for each property (if it exists)
     * This is a safe way to iterate over objects if another script has modified the object prototype
     */
    utils.foreach = function(aData, fnEach) {
        var key, val;
        for (key in aData) {
            if (utils.typeOf(aData.hasOwnProperty) === 'function') {
                if (aData.hasOwnProperty(key)) {
                    val = aData[key];
                    fnEach(key, val);
                }
            } else {
                // IE8 has a problem looping through XML nodes
                val = aData[key];
                fnEach(key, val);
            }
        }
    };

    /** Determines if the current page is HTTPS **/
    utils.isHTTPS = function() {
        return (window.location.href.indexOf('https') === 0);
    };

    /** Gets the repository location **/
    utils.repo = function() {
        var repo = 'http://p.jwpcdn.com/' + jwplayer.version.split(/\W/).splice(0, 2).join('/') + '/';

        try {
            if (utils.isHTTPS()) {
                repo = repo.replace('http://', 'https://ssl.');
            }
        } catch (e) {}

        return repo;
    };

    utils.versionCheck = function(target) {
        var tParts = ('0'+target).split(/\W/);
        var jParts = jwplayer.version.split(/\W/);
        var tMajor = parseFloat(tParts[0]);
        var jMajor = parseFloat(jParts[0]);
        if (tMajor > jMajor) {
            return false;
        } else if (tMajor === jMajor) {
            if (parseFloat('0'+tParts[1]) > parseFloat(jParts[1])) {
                return false;
            }
        }
        return true;
    };

    /** Loads an XML file into a DOM object * */
    utils.ajax = function(xmldocpath, completecallback, errorcallback, donotparse) {
        var xmlhttp;
        var isError = false;
        // Hash tags should be removed from the URL since they can't be loaded in IE
        if (xmldocpath.indexOf('#') > 0) {
            xmldocpath = xmldocpath.replace(/#.*$/, '');
        }

        if (_isCrossdomain(xmldocpath) && utils.exists(window.XDomainRequest)) {
            // IE8 / 9
            xmlhttp = new window.XDomainRequest();
            xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse);
            xmlhttp.ontimeout = xmlhttp.onprogress = function() {};
            xmlhttp.timeout = 5000;
        } else if (utils.exists(window.XMLHttpRequest)) {
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
        try {
            xmlhttp.open('GET', xmldocpath, true);
        } catch (error) {
            isError = true;
        }
        // make XDomainRequest asynchronous:
        setTimeout(function() {
            if (isError) {
                if (errorcallback) {
                    errorcallback(xmldocpath, xmldocpath, xmlhttp);
                }
                return;
            }
            try {

                xmlhttp.send();
            } catch (error) {
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
        return function() {
            errorcallback('Error loading file', xmldocpath, xmlhttp);
        };
    }

    function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback, donotparse) {
        return function() {
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
        return function() {
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
                } catch (e) {}
                if (xml && firstChild) {
                    return completecallback(xmlhttp);
                }
                var parsedXML = utils.parseXML(xmlhttp.responseText);
                if (parsedXML && parsedXML.firstChild) {
                    xmlhttp = utils.extend({}, xmlhttp, {
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

    /** Takes an XML string and returns an XML object **/
    utils.parseXML = function(input) {
        var parsedXML;
        try {
            // Parse XML in FF/Chrome/Safari/Opera
            if (window.DOMParser) {
                parsedXML = (new window.DOMParser()).parseFromString(input, 'text/xml');
                if (parsedXML.childNodes && parsedXML.childNodes.length &&
                    parsedXML.childNodes[0].firstChild.nodeName === 'parsererror') {
                    return;
                }
            } else {
                // Internet Explorer
                parsedXML = new window.ActiveXObject('Microsoft.XMLDOM');
                parsedXML.async = 'false';
                parsedXML.loadXML(input);
            }
        } catch (e) {
            return;
        }
        return parsedXML;
    };


    /**
     * Ensure a number is between two bounds
     */
    utils.between = function(num, min, max) {
        return Math.max(Math.min(num, max), min);
    };

    /**
     * Convert a time-representing string to a number.
     *
     * @param {String}	The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
     * @return {Number}	The number of seconds.
     */
    utils.seconds = function(str) {
        if (_.isNumber(str)) {
            return str;
        }

        str = str.replace(',', '.');
        var arr = str.split(':');
        var sec = 0;
        if (str.slice(-1) === 's') {
            sec = parseFloat(str);
        } else if (str.slice(-1) === 'm') {
            sec = parseFloat(str) * 60;
        } else if (str.slice(-1) === 'h') {
            sec = parseFloat(str) * 3600;
        } else if (arr.length > 1) {
            sec = parseFloat(arr[arr.length - 1]);
            sec += parseFloat(arr[arr.length - 2]) * 60;
            if (arr.length === 3) {
                sec += parseFloat(arr[arr.length - 3]) * 3600;
            }
        } else {
            sec = parseFloat(str);
        }
        return sec;
    };

    /**
     * Basic serialization: string representations of booleans and numbers are
     * returned typed
     *
     * @param {String}
     *            val String value to serialize.
     * @return {Object} The original value in the correct primitive type.
     */
    utils.serialize = function(val) {
        if (val === null) {
            return null;
        } else if (val.toString().toLowerCase() === 'true') {
            return true;
        } else if (val.toString().toLowerCase() === 'false') {
            return false;
        } else if (isNaN(Number(val)) || val.length > 5 || val.length === 0) {
            return val;
        } else {
            return Number(val);
        }
    };

    utils.addClass = function(element, classes) {
        // TODO:: use _.union on the two arrays

        var originalClasses = _.isString(element.className) ? element.className.split(' ') : [];
        var addClasses = _.isArray(classes) ? classes : classes.split(' ');

        _.each(addClasses, function(c) {
            if (! _.contains(originalClasses, c)) {
                originalClasses.push(c);
            }
        });

        element.className = utils.trim(originalClasses.join(' '));
    };

    utils.removeClass = function(element, c) {
        var originalClasses = _.isString(element.className) ? element.className.split(' ') : [];
        var removeClasses = _.isArray(c) ? c : c.split(' ');

        element.className = utils.trim(_.difference(originalClasses, removeClasses).join(' '));
    };

    utils.emptyElement = function(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };

    utils.indexOf = _.indexOf;
    utils.noop = function() {};

    utils.canCast = function() {
        var cast = jwplayer.cast;
        return !!(cast && _.isFunction(cast.available) && cast.available());
    };

})(jwplayer);
