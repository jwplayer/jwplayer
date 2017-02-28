define([
    'events/events',
    'utils/backbone.events',
    'utils/underscore'
], function(events, Events, _) {
    var _loaders = {};

    var STATUS = {
        NEW: 0,
        LOADING: 1,
        ERROR: 2,
        COMPLETE: 3
    };

    var scriptloader = function (url, isStyle) {
        var _this = _.extend(this, Events);
        var _status = STATUS.NEW;

        // legacy support
        this.addEventListener = this.on;
        this.removeEventListener = this.off;


        function _sendError(evt) {
            _status = STATUS.ERROR;
            _this.trigger(events.ERROR, evt);
        }

        function _sendComplete(evt) {
            _status = STATUS.COMPLETE;
            _this.trigger(events.COMPLETE, evt);
        }

        this.makeStyleLink = function(styleUrl) {
            var link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = styleUrl;
            return link;
        };
        this.makeScriptTag = function(scriptUrl) {
            var scriptTag = document.createElement('script');
            scriptTag.src = scriptUrl;
            return scriptTag;
        };

        this.makeTag = (isStyle ? this.makeStyleLink : this.makeScriptTag);

        this.load = function () {
            // Only execute on the first run
            if (_status !== STATUS.NEW) {
                return;
            }

            // If we already have a scriptloader loading the same script, don't create a new one;
            var sameLoader = _loaders[url];
            if (sameLoader) {
                _status = sameLoader.getStatus();
                if (_status < 2) {
                    // dispatch to this instances listeners when the first loader gets updates
                    sameLoader.on(events.ERROR, _sendError);
                    sameLoader.on(events.COMPLETE, _sendComplete);
                    return;
                }
                // already errored or loaded... keep going?
            }

            var head = document.getElementsByTagName('head')[0] || document.documentElement;
            var scriptTag = this.makeTag(url);

            var done = false;
            scriptTag.onload = scriptTag.onreadystatechange = function (evt) {
                if (!done &&
                    (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
                    done = true;
                    _sendComplete(evt);

                    // Handle memory leak in IE
                    scriptTag.onload = scriptTag.onreadystatechange = null;
                    if (head && scriptTag.parentNode && !isStyle) {
                        head.removeChild(scriptTag);
                    }
                }
            };
            scriptTag.onerror = _sendError;

            head.insertBefore(scriptTag, head.firstChild);

            _status = STATUS.LOADING;
            _loaders[url] = this;
        };

        this.getStatus = function () {
            return _status;
        };
    };

    scriptloader.loaderstatus = STATUS;

    return scriptloader;
});
