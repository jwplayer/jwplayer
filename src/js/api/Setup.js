import loadCoreBundle from 'api/core-loader';
import loadPlugins from 'plugins/plugins';
import {
    loadProvider,
    loadModules,
    loadSkin,
    loadTranslations
} from 'api/setup-steps';
import { PlayerError, SETUP_ERROR_TIMEOUT, MSG_CANT_LOAD_PLAYER } from 'api/errors';

const SETUP_TIMEOUT = 60 * 1000;

const Setup = function(_model) {

    let _setupFailureTimeout;

    this.start = function (api) {

        const pluginsPromise = loadPlugins(_model, api);

        const setup = Promise.all([
            loadCoreBundle(_model),
            pluginsPromise,
            loadProvider(_model),
            loadModules(_model, api),
            loadSkin(_model),
            loadTranslations(_model)
        ]);

        const timeout = new Promise((resolve, reject) => {
            _setupFailureTimeout = setTimeout(() => {
                reject(new PlayerError(MSG_CANT_LOAD_PLAYER, SETUP_ERROR_TIMEOUT));
            }, SETUP_TIMEOUT);
            const timeoutCancelled = () => {
                clearTimeout(_setupFailureTimeout);
                setTimeout(resolve, SETUP_TIMEOUT);
            };
            setup.then(timeoutCancelled).catch(timeoutCancelled);
        });

        return Promise.race([setup, timeout]).catch(error => {
            const throwError = () => {
                throw error;
            };
            return pluginsPromise.then(throwError).catch(throwError);
        });
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _model.set('_destroyed', true);
        _model = null;
    };

};

export default Setup;
