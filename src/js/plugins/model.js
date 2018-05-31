import Plugin from 'plugins/plugin';
import { log } from 'utils/log';

const pluginsRegistered = {};

// Extract a plugin name from a string
const getPluginName = function (url) {
    // Regex locates the characters after the last slash, until it encounters a dash.
    return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
};

const PluginModel = function () {
    this.addPlugin = function (url, fromLoader) {
        const pluginName = getPluginName(url);
        let plugin = pluginsRegistered[pluginName];
        if (!plugin) {
            plugin = new Plugin(url);
            pluginsRegistered[pluginName] = plugin;
        } else if (fromLoader && plugin.url !== url) {
            log(`JW Plugin "${pluginName}" already loaded from "${plugin.url}". Ignoring "${url}."`);
        }
        return plugin;
    };

    this.getPlugins = function () {
        return pluginsRegistered;
    };
};

export default PluginModel;
