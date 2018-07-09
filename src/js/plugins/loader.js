import Promise, { resolved } from 'polyfills/promise';

function configurePlugin(pluginObj, pluginConfig, api) {
    const pluginName = pluginObj.name;

    const div = document.createElement('div');
    div.id = api.id + '_' + pluginName;
    div.className = 'jw-plugin jw-reset';

    const pluginOptions = Object.assign({}, pluginConfig);
    const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

    api.addPlugin(pluginName, pluginInstance);
    return pluginInstance;
}

const PluginLoader = function() {
    this.load = function(api, pluginsModel, pluginsConfig, model) {
        // Must be a hash map
        if (!pluginsConfig || typeof pluginsConfig !== 'object') {
            return resolved;
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
                    if (!(error instanceof Error)) {
                        return new Error(`Error in ${pluginUrl} "${error}"`);
                    }
                    return error;
                });
            }));
    };

};

export default PluginLoader;
