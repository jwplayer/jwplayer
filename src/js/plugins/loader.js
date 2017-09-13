import Promise, { resolved } from 'polyfills/promise';

function configurePlugin(pluginObj, pluginConfig, api) {
    const pluginName = pluginObj.name;

    const div = document.createElement('div');
    div.id = api.id + '_' + pluginName;
    div.className = 'jw-plugin jw-reset';

    const pluginOptions = Object.assign({}, pluginConfig);
    const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

    api.addPlugin(pluginName, pluginInstance);
}

const PluginLoader = function () {
    this.load = function (api, pluginsModel, pluginsConfig) {
        // Must be a hash map
        if (!pluginsConfig || typeof pluginsConfig !== 'object') {
            return resolved;
        }

        return Promise.all(Object.keys(pluginsConfig).filter(pluginUrl => pluginUrl)
            .map(pluginUrl => {
                const plugin = pluginsModel.addPlugin(pluginUrl, true);
                const pluginConfig = pluginsConfig[pluginUrl];
                return plugin.load().then(() => {
                    configurePlugin(plugin, pluginConfig, api);
                }).catch(error => {
                    if (!(error instanceof Error)) {
                        return new Error(`Error in ${pluginUrl} "${error}"`);
                    }
                    return error;
                });
            }));
    };

};

export default PluginLoader;
