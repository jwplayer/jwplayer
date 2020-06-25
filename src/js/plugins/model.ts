import Plugin from 'plugins/plugin';
import { log } from 'utils/log';
import { getPluginName } from 'plugins/utils';
import type { PluginObj } from 'types/generic.type';

const pluginsRegistered: { [key: string]: PluginObj } = {};

class PluginModel {
    setupPlugin(url: string): Promise<PluginObj> {
        const registeredPlugin = this.getPlugin(url);
        if (registeredPlugin) {
            if (registeredPlugin.url !== url && !__HEADLESS__) {
                log(`JW Plugin "${getPluginName(url)}" already loaded from "${registeredPlugin.url}". Ignoring "${url}."`);
            }
            return registeredPlugin.promise;
        }
        const plugin = this.addPlugin(url);
        return plugin.load();
    }

    addPlugin(url: string): PluginObj {
        const pluginName = getPluginName(url);
        let plugin = pluginsRegistered[pluginName];
        if (!plugin) {
            plugin = new Plugin(url);
            pluginsRegistered[pluginName] = plugin;
        }
        return plugin;
    }

    getPlugin(name: string): PluginObj {
        return pluginsRegistered[getPluginName(name)];
    }

    removePlugin(name: string): void {
        delete pluginsRegistered[getPluginName(name)];
    }

    getPlugins(): { [key: string]: PluginObj } {
        return pluginsRegistered;
    }

}

export default PluginModel;
