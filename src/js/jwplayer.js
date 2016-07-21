define([
    'api/global-api',
    'utils/helpers'
], function (GlobalApi, utils) {
    /*global __webpack_public_path__:true*/
    __webpack_public_path__ = utils.loadFrom();

    return GlobalApi.selectPlayer;
});