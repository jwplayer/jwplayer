define(['plugins/plugin_utils', 'plugins/plugin'], function(pluginUtils, Plugin) {

    var PluginModel = function (plugins) {
        this.addPlugin = function (url) {
            var pluginName = pluginUtils.getPluginName(url);
            if (!plugins[pluginName]) {
                plugins[pluginName] = new Plugin(url);
            }
            return plugins[pluginName];
        };

        this.getPlugins = function () {
            return plugins;
        };
    };

    return PluginModel;
});
