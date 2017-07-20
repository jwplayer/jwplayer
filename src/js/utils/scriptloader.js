import { ERROR_EVENT, MEDIA_COMPLETE } from 'events/events';

define([
    'utils/backbone.events'
], function(Events) {
    const _loaders = {};

    const STATUS = {
        NEW: 0,
        LOADING: 1,
        ERROR: 2,
        COMPLETE: 3
    };

    const scriptloader = function (url, isStyle) {
        const _this = this;
        let _status = STATUS.NEW;


        function _sendError(evt) {
            _status = STATUS.ERROR;
            _this.trigger(ERROR_EVENT, evt);
        }

        function _sendComplete(evt) {
            _status = STATUS.COMPLETE;
            _this.trigger(MEDIA_COMPLETE, evt);
        }

        this.makeStyleLink = function(styleUrl) {
            const link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = styleUrl;
            return link;
        };
        this.makeScriptTag = function(scriptUrl) {
            const scriptTag = document.createElement('script');
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
            const sameLoader = _loaders[url];
            if (sameLoader) {
                _status = sameLoader.getStatus();
                if (_status < 2) {
                    // dispatch to this instances listeners when the first loader gets updates
                    sameLoader.on(ERROR_EVENT, _sendError);
                    sameLoader.on(MEDIA_COMPLETE, _sendComplete);
                    return;
                }
                // already errored or loaded... keep going?
            }

            const head = document.getElementsByTagName('head')[0] || document.documentElement;
            const scriptTag = this.makeTag(url);

            let done = false;
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

    Object.assign(scriptloader.prototype, Events, {
        addEventListener: Events.on,
        removeEventListener: Events.off
    });


    return scriptloader;
});
