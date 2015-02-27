define([
    'utils/helpers',
    'plugins/utils',
    'events/events',
    'utils/eventdispatcher',
    'utils/scriptloader',
    'underscore'
], function(utils, pluginsUtils, events, eventdispatcher, scriptloader, _) {

    var pluginmodes = {
        FLASH: 0,
        JAVASCRIPT: 1,
        HYBRID: 2
    };

    var Plugin = function(url) {
        var _status = scriptloader.loaderstatus.NEW,
            _flashPath,
            _js,
            _target,
            _completeTimeout;

        var _eventDispatcher = new eventdispatcher();
        _.extend(this, _eventDispatcher);

        function getJSPath() {
            switch (pluginsUtils.getPluginPathType(url)) {
                case pluginsUtils.pluginPathType.ABSOLUTE:
                    return url;
                case pluginsUtils.pluginPathType.RELATIVE:
                    return utils.getAbsolutePath(url, window.location.href);
            }
        }

        function completeHandler() {
            _completeTimeout = setTimeout(function() {
                _status = scriptloader.loaderstatus.COMPLETE;
                _eventDispatcher.sendEvent(events.COMPLETE);
            }, 1000);
        }

        function errorHandler() {
            _status = scriptloader.loaderstatus.ERROR;
            _eventDispatcher.sendEvent(events.ERROR, {url: url});
        }

        this.load = function() {
            if (_status ===scriptloader.loaderstatus.NEW) {
                if (url.lastIndexOf('.swf') > 0) {
                    _flashPath = url;
                    _status = scriptloader.loaderstatus.COMPLETE;
                    _eventDispatcher.sendEvent(events.COMPLETE);
                    return;
                } else if (pluginsUtils.getPluginPathType(url) === pluginsUtils.pluginPathType.CDN) {
                    _status = scriptloader.loaderstatus.COMPLETE;
                    _eventDispatcher.sendEvent(events.COMPLETE);
                    return;
                }
                _status = scriptloader.loaderstatus.LOADING;
                var _loader = new scriptloader(getJSPath());
                // Complete doesn't matter - we're waiting for registerPlugin
                _loader.addEventListener(events.COMPLETE, completeHandler);
                _loader.addEventListener(events.ERROR, errorHandler);
                _loader.load();
            }
        };

        this.registerPlugin = function(id, target, arg1, arg2) {
            if (_completeTimeout) {
                clearTimeout(_completeTimeout);
                _completeTimeout = undefined;
            }
            _target = target;
            if (arg1 && arg2) {
                _flashPath = arg2;
                _js = arg1;
            } else if (typeof arg1 === 'string') {
                _flashPath = arg1;
            } else if (typeof arg1 === 'function') {
                _js = arg1;
            } else if (!arg1 && !arg2) {
                _flashPath = id;
            }
            _status =scriptloader.loaderstatus.COMPLETE;
            _eventDispatcher.sendEvent(events.COMPLETE);
        };

        this.getStatus = function() {
            return _status;
        };

        this.getPluginName = function() {
            return pluginsUtils.getPluginName(url);
        };

        this.getFlashPath = function() {
            if (_flashPath) {
                switch (pluginsUtils.getPluginPathType(_flashPath)) {
                    case pluginsUtils.pluginPathType.ABSOLUTE:
                        return _flashPath;
                    case pluginsUtils.pluginPathType.RELATIVE:
                        if (url.lastIndexOf('.swf') > 0) {
                            return utils.getAbsolutePath(_flashPath, window.location.href);
                        }
                        return utils.getAbsolutePath(_flashPath, getJSPath());
//                    case utils.pluginPathType.CDN:
//                        if (_flashPath.indexOf('-') > -1){
//                            return _flashPath+'h';
//                        }
//                        return _flashPath+'-h';
                }
            }
            return null;
        };

        this.getJS = function() {
            return _js;
        };

        this.getTarget = function() {
            return _target;
        };

        this.getPluginmode = function() {
            if (typeof _flashPath !== undefined && typeof _js !== undefined) {
                return pluginmodes.HYBRID;
            } else if (typeof _flashPath !== undefined) {
                return pluginmodes.FLASH;
            } else if (typeof _js !== undefined) {
                return pluginmodes.JAVASCRIPT;
            }
        };

        this.getNewInstance = function(api, config, div) {
            return new _js(api, config, div);
        };

        this.getURL = function() {
            return url;
        };
    };

    return Plugin;

});
