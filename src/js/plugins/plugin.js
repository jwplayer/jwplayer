import Promise from 'polyfills/promise';
import ScriptLoader from 'utils/scriptloader';
import { getAbsolutePath } from 'utils/parser';
import { extension } from 'utils/strings';

const PLUGIN_PATH_TYPE_ABSOLUTE = 0;
const PLUGIN_PATH_TYPE_RELATIVE = 1;
const PLUGIN_PATH_TYPE_CDN = 2;

const getPluginPathType = function (path) {
    if (typeof path !== 'string') {
        return;
    }
    path = path.split('?')[0];
    var protocol = path.indexOf('://');
    if (protocol > 0) {
        return PLUGIN_PATH_TYPE_ABSOLUTE;
    }
    var folder = path.indexOf('/');
    var fileExtension = extension(path);
    if (protocol < 0 && folder < 0 && (!fileExtension || !isNaN(fileExtension))) {
        return PLUGIN_PATH_TYPE_CDN;
    }
    return PLUGIN_PATH_TYPE_RELATIVE;
};

function getJSPath(url) {
    switch (getPluginPathType(url)) {
        case PLUGIN_PATH_TYPE_ABSOLUTE:
            return url;
        case PLUGIN_PATH_TYPE_RELATIVE:
            return getAbsolutePath(url, window.location.href);
        default:
            break;
    }
}

const Plugin = function(url, config) {
    this.url = url;
    this.config = config;
};

Object.assign(Plugin.prototype, {
    load() {
        if (getPluginPathType(this.url) === PLUGIN_PATH_TYPE_CDN) {
            return Promise.resolve();
        }
        const loader = new ScriptLoader(getJSPath(this.url));
        this.loader = loader;
        return loader.load();
    },

    registerPlugin(name, minimumVersion, pluginClass) {
        this.name = name;
        this.target = minimumVersion;
        this.js = pluginClass;
    },

    getNewInstance(api, config, div) {
        const PluginClass = this.js;
        return new PluginClass(api, config, div);
    }
});

export default Plugin;
