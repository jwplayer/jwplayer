import PluginsLoader from 'plugins/loader';
import PluginsModel from 'plugins/model';
import type { PlayerAPI, GenericObject } from 'types/generic.type';
import type SimpleModel from '../model/simplemodel';

const pluginsModel = new PluginsModel();

type PluginFuncDef = (api: PlayerAPI, config: GenericObject, div: HTMLDivElement) => void;

export const registerPlugin = function(name: string, minimumVersion: string, pluginClass: PluginFuncDef): void {
    let plugin = pluginsModel.addPlugin(name);
    if (!plugin.js) {
        plugin.registerPlugin(name, minimumVersion, pluginClass);
    }
};

export default function loadPlugins(model: SimpleModel, api: PlayerAPI): Promise<GenericObject> {
    const pluginsConfig = model.get('plugins');

    window.jwplayerPluginJsonp = registerPlugin;

    const pluginLoader = (model as any).pluginLoader =
        (model as any).pluginLoader || new PluginsLoader();

    return pluginLoader.load(api, pluginsModel, pluginsConfig, model).then(results => {
        if (model.attributes._destroyed) {
            // Player and plugin loader was replaced
            return;
        }
        delete window.jwplayerPluginJsonp;
        return results;
    });
}
