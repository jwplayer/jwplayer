import Plugin from 'plugins/plugin';

/**
 * Extracts a plugin name from a string
 */
const getPluginName = function (url) {
    /** Regex locates the characters after the last slash, until it encounters a dash. **/
    return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
};

const PluginModel = function (pluginsRegistered) {
    this.addPlugin = function (url, config) {
        const pluginName = getPluginName(url);
        let plugin = pluginsRegistered[pluginName];
        if (plugin) {
            plugin.config = config;
        } else {
            plugin = new Plugin(url, config);
        }
        pluginsRegistered[pluginName] = plugin;
        return plugin;
    };

    this.getPlugins = function () {
        return pluginsRegistered;
    };
};

export default PluginModel;
