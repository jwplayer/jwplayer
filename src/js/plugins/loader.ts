import { PlayerError } from 'api/errors';
import { configurePlugin, getPluginErrorCode } from 'plugins/utils';
import type { PlayerAPI, GenericObject, PluginObj } from 'types/generic.type';
import type SimpleModel from 'model/simplemodel';
import type PluginModel from './model';

type LoadPromiseType = Promise<PluginObj | PlayerError | void>;

export interface PluginLoaderInt {
    load: (api: PlayerAPI, pluginsModel: PluginModel, pluginsConfig: GenericObject, model: SimpleModel) => LoadPromiseType;
}

const PluginLoader = function (this: PluginLoaderInt): void {
    this.load = function (api: PlayerAPI, pluginsModel: PluginModel, pluginsConfig: GenericObject, model: SimpleModel): LoadPromiseType {
        // Must be a hash map
        if (!pluginsConfig || typeof pluginsConfig !== 'object') {
            return Promise.resolve();
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
                    if (!error.code) {
                        return new PlayerError(null, getPluginErrorCode(pluginUrl), error);
                    }
                    return error;
                });
            }));
    };
};

export default PluginLoader;
