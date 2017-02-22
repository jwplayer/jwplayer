define([
    'plugins/loader',
    'plugins/model',
    'plugins/plugin',
    'plugins/utils'
], function(PluginsLoader, PluginsModel, Plugin, pluginsUtils) {

    var _plugins = {};
    var _pluginLoaders = {};

    var loadPlugins = function(id, config) {
        _pluginLoaders[id] = new PluginsLoader(new PluginsModel(_plugins), config);
        return _pluginLoaders[id];
    };

    var registerPlugin = function(id, target, arg1, arg2) {
        var pluginId = pluginsUtils.getPluginName(id);
        if (!_plugins[pluginId]) {
            _plugins[pluginId] = new Plugin(id);
        }
        _plugins[pluginId].registerPlugin(id, target, arg1, arg2);
    };


    return {
        loadPlugins: loadPlugins,
        registerPlugin: registerPlugin
    };
});
