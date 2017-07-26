import startSetup from 'controller/setup-steps';

const SETUP_TIMEOUT_SECONDS = 30;

const Setup = function(_api, _model, _view) {

    let _setupFailureTimeout;

    this.start = function () {
        return new Promise((resolve, reject) => {
            _setupFailureTimeout = setTimeout(() => {
                reject(`Setup Timeout Error: Setup took longer than ${SETUP_TIMEOUT_SECONDS} seconds to complete.`);
            }, SETUP_TIMEOUT_SECONDS * 1000);
            return startSetup(_api, _model, _view).then(resolve).catch(reject);
        });
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _api = null;
        _model = null;
        _view = null;
    };

};

export default Setup;
