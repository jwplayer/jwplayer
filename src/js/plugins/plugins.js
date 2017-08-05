import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';
import Plugin from 'plugins/plugin';
import { getPluginName } from 'plugins/utils';

const pluginsRegistered = {};
const pluginLoaders = {};

export const loadPlugins = function(id, config) {
    pluginLoaders[id] = new PluginsLoader(new PluginsModel(pluginsRegistered), config);
    return pluginLoaders[id];
};

export const registerPlugin = function(id, target, arg1, arg2) {
    var pluginId = getPluginName(id);
    if (!pluginsRegistered[pluginId]) {
        pluginsRegistered[pluginId] = new Plugin(id);
    }
    pluginsRegistered[pluginId].registerPlugin(id, target, arg1, arg2);
};
