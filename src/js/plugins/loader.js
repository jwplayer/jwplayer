import { PlayerError } from 'api/errors';
import { configurePlugin, getPluginErrorCode } from 'plugins/utils';

const PluginLoader = function () {
    this.load = function (api, pluginsModel, pluginsConfig, model) {
        // Must be a hash map
        if (!pluginsConfig || typeof pluginsConfig !== 'object') {
            return Promise.resolve();
        }

        return Promise.all(Object.keys(pluginsConfig).filter(pluginUrl => pluginUrl)
            .map(pluginUrl => {
                const pluginConfig = pluginsConfig[pluginUrl];
                return pluginsModel.setupPlugin(pluginUrl).then((plugin) => {
                    if (model.attributes._destroyed) {
                        return;
                    }
                    return configurePlugin(plugin, pluginConfig, api);
                }).catch(error => {
                    pluginsModel.removePlugin(pluginUrl);
                    if (!error.code) {
                        return new PlayerError(null, getPluginErrorCode(pluginUrl), error);
                    }
                    return error;
                });
            }));
    };

};

export default PluginLoader;
