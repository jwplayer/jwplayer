import startSetup from 'api/setup-steps';
import loadCoreBundle from 'api/core-loader';
import loadPlugins from 'plugins/plugins';
import Promise from 'polyfills/promise';

const SETUP_TIMEOUT_SECONDS = 30;

const Setup = function(model, api) {

    let _setupFailureTimeout;

    this.start = function () {
        return new Promise((resolve, reject) => {

            _setupFailureTimeout = setTimeout(() => {
                reject(new Error(`Setup Timeout Error: Setup took longer than ${SETUP_TIMEOUT_SECONDS} seconds to complete.`));
            }, SETUP_TIMEOUT_SECONDS * 1000);

            return Promise.all([
                loadCoreBundle(model),
                startSetup(model),
                loadPlugins(model, api)
            ]).then(allPromises => {
                const CoreMixin = allPromises[0];
                resolve(CoreMixin);
            }).catch(reject);
        });
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
    };

};

export default Setup;
