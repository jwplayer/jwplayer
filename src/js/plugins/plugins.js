import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';
import { log } from 'utils/helpers';

const pluginsModel = new PluginsModel();
const pluginLoaders = {};

function getPluginLoader(id) {
    pluginLoaders[id] = new PluginsLoader();
    return pluginLoaders[id];
}

export const registerPlugin = function(name, minimumVersion, pluginClass) {
    let plugin = pluginsModel.addPlugin(name);
    if (!plugin.js) {
        plugin.registerPlugin(name, minimumVersion, pluginClass);
    }
};

export default function loadPlugins(model, api) {
    const playerId = model.get('id');
    const pluginsConfig = model.get('plugins');

    window.jwplayerPluginJsonp = registerPlugin;

    const pluginLoader = getPluginLoader(playerId);
    return pluginLoader.load(api, pluginsModel, pluginsConfig).then(events => {
        if (pluginLoader !== pluginLoaders[playerId]) {
            // Player and plugin loader was replaced
            return;
        }
        if (events) {
            events.forEach(object => {
                if (object instanceof Error) {
                    log(object.message);
                }
            });
        }
        delete window.jwplayerPluginJsonp;
    });
}
