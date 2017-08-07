import Promise from 'polyfills/promise';
import ScriptLoader from 'utils/scriptloader';
import {
    getPluginPathType,
    getPluginName,
    PLUGIN_PATH_TYPE_ABSOLUTE,
    PLUGIN_PATH_TYPE_RELATIVE,
    PLUGIN_PATH_TYPE_CDN
} from 'plugins/utils';
import { getAbsolutePath } from 'utils/parser';

const FLASH = 0;
const JAVASCRIPT = 1;
const HYBRID = 2;

const Plugin = function(url) {
    const _this = this;
    let _flashPath;
    let _js;
    let _target;

    function getJSPath() {
        switch (getPluginPathType(url)) {
            case PLUGIN_PATH_TYPE_ABSOLUTE:
                return url;
            case PLUGIN_PATH_TYPE_RELATIVE:
                return getAbsolutePath(url, window.location.href);
            default:
                break;
        }
    }

    _this.load = function() {
        if (url.lastIndexOf('.swf') > 0) {
            return Promise.resolve();
        }
        if (getPluginPathType(url) === PLUGIN_PATH_TYPE_CDN) {
            return Promise.resolve();
        }
        const loader = new ScriptLoader(getJSPath());
        return loader.load();
    };

    _this.registerPlugin = function(name, minimumVersion, pluginClass, pluginClass2) {
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
    };

    _this.getPluginName = function() {
        return getPluginName(url);
    };

    _this.getFlashPath = function() {
        if (_flashPath) {
            switch (getPluginPathType(_flashPath)) {
                case PLUGIN_PATH_TYPE_ABSOLUTE:
                    return _flashPath;
                case PLUGIN_PATH_TYPE_RELATIVE:
                    if (url.lastIndexOf('.swf') > 0) {
                        return getAbsolutePath(_flashPath, window.location.href);
                    }
                    return getAbsolutePath(_flashPath, getJSPath());
                default:
                    break;
            }
        }
        return null;
    };

    _this.getJS = function() {
        return _js;
    };

    _this.getTarget = function() {
        return _target;
    };

    _this.getPluginmode = function() {
        if (_flashPath && _js) {
            return HYBRID;
        } else if (_js) {
            return JAVASCRIPT;
        } else if (_flashPath) {
            return FLASH;
        }
    };

    _this.getNewInstance = function(api, config, div) {
        return new _js(api, config, div);
    };

    _this.getURL = function() {
        return url;
    };
};

export default Plugin;
