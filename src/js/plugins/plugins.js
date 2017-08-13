import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';
import Plugin from 'plugins/plugin';
import { log } from 'utils/helpers';

const pluginsRegistered = {};
const pluginLoaders = {};

function getPluginLoader(id, config) {
    pluginLoaders[id] = new PluginsLoader(new PluginsModel(pluginsRegistered), config);
    return pluginLoaders[id];
}

export const registerPlugin = function(name, minimumVersion, pluginClass) {
    let plugin = pluginsRegistered[name];
    if (!plugin) {
        plugin = new Plugin(name);
        pluginsRegistered[name] = plugin;
    }
    if (!plugin.js) {
        plugin.registerPlugin(name, minimumVersion, pluginClass);
    } else {
        log('JW Plugin already loaded', name);
    }
};

export default function loadPlugins(model, api) {
    const playerId = model.get('id');
    const plugins = model.get('plugins');

    window.jwplayerPluginJsonp = registerPlugin;

    const pluginLoader = getPluginLoader(playerId, plugins);
    return pluginLoader.load(api).then(events => {
        if (events) {
            events.forEach(object => {
                if (object instanceof Error) {
                    log(object.message);
                }
            });
        }
    }).then(() => {
        delete window.jwplayerPluginJsonp;
    });
}
