import { getPluginName } from 'plugins/utils';
import Plugin from 'plugins/plugin';

const PluginModel = function (plugins) {
    this.addPlugin = function (url) {
        var pluginName = getPluginName(url);
        if (!plugins[pluginName]) {
            plugins[pluginName] = new Plugin(url);
        }
        return plugins[pluginName];
    };

    this.getPlugins = function () {
        return plugins;
    };
};

export default PluginModel;
