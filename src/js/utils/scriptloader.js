import Events from 'utils/backbone.events';
import { ERROR, STATE_COMPLETE } from 'events/events';
import Promise from 'polyfills/promise';

const ScriptPromises = {};

const SCRIPT_LOAD_TIMEOUT = 15000;

export const SCRIPT_LOAD_STATUS_NEW = 0;
export const SCRIPT_LOAD_STATUS_LOADING = 1;
export const SCRIPT_LOAD_STATUS_ERROR = 2;
export const SCRIPT_LOAD_STATUS_COMPLETE = 3;

function makeStyleLink(styleUrl) {
    const link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = styleUrl;
    return link;
}

function makeScriptTag(scriptUrl) {
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.charset = 'utf-8';
    scriptTag.async = true;
    scriptTag.timeout = SCRIPT_LOAD_TIMEOUT;
    scriptTag.src = scriptUrl;
    return scriptTag;
}

const ScriptLoader = function (url, isStyle) {
    const _this = this;
    let status = SCRIPT_LOAD_STATUS_NEW;


    function onError(evt) {
        status = SCRIPT_LOAD_STATUS_ERROR;
        _this.trigger(ERROR, evt).off();
    }

    function onComplete(evt) {
        status = SCRIPT_LOAD_STATUS_COMPLETE;
        _this.trigger(STATE_COMPLETE, evt).off();
    }

    this.getStatus = function () {
        return status;
    };

    this.load = function () {
        let promise = ScriptPromises[url];

        // Only execute on the first run
        if (status !== SCRIPT_LOAD_STATUS_NEW) {
            return promise;
        }

        // If we already have a scriptloader loading the same script, don't create a new one;
        if (promise) {
            promise.then(onComplete).catch(onError);
        }

        status = SCRIPT_LOAD_STATUS_LOADING;

        promise = new Promise((resolve, reject) => {
            const makeTag = (isStyle ? makeStyleLink : makeScriptTag);
            const scriptTag = makeTag(url);
            const doneLoading = function() {
                // Handle memory leak in IE
                scriptTag.onerror = scriptTag.onload = null;
                clearTimeout(timeout);
            };
            const onScriptLoadingError = function(error) {
                doneLoading();
                onError(error);
                reject(error);
            };
            const timeout = setTimeout(() => {
                onScriptLoadingError(new Error(`Network timeout ${url}`));
            }, SCRIPT_LOAD_TIMEOUT);

            scriptTag.onerror = function() {
                onScriptLoadingError(new Error(`Failed to load ${url}`));
            };

            scriptTag.onload = function(evt) {
                doneLoading();
                onComplete(evt);
                resolve(evt);
            };

            const head = document.getElementsByTagName('head')[0] || document.documentElement;
            head.insertBefore(scriptTag, head.firstChild);
        });

        ScriptPromises[url] = promise;

        return promise;
    };
};

Object.assign(ScriptLoader.prototype, Events);

export default ScriptLoader;
