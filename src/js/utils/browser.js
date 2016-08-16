define([
    'utils/underscore'
], function(_) {
    var browser = {};
    var partNames = ['major', 'minor', 'patch', 'rev'];

    var _userAgentMatch = _.memoize(function (regex) {
        var agent = navigator.userAgent.toLowerCase();
        return (agent.match(regex) !== null);
    });

    function _browserCheck(regex) {
        return function () {
            return _userAgentMatch(regex);
        };
    }

    function _parseVersion(version) {
        var parts = version.split(/[\s,. ]+/);
        var parsed = {};

        _.forEach(partNames, function(partName, i) {
           parsed[partName] = (i < parts.length)? parts[i] : 0;
        });

        return parsed;
    }

    var _isInt = browser.isInt = function (value) {
        return parseFloat(value) % 1 === 0;
    };

    browser.isFlashSupported = function () {
        var flashVersion = browser.flashVersion();
        return flashVersion && flashVersion >= __FLASH_VERSION__;
    };

    browser.isFF = _browserCheck(/firefox/i);
    browser.isIPod = _browserCheck(/iP(hone|od)/i);
    browser.isIPad = _browserCheck(/iPad/i);
    browser.isSafari602 = _browserCheck(/Macintosh.*Mac OS X 10_8.*6\.0\.\d* Safari/i);
    browser.isOSX = _browserCheck(/Mac OS X/i);
    browser.isEdge = _browserCheck(/\sedge\/\d+/i);

    var _isIETrident = browser.isIETrident = function(browserVersion) {
        if(browser.isEdge()){
            return true;
        }
        if (browserVersion) {
            browserVersion = parseFloat(browserVersion).toFixed(1);
            return _userAgentMatch(new RegExp('trident/.+rv:\\s*' + browserVersion, 'i'));
        }
        return _userAgentMatch(/trident/i);
    };


    var _isMSIE = browser.isMSIE = function(browserVersion) {
        if (browserVersion) {
            browserVersion = parseFloat(browserVersion).toFixed(1);
            return _userAgentMatch(new RegExp('msie\\s*' + browserVersion, 'i'));
        }
        return _userAgentMatch(/msie/i);
    };

    var _isChrome = _browserCheck(/chrome/i);

    browser.isChrome = function(){
        return _isChrome() && !browser.isEdge();
    };

    browser.isIE = function(browserVersion) {
        if (browserVersion) {
            browserVersion = parseFloat(browserVersion).toFixed(1);
            if (browserVersion >= 11) {
                return _isIETrident(browserVersion);
            } else {
                return _isMSIE(browserVersion);
            }
        }
        return _isMSIE() || _isIETrident();
    };

    browser.isSafari = function() {
        return (_userAgentMatch(/safari/i) && !_userAgentMatch(/chrome/i) &&
        !_userAgentMatch(/chromium/i) && !_userAgentMatch(/android/i));
    };

    /** Matches iOS devices **/
    var _isIOS = browser.isIOS = function(osVersion) {
        if (osVersion) {
            return _userAgentMatch(
                new RegExp('iP(hone|ad|od).+\\s(OS\\s'+osVersion+'|.*\\sVersion/'+osVersion+')', 'i')
            );
        }
        return _userAgentMatch(/iP(hone|ad|od)/i);
    };

    /** Matches Android devices **/
    browser.isAndroidNative = function(osVersion) {
        return _isAndroid(osVersion, true);
    };

    var _isAndroid = browser.isAndroid = function(osVersion, excludeChrome) {
        //Android Browser appears to include a user-agent string for Chrome/18
        if (excludeChrome && _userAgentMatch(/chrome\/[123456789]/i) && !_userAgentMatch(/chrome\/18/)) {
            return false;
        }
        if (osVersion) {
            // make sure whole number version check ends with point '.'
            if (_isInt(osVersion) && !/\./.test(osVersion)) {
                osVersion = '' + osVersion + '.';
            }
            return _userAgentMatch(new RegExp('Android\\s*' + osVersion, 'i'));
        }
        return _userAgentMatch(/Android/i);
    };

    /** Matches iOS and Android devices **/
    browser.isMobile = function () {
        return _isIOS() || _isAndroid();
    };

    browser.isIframe = function () {
        return (window.frameElement && (window.frameElement.nodeName === 'IFRAME'));
    };

    /**
     * If the browser has flash capabilities, return the flash version
     */
    browser.flashVersion = function () {
        if (browser.isAndroid()) {
            return 0;
        }

        var plugins = navigator.plugins,
            majorVersion = 0,
            version = '',
            flash;

        if (plugins && plugins['Shockwave Flash']) {
            flash = plugins['Shockwave Flash'];

            if (flash.description) {
                majorVersion = parseFloat(flash.description.replace(/\D+(\d+\.?\d*).*/, '$1'));
            }

            if (flash.version) {
                version = flash.version;
            }
        }

        if (typeof window.ActiveXObject !== 'undefined') {
            try {
                flash = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                if (flash) {
                    version = flash.GetVariable('$version');
                    majorVersion = parseFloat(version.split(' ')[1].replace(/\s*,\s*/, '.'));
                }
            } catch(e) {
                majorVersion = 0;
            }
        }


        if (browser.isFF() && version) {
            var parsedCurrent = _parseVersion(version);
            var parsedLatest = _parseVersion(__FF_FLASH_VERSION__);

            for (var i = 0; i < partNames.length; i += 1) {
                if (parsedCurrent[partNames[i]] < parsedLatest[partNames[i]]) {
                    majorVersion = 0;
                    break;
                }
            }
        }

        return majorVersion;
    };

    return browser;
});
