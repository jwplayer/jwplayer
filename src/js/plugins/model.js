import Plugin from 'plugins/plugin';
import { log } from 'utils/log';
import { getPluginName } from 'plugins/utils';

const pluginsRegistered = {};
const PluginModel = function() {};
const prototype = PluginModel.prototype;

prototype.setupPlugin = function(url) {
    const registeredPlugin = this.getPlugin(url);
    if (registeredPlugin) {
        if (registeredPlugin.url !== url) {
            log(`JW Plugin "${getPluginName(url)}" already loaded from "${registeredPlugin.url}". Ignoring "${url}."`);
        }
        return registeredPlugin.promise;
    }
    const plugin = this.addPlugin(url);
    return plugin.load();
};

prototype.addPlugin = function(url) {
    const pluginName = getPluginName(url);
    let plugin = pluginsRegistered[pluginName];
    if (!plugin) {
        plugin = new Plugin(url);
        pluginsRegistered[pluginName] = plugin;
    }
    return plugin;
};

prototype.getPlugin = function(url) {
    return pluginsRegistered[getPluginName(url)];
};

prototype.removePlugin = function(url) {
    delete pluginsRegistered[getPluginName(url)];
};

prototype.getPlugins = function() {
    return pluginsRegistered;
};

export default PluginModel;
