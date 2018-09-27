import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';

const pluginsModel = new PluginsModel();

export const registerPlugin = function(name, minimumVersion, pluginClass) {
    let plugin = pluginsModel.addPlugin(name);
    if (!plugin.js) {
        plugin.registerPlugin(name, minimumVersion, pluginClass);
    }
};

export default function loadPlugins(model, api) {
    const pluginsConfig = model.get('plugins');

    window.jwplayerPluginJsonp = registerPlugin;

    const pluginLoader = model.pluginLoader =
        model.pluginLoader || new PluginsLoader();

    return pluginLoader.load(api, pluginsModel, pluginsConfig, model).then(results => {
        if (model.attributes._destroyed) {
            // Player and plugin loader was replaced
            return;
        }
        delete window.jwplayerPluginJsonp;
        return results;
    });
}
