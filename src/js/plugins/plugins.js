import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';
import Plugin from 'plugins/plugin';
import utils from 'utils/helpers';

const pluginsRegistered = {};
const pluginLoaders = {};

export const loadPlugins = function(id, config) {
    pluginLoaders[id] = new PluginsLoader(new PluginsModel(pluginsRegistered), config);
    return pluginLoaders[id];
};

export const registerPlugin = function(name, minimumVersion, pluginClass) {
    let plugin = pluginsRegistered[name];
    if (!plugin) {
        plugin = new Plugin(name);
        pluginsRegistered[name] = plugin;
    }
    if (!plugin.js) {
        plugin.registerPlugin(name, minimumVersion, pluginClass);
    } else {
        utils.log('JW Plugin already loaded', name);
    }
};
