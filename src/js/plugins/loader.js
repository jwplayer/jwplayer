import { getPluginName } from 'plugins/utils';
import Promise from 'polyfills/promise';
import utils from 'utils/helpers';

function addToPlayerGenerator(_api, pluginInstance, div) {
    return function() {
        const overlaysElement = _api.getContainer().querySelector('.jw-overlays');
        if (!overlaysElement) {
            return;
        }
        div.left = overlaysElement.style.left;
        div.top = overlaysElement.style.top;
        overlaysElement.appendChild(div);
        pluginInstance.displayArea = overlaysElement;
    };
}

function pluginResizeGenerator(pluginInstance) {
    function resize() {
        var displayarea = pluginInstance.displayArea;
        if (displayarea) {
            pluginInstance.resize(displayarea.clientWidth, displayarea.clientHeight);
        }
    }
    return function() {
        resize();
        // Sometimes a mobile device may trigger resize before the new sizes are finalized
        setTimeout(resize, 400);
    };
}

function configurePlugins(pluginsConfig, flashPlugins, api, plugins) {
    Object.keys(pluginsConfig).forEach(pluginKey => {
        const config = pluginsConfig[pluginKey];
        const pluginName = getPluginName(pluginKey);
        const pluginObj = plugins[pluginName];
        const flashPath = pluginObj.getFlashPath();
        const jsPlugin = pluginObj.getJS();
        const pluginURL = pluginObj.getURL();

        if (flashPath) {
            var flashPluginConfig = Object.assign({
                name: pluginName,
                swf: flashPath,
                pluginmode: pluginObj.getPluginmode()
            }, config);
            flashPlugins.push(flashPluginConfig);
        }

        const status = utils.tryCatch(function() {
            if (jsPlugin) {
                const pluginConfig = pluginsConfig[pluginURL];

                if (!pluginConfig) {
                    utils.log('JW Plugin already loaded', pluginName, pluginURL);
                    return;
                }

                const div = document.createElement('div');
                div.id = api.id + '_' + pluginName;
                div.className = 'jw-plugin jw-reset';

                const pluginOptions = Object.assign({}, pluginConfig);
                const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

                pluginInstance.addToPlayer = addToPlayerGenerator(api, pluginInstance, div);
                pluginInstance.resizeHandler = pluginResizeGenerator(pluginInstance);

                api.addPlugin(pluginName, pluginInstance, div);
            }

        });

        if (status instanceof utils.Error) {
            utils.log('ERROR: Failed to load ' + pluginName + '.');
        }
    });
}

const PluginLoader = function (model, _config) {
    const _this = this;

    _this.setupPlugins = function (api, playerModel) {
        const flashPlugins = [];
        const pluginsConfig = playerModel.get('plugins');
        if (pluginsConfig) {
            const plugins = model.getPlugins();
            configurePlugins(pluginsConfig, flashPlugins, api, plugins);
        }
        playerModel.set('flashPlugins', flashPlugins);
    };

    _this.load = function () {
        // Must be a hash map
        if (!_config || typeof _config !== 'object') {
            return Promise.resolve();
        }

        /** First pass to create the plugins and add listeners **/
        Object.keys(_config).forEach(pluginUrl => {
            if (pluginUrl) {
                model.addPlugin(pluginUrl);
            }
        });

        const plugins = model.getPlugins();

        /** Second pass to actually load the plugins **/
        const pluginPromises = Object.keys(plugins).map(name => {
            // Plugin object ensures that it's only loaded once
            return plugins[name].load().catch(error => error);
        });

        return Promise.all(pluginPromises);
    };

};

export default PluginLoader;
