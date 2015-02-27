define([
    'plugins/utils',
    'plugins/plugin'
], function(pluginsUtils, Plugin) {

    var PluginModel = function (plugins) {
        this.addPlugin = function (url) {
            var pluginName = pluginsUtils.getPluginName(url);
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
