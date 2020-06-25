import ScriptLoader from 'utils/scriptloader';
import { getAbsolutePath } from 'utils/parser';
import { extension } from 'utils/strings';
import { PlayerError } from 'api/errors';
import { getPluginErrorCode } from 'plugins/utils';

// Note please replace the Plugin generic type when this file is typed

const PLUGIN_PATH_TYPE_ABSOLUTE = 0;
const PLUGIN_PATH_TYPE_RELATIVE = 1;
const PLUGIN_PATH_TYPE_CDN = 2;

const getPluginPathType = function (path) {
    if (typeof path !== 'string') {
        return;
    }
    path = path.split('?')[0];
    const protocol = path.indexOf('://');
    if (protocol > 0) {
        return PLUGIN_PATH_TYPE_ABSOLUTE;
    }
    const folder = path.indexOf('/');
    const fileExtension = extension(path);
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

const Plugin = function(url) {
    this.url = url;
    this.promise_ = null;
};

Object.defineProperties(Plugin.prototype, {
    promise: {
        get() {
            return this.promise_ || this.load();
        },
        set() {}
    }
});

Object.assign(Plugin.prototype, {

    load() {
        let promise = this.promise_;
        if (!promise) {
            if (getPluginPathType(this.url) === PLUGIN_PATH_TYPE_CDN) {
                promise = Promise.resolve(this);
            } else {
                const loader = new ScriptLoader(getJSPath(this.url));
                this.loader = loader;
                promise = loader.load().then(() => this);
            }
            this.promise_ = promise;
        }

        return promise;
    },

    registerPlugin(name, minimumVersion, pluginClass) {
        this.name = name;
        this.target = minimumVersion;
        this.js = pluginClass;
    },

    getNewInstance(api, config, div) {
        const PluginClass = this.js;
        if (typeof PluginClass !== 'function') {
            throw new PlayerError(null, getPluginErrorCode(this.url) + 100);
        }
        const pluginInstance = new PluginClass(api, config, div);

        pluginInstance.addToPlayer = function() {
            if (__HEADLESS__) {
                return;
            }
            const overlaysElement = api.getContainer().querySelector('.jw-overlays');
            if (!overlaysElement) {
                return;
            }
            div.left = overlaysElement.style.left;
            div.top = overlaysElement.style.top;
            overlaysElement.appendChild(div);
            pluginInstance.displayArea = overlaysElement;
        };

        pluginInstance.resizeHandler = function() {
            const displayarea = pluginInstance.displayArea;
            if (displayarea) {
                pluginInstance.resize(displayarea.clientWidth, displayarea.clientHeight);
            }
        };

        return pluginInstance;
    }
});

export default Plugin;
