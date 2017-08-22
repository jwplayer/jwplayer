import startSetup from 'api/setup-steps';

const SETUP_TIMEOUT_SECONDS = 30;

const Setup = function(_model) {

    let _setupFailureTimeout;

    this.start = function () {
        const setupPromise = startSetup(_model);
        return new Promise((resolve, reject) => {
            _setupFailureTimeout = setTimeout(() => {
                reject(new Error(`Setup Timeout Error: Setup took longer than ${SETUP_TIMEOUT_SECONDS} seconds to complete.`));
            }, SETUP_TIMEOUT_SECONDS * 1000);
            return setupPromise.then(resolve).catch(reject);
        });
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _model = null;
    };

};

export default Setup;
