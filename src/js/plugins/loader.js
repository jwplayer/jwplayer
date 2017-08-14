import Promise from 'polyfills/promise';

function configurePlugin(pluginObj, api) {
    const pluginName = pluginObj.name;
    const config = pluginObj.config;

    const div = document.createElement('div');
    div.id = api.id + '_' + pluginName;
    div.className = 'jw-plugin jw-reset';

    const pluginOptions = Object.assign({}, config);
    const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

    api.addPlugin(pluginName, pluginInstance, div);
}

const PluginLoader = function (pluginsModel, _config) {
    this.load = function (api) {
        // Must be a hash map
        if (!_config || typeof _config !== 'object') {
            return Promise.resolve();
        }

        /** First pass to create the plugins and add listeners **/
        Object.keys(_config).forEach(pluginUrl => {
            if (pluginUrl) {
                pluginsModel.addPlugin(pluginUrl, _config[pluginUrl]);
            }
        });

        const plugins = pluginsModel.getPlugins();

        /** Second pass to actually load the plugins **/
        const pluginPromises = Object.keys(plugins).map(name => {
            // Plugin object ensures that it's only loaded once
            const plugin = plugins[name];
            return plugin.load().then(() => {
                configurePlugin(plugin, api);
            }).catch(error => error);
        });

        return Promise.all(pluginPromises);
    };

};

export default PluginLoader;
