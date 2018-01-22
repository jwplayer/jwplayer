import loadCoreBundle from 'api/core-loader';
import startSetup from 'api/setup-steps';
import loadPlugins from 'plugins/plugins';
import Promise from 'polyfills/promise';

const SETUP_TIMEOUT_SECONDS = 30;

const Setup = function(_model) {

    let _setupFailureTimeout;

    this.start = function (api) {

        const setup = Promise.all([
            loadCoreBundle(_model),
            startSetup(_model),
            loadPlugins(_model, api)
        ]);

        const timeout = new Promise((resolve, reject) => {
            _setupFailureTimeout = setTimeout(() => {
                reject(new Error(`Setup Timeout Error: Setup took longer than ${SETUP_TIMEOUT_SECONDS} seconds to complete.`));
            }, SETUP_TIMEOUT_SECONDS * 1000);
            const timeoutCancelled = () => {
                clearTimeout(_setupFailureTimeout);
                resolve();
            };
            setup.then(timeoutCancelled).catch(timeoutCancelled);
        });

        return Promise.race([setup, timeout]);
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _model = null;
    };

};

export default Setup;
