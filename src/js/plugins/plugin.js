import { COMPLETE, ERROR } from 'events/events';

define([
    'utils/helpers',
    'plugins/utils',
    'utils/backbone.events',
    'utils/scriptloader',
    'utils/underscore'
], function(utils, pluginsUtils, Events, Scriptloader, _) {

    var pluginmodes = {
        FLASH: 0,
        JAVASCRIPT: 1,
        HYBRID: 2
    };

    var Plugin = function(url) {
        var _this = _.extend(this, Events);
        var _status = Scriptloader.loaderstatus.NEW;
        var _flashPath;
        var _js;
        var _target;
        var _completeTimeout;

        function getJSPath() {
            switch (pluginsUtils.getPluginPathType(url)) {
                case pluginsUtils.pluginPathType.ABSOLUTE:
                    return url;
                case pluginsUtils.pluginPathType.RELATIVE:
                    return utils.getAbsolutePath(url, window.location.href);
                default:
                    break;
            }
        }

        function completeHandler() {
            _.defer(function() {
                _status = Scriptloader.loaderstatus.COMPLETE;
                _this.trigger(COMPLETE);
            });
        }

        function errorHandler() {
            _status = Scriptloader.loaderstatus.ERROR;
            _this.trigger(ERROR, { url: url });
        }

        this.load = function() {
            if (_status !== Scriptloader.loaderstatus.NEW) {
                return;
            }
            if (url.lastIndexOf('.swf') > 0) {
                _flashPath = url;
                _status = Scriptloader.loaderstatus.COMPLETE;
                _this.trigger(COMPLETE);
                return;
            }
            if (pluginsUtils.getPluginPathType(url) === pluginsUtils.pluginPathType.CDN) {
                _status = Scriptloader.loaderstatus.COMPLETE;
                _this.trigger(COMPLETE);
                return;
            }
            _status = Scriptloader.loaderstatus.LOADING;
            var _loader = new Scriptloader(getJSPath());
            // Complete doesn't matter - we're waiting for registerPlugin
            _loader.on(COMPLETE, completeHandler);
            _loader.on(ERROR, errorHandler);
            _loader.load();
        };

        this.registerPlugin = function(name, minimumVersion, pluginClass, pluginClass2) {
            if (_completeTimeout) {
                clearTimeout(_completeTimeout);
                _completeTimeout = undefined;
            }
            _target = minimumVersion;
            if (pluginClass && pluginClass2) {
                _flashPath = pluginClass2;
                _js = pluginClass;
            } else if (typeof pluginClass === 'string') {
                _flashPath = pluginClass;
            } else if (typeof pluginClass === 'function') {
                _js = pluginClass;
            } else if (!pluginClass && !pluginClass2) {
                _flashPath = name;
            }
            _status = Scriptloader.loaderstatus.COMPLETE;
            _this.trigger(COMPLETE);
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
                    default:
                        break;
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
