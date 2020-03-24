import Plugin from 'plugins/plugin';
import { log } from 'utils/log';
import { getPluginName } from 'plugins/utils';
import type { PluginObj } from 'types/generic.type';

export interface PluginModelInt extends Function {
    addPlugin: (url: string) => PluginObj;
    setupPlugin: (url: string) => Promise<PluginObj>;
    getPlugin: (name: string) => PluginObj;
    removePlugin: (name: string) => void;
    getPlugins: () => { [key: string]: PluginObj };
}

const pluginsRegistered: { [key: string]: PluginObj } = {};

const PluginModel = function(this: PluginModelInt): void {
    this.setupPlugin = function(url: string): Promise<PluginObj> {
        const registeredPlugin = this.getPlugin(url);
        if (registeredPlugin) {
            if (registeredPlugin.url !== url) {
                log(`JW Plugin "${getPluginName(url)}" already loaded from "${registeredPlugin.url}". Ignoring "${url}."`);
            }
            return registeredPlugin.promise;
        }
        const plugin = this.addPlugin(url);
        return plugin.load();
    };

    this.addPlugin = function(url: string): PluginObj {
        const pluginName = getPluginName(url);
        let plugin = pluginsRegistered[pluginName];
        if (!plugin) {
            plugin = new Plugin(url);
            pluginsRegistered[pluginName] = plugin;
        }
        return plugin;
    };

    this.getPlugin = function(name: string): PluginObj {
        return pluginsRegistered[getPluginName(name)];
    };

    this.removePlugin = function(name: string): void {
        delete pluginsRegistered[getPluginName(name)];
    };

    this.getPlugins = function(): { [key: string]: PluginObj } {
        return pluginsRegistered;
    };

};

export default PluginModel;
